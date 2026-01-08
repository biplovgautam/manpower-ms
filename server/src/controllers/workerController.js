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

    // Filter Logic
    let filter = { companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const workers = await Worker.find(filter)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(StatusCodes.OK).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Worker by ID (Ownership Protected)
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const worker = await Worker.findOne(filter)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found or unauthorized' });
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Worker (Ownership Protected)
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;
    const updateData = { ...req.body };

    // Security Check: Find first to verify ownership
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found or unauthorized' });
    }

    if (req.body.dob) updateData.dob = new Date(req.body.dob);

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
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle');

    // SYNC JOB DEMANDS IF CHANGED
    if (updateData.jobDemandId && updateData.jobDemandId.toString() !== oldWorker.jobDemandId?.toString()) {
      if (oldWorker.jobDemandId) {
        await JobDemand.findByIdAndUpdate(oldWorker.jobDemandId, { $pull: { workers: id } });
      }
      await JobDemand.findByIdAndUpdate(updateData.jobDemandId, { $addToSet: { workers: id } });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete Worker (Ownership Protected)
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const worker = await Worker.findOne(filter);

    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker not found or unauthorized' });
    }

    // Sync reference removal before deleting
    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, { $pull: { workers: worker._id } });
    }

    await worker.deleteOne();

    res.status(StatusCodes.OK).json({ success: true, message: 'Worker removed' });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Stage (Ownership Protected)
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status, notes } = req.body;
    const { companyId, userId, role } = req.user;

    // Filter to ensure you own the worker you are updating the stage for
    let filter = { _id: id, companyId, "stageTimeline._id": stageId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const updatedWorker = await Worker.findOneAndUpdate(
      filter,
      {
        $set: {
          "stageTimeline.$.status": status,
          "stageTimeline.$.notes": notes || "",
          "stageTimeline.$.date": new Date()
        }
      },
      { new: true }
    ).populate('employerId', 'name employerName').populate('jobDemandId', 'jobTitle');

    if (!updatedWorker) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Worker or Stage not found/unauthorized' });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// addWorker logic remains largely the same as it correctly assigns creatorId and companyId
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, employerId, jobDemandId } = req.body;
    const creatorId = req.user.userId;
    const companyId = req.user.companyId;

    const existingWorker = await Worker.findOne({ passportNumber });
    if (existingWorker) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Passport number already exists.' });
    }

    const documentFiles = req.files ? req.files.map(file => ({
      name: file.originalname, path: file.path, category: 'other', uploadedAt: new Date()
    })) : [];

    const newWorker = new Worker({
      ...req.body,
      createdBy: creatorId,
      companyId: companyId,
      assignedTo: creatorId,
      documents: documentFiles,
      stageTimeline: [
        { stage: 'document-collection', status: 'completed', date: new Date() },
        { stage: 'document-verification', status: 'in-progress', date: new Date() },
        { stage: 'medical-checkup', status: 'pending', date: new Date() },
        { stage: 'visa-processing', status: 'pending', date: new Date() },
      ]
    });

    await newWorker.save();

    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
    }

    const populated = await Worker.findById(newWorker._id)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('createdBy', 'fullName');

    res.status(StatusCodes.CREATED).json({ success: true, data: populated });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};