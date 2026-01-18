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
      .populate('employerId', 'name employerName companyName')
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
    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOne(filter)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });
    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Worker Info (Matches router.put)
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;
    const updateData = { ...req.body };

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });

    if (req.body.dob) updateData.dob = new Date(req.body.dob);

    // Handle File Uploads
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
        uploadedAt: new Date()
      }));
      updateData.$push = { documents: { $each: newDocs } };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('employerId', 'name employerName companyName')
      .populate('jobDemandId', 'jobTitle');

    // Sync Job Demand References
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
 * @desc    Update Stage & Auto-calculate Worker Status
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status, notes } = req.body;
    const { companyId, userId, role } = req.user;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOne(filter);
    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });

    const stageIndex = worker.stageTimeline.findIndex(s => s._id.toString() === stageId);
    if (stageIndex === -1) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Stage not found' });

    worker.stageTimeline[stageIndex].status = status;
    worker.stageTimeline[stageIndex].notes = notes || "";
    worker.stageTimeline[stageIndex].date = new Date();

    // Auto-Status Logic
    const timeline = worker.stageTimeline;
    const anyRejected = timeline.some(s => s.status === 'rejected');
    const allCompleted = timeline.every(s => s.status === 'completed');
    const docCollectionDone = timeline.find(s => s.stage === 'document-collection')?.status === 'completed';

    if (anyRejected) {
      worker.status = 'rejected';
    } else if (allCompleted) {
      worker.status = 'deployed';
    } else if (docCollectionDone) {
      worker.status = 'processing';
    } else {
      worker.status = 'pending';
    }

    const lastCompleted = [...timeline].reverse().find(s => s.status === 'completed');
    if (lastCompleted) worker.currentStage = lastCompleted.stage;

    await worker.save();
    const populated = await Worker.findById(worker._id).populate('employerId jobDemandId subAgentId');

    res.status(StatusCodes.OK).json({ success: true, data: populated });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
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
      status: 'pending'
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