const Worker = require('../models/Worker');
const User = require('../models/User');
const Company = require('../models/Company');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
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
 * @desc Get all Workers (Company-wide View with Privacy)
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const { companyId, role } = req.user;

    // Updated: Everyone in the company sees the list
    let filter = { companyId };

    // Check Company Privacy Settings for Passport Masking
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
 * @desc Get Worker by ID (Company-wide View)
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid Worker ID' });
    }

    // Updated: Any employee can view details in their company
    const worker = await Worker.findOne({ _id: id, companyId })
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    // Privacy Masking Logic
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
 * @desc Add Worker (With Duplicate Protection)
 */
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, jobDemandId, name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    // 1. Check for duplicate passport in the same company
    const existingWorker = await Worker.findOne({ passportNumber, companyId });
    if (existingWorker) return res.status(400).json({ msg: 'Passport number already exists' });

    // 2. Prevent Double Creation (3-second window for same passport)
    const recentCreation = await Worker.findOne({
      passportNumber,
      companyId,
      createdAt: { $gte: new Date(Date.now() - 3000) }
    });
    if (recentCreation) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Processing request..." });

    // 3. Document handling logic
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

    // 4. Link to Job Demand
    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
    }

    // 5. Notifications (Non-blocking)
    try {
      const notifyList = await User.find({
        companyId,
        "notificationSettings.newWorker": true,
        isBlocked: false
      });

      notifyList.forEach(user => {
        if (user.notificationSettings.enabled) {
          console.log(`[Notification] To: ${user.fullName} | New worker: ${name}`);
        }
      });
    } catch (err) { console.error("Notif failed", err.message); }

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Worker (Creator or Admin Only)
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    // Permission Filter: Only Creator or Admin can Update
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Unauthorized or not found' });

    const { existingDocuments, ...otherUpdates } = req.body;
    let updateData = { ...otherUpdates };

    // Document Syncing
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

    const updatedWorker = await Worker.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('employerId jobDemandId subAgentId');

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Stage (Anyone in Company can update workflow)
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;

    const worker = await Worker.findOne({ _id: id, companyId: req.user.companyId });
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
    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete Worker (Creator or Admin Only)
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    // Permission Filter
    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const worker = await Worker.findOneAndDelete(filter);
    if (!worker) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Unauthorized or not found' });

    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, { $pull: { workers: worker._id } });
    }

    res.status(200).json({ success: true, msg: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};