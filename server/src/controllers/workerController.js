const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all Workers (Admin: All, Employee: Own Only)
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    let filter = { companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const workers = await Worker.find(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(StatusCodes.OK).json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Worker by ID
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid Worker ID format' });
    }

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOne(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Worker Info & Handle Categorized Uploads
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;

    // Extract update fields, excluding documents to handle them separately
    const { category, ...otherUpdates } = req.body;
    let updateData = { ...otherUpdates };

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });

    if (req.body.dob) updateData.dob = new Date(req.body.dob);

    // Handle File Uploads with Category
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        category: req.body.category || 'Other', // Captured from frontend FormData
        name: file.originalname,
        fileName: file.filename,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        path: file.path,
        status: 'pending',
        uploadedAt: new Date()
      }));

      // Use $push to add to the array without overwriting existing docs
      updateData.$push = { documents: { $each: newDocs } };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle');

    // Sync Job Demand References if job changed
    if (updateData.jobDemandId && updateData.jobDemandId.toString() !== oldWorker.jobDemandId?.toString()) {
      if (oldWorker.jobDemandId) await JobDemand.findByIdAndUpdate(oldWorker.jobDemandId, { $pull: { workers: id } });
      await JobDemand.findByIdAndUpdate(updateData.jobDemandId, { $addToSet: { workers: id } });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Stage & Auto-calculate Status (11-Stage Engine)
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;
    const { companyId } = req.user;

    const worker = await Worker.findOne({ _id: id, companyId });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    // Find stage by ID or by name
    let stage = worker.stageTimeline.find(s =>
      (s._id && s._id.toString() === stageId) || s.stage === stageId
    );

    if (!stage) {
      worker.stageTimeline.push({ stage: stageId, status: status || 'pending', date: new Date() });
    } else {
      stage.status = status;
      stage.date = new Date();
    }

    // Status Engine Logic
    const timeline = worker.stageTimeline;
    const completedCount = timeline.filter(s => s.status === 'completed').length;
    const anyRejected = timeline.some(s => s.status === 'rejected');
    const anyInProgress = timeline.some(s => s.status === 'in-progress' || s.status === 'completed');

    if (anyRejected) {
      worker.status = 'rejected';
    } else if (completedCount >= 11) {
      worker.status = 'deployed'; // Matches your frontend/admin POV
    } else if (anyInProgress) {
      worker.status = 'processing';
    } else {
      worker.status = 'pending';
    }

    // Set currentStage label to the last completed stage
    const lastDone = [...timeline].reverse().find(s => s.status === 'completed');
    if (lastDone) worker.currentStage = lastDone.stage;

    await worker.save();

    const updatedWorker = await Worker.findById(id)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle')
      .lean();

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add Worker with 11 Stages
 */
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, jobDemandId } = req.body;
    const existingWorker = await Worker.findOne({ passportNumber, companyId: req.user.companyId });
    if (existingWorker) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Passport number already exists' });

    const initialStages = [
      'document-collection', 'document-verification', 'interview',
      'medical-examination', 'police-clearance', 'training',
      'visa-application', 'visa-approval', 'ticket-booking',
      'pre-departure-orientation', 'deployed'
    ].map(name => ({ stage: name, status: 'pending', date: new Date() }));

    const newWorker = new Worker({
      ...req.body,
      createdBy: req.user.userId,
      companyId: req.user.companyId,
      stageTimeline: initialStages,
      status: 'pending',
      currentStage: 'document-collection'
    });

    await newWorker.save();
    if (jobDemandId) await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete Worker
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOneAndDelete(filter);
    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });

    if (worker.jobDemandId) await JobDemand.findByIdAndUpdate(worker.jobDemandId, { $pull: { workers: worker._id } });

    res.status(StatusCodes.OK).json({ success: true, message: 'Worker removed successfully' });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};