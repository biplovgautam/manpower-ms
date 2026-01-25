const Worker = require('../models/Worker');
const User = require('../models/User');
const Company = require('../models/Company');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
// Import your helper
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * HELPER: Mask Passport Number
 */
const maskPassport = (passport) => {
  if (!passport) return "";
  return passport.substring(0, 3) + "x".repeat(passport.length - 3);
};

/**
 * @desc Get all Workers
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    let filter = { companyId };

    const company = await Company.findById(companyId).select('settings');
    const isPrivacyEnabled = company?.settings?.isPassportPrivate && role === 'employee';

    const workers = await Worker.find(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const processedWorkers = workers.map(worker => ({
      ...worker,
      passportNumber: isPrivacyEnabled ? maskPassport(worker.passportNumber) : worker.passportNumber
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      count: processedWorkers.length,
      data: processedWorkers
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Worker by ID
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid Worker ID' });
    }

    const worker = await Worker.findOne({ _id: id, companyId })
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    const company = await Company.findById(companyId).select('settings');
    if (company?.settings?.isPassportPrivate && role === 'employee') {
      worker.passportNumber = maskPassport(worker.passportNumber);
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Add Worker + Notification
 */
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, jobDemandId, name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    const existingWorker = await Worker.findOne({ passportNumber, companyId });
    if (existingWorker) return res.status(400).json({ msg: 'Passport number already exists' });

    const recentCreation = await Worker.findOne({
      passportNumber,
      companyId,
      createdAt: { $gte: new Date(Date.now() - 3000) }
    });
    if (recentCreation) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Processing request..." });

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

    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
    }

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `registered a new worker: ${name} (${passportNumber})`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Worker + Notification
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Unauthorized or not found' });

    const { existingDocuments, ...otherUpdates } = req.body;
    let updateData = { ...otherUpdates };

    let updatedDocsList = existingDocuments ? JSON.parse(existingDocuments) : [];
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file, index) => {
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};
        return {
          name: meta.name || file.originalname,
          category: meta.category || 'Other',
          fileName: file.filename,
          path: file.path,
          uploadedAt: new Date()
        };
      });
      updatedDocsList = [...updatedDocsList, ...newDocs];
    }
    updateData.documents = updatedDocsList;

    const updatedWorker = await Worker.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated personal details for worker: ${updatedWorker.name}`
    });

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Stage + Notification
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.userId || req.user.id;
    const companyId = req.user.companyId;

    const worker = await Worker.findOne({ _id: id, companyId });
    if (!worker) return res.status(404).json({ msg: 'Worker not found' });

    let stage = worker.stageTimeline.find(s => s.stage === stageId || (s._id && s._id.toString() === stageId));
    if (stage) {
      stage.status = status;
      stage.date = new Date();
    }

    const completed = worker.stageTimeline.filter(s => s.status === 'completed').length;
    if (completed >= 11) worker.status = 'deployed';
    else if (completed > 0) worker.status = 'processing';

    await worker.save();

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated ${worker.name}'s stage [${stageId}] to ${status}`
    });

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete Worker + Notification
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const worker = await Worker.findOne(filter);
    if (!worker) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Unauthorized or not found' });

    const workerName = worker.name;
    const passport = worker.passportNumber;

    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, { $pull: { workers: worker._id } });
    }

    await Worker.deleteOne({ _id: worker._id });

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `deleted worker: ${workerName} (${passport})`
    });

    res.status(200).json({ success: true, msg: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};