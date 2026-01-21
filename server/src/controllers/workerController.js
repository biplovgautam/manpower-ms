const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs'); // Added to support physical file cleanup if needed

/**
 * @desc    Get all Workers
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
 * @desc    Update Worker Info & Sync Documents (Supports Deletion & Labels)
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;

    // 1. Check Permissions
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found' });

    // 2. Parse Body Data
    const { existingDocuments, ...otherUpdates } = req.body;
    let updateData = { ...otherUpdates };

    if (updateData.dob) updateData.dob = new Date(updateData.dob);

    // 3. Handle Document Synchronization (The Fix)
    // Parse the list of documents to keep (sent from frontend)
    let updatedDocsList = [];
    if (existingDocuments) {
      updatedDocsList = JSON.parse(existingDocuments);
    }

    // Handle New File Uploads with their specific Labels and Categories
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file, index) => {
        // Get meta data sent for this specific file index
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};

        return {
          name: meta.name || file.originalname, // The Custom Label
          category: meta.category || 'Other',   // The Selected Category
          fileName: file.filename,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          path: file.path,
          status: 'pending',
          uploadedAt: new Date()
        };
      });

      // Merge kept documents with newly uploaded ones
      updatedDocsList = [...updatedDocsList, ...newDocs];
    }

    // Set the final document array (this overwrites the old one, enabling deletion)
    updateData.documents = updatedDocsList;

    // 4. Update Worker
    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle');

    // 5. Sync Job Demand references if changed
    if (updateData.jobDemandId && updateData.jobDemandId.toString() !== oldWorker.jobDemandId?.toString()) {
      if (oldWorker.jobDemandId) await JobDemand.findByIdAndUpdate(oldWorker.jobDemandId, { $pull: { workers: id } });
      await JobDemand.findByIdAndUpdate(updateData.jobDemandId, { $addToSet: { workers: id } });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Worker Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add Worker with Initial Stages and Uploads
 */
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, jobDemandId } = req.body;
    const { companyId, userId } = req.user;

    const existingWorker = await Worker.findOne({ passportNumber, companyId });
    if (existingWorker) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Passport number already exists' });

    // Handle Initial Document Uploads
    let initialDocs = [];
    if (req.files && req.files.length > 0) {
      initialDocs = req.files.map((file, index) => {
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};
        return {
          name: meta.name || file.originalname,
          category: meta.category || 'Other',
          fileName: file.filename,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          path: file.path,
          status: 'pending',
          uploadedAt: new Date()
        };
      });
    }

    const initialStages = [
      'document-collection', 'document-verification', 'interview',
      'medical-examination', 'police-clearance', 'training',
      'visa-application', 'visa-approval', 'ticket-booking',
      'pre-departure-orientation', 'deployed'
    ].map(name => ({ stage: name, status: 'pending', date: new Date() }));

    const newWorker = new Worker({
      ...req.body,
      documents: initialDocs,
      createdBy: userId,
      companyId: companyId,
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
 * @desc    Update Stage & Auto-calculate Overall Status
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;
    const { companyId } = req.user;

    const worker = await Worker.findOne({ _id: id, companyId });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    let stage = worker.stageTimeline.find(s => (s._id && s._id.toString() === stageId) || s.stage === stageId);

    if (!stage) {
      worker.stageTimeline.push({ stage: stageId, status: status || 'pending', date: new Date() });
    } else {
      stage.status = status;
      stage.date = new Date();
    }

    // Logic Engine for Overall Status
    const timeline = worker.stageTimeline;
    const completedCount = timeline.filter(s => s.status === 'completed').length;
    const anyRejected = timeline.some(s => s.status === 'rejected');
    const anyInProgress = timeline.some(s => s.status === 'in-progress' || s.status === 'completed');

    if (anyRejected) {
      worker.status = 'rejected';
    } else if (completedCount >= 11) {
      worker.status = 'deployed';
    } else if (anyInProgress) {
      worker.status = 'processing';
    } else {
      worker.status = 'pending';
    }

    const lastDone = [...timeline].reverse().find(s => s.status === 'completed');
    if (lastDone) worker.currentStage = lastDone.stage;

    await worker.save();

    const updatedWorker = await Worker.findById(id).populate('employerId subAgentId jobDemandId').lean();
    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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