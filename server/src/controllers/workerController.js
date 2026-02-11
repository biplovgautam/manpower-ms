const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Company = require('../models/Company');
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

// Constant for file size limit (5MB in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * HELPER: Sync Job Demand Status
 */
const syncJobDemandStatus = async (jobDemandId) => {
  if (!jobDemandId || !mongoose.Types.ObjectId.isValid(jobDemandId)) return;

  const demand = await JobDemand.findById(jobDemandId);
  if (!demand) return;

  const currentCount = demand.workers.length;
  const requiredCount = demand.requiredWorkers || 0;

  const newStatus = currentCount >= requiredCount ? 'closed' : 'open';

  if (demand.status !== newStatus) {
    demand.status = newStatus;
    await demand.save();
  }
};

/**
 * HELPER: Mask Sensitive Information
 */
const maskSensitiveInfo = (value) => {
  if (!value || value === "") return "N/A";
  return value.substring(0, 3) + "x".repeat(Math.max(0, value.length - 3));
};

/**
 * HELPER: Clean Sparse Fields
 */
const sanitizeSparseFields = (data) => {
  const fields = ['passportNumber', 'citizenshipNumber'];
  fields.forEach(field => {
    if (data[field] === "" || (typeof data[field] === 'string' && data[field].trim() === "")) {
      data[field] = undefined;
    }
  });
  return data;
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
      passportNumber: isPrivacyEnabled ? maskSensitiveInfo(worker.passportNumber) : (worker.passportNumber || "N/A"),
      citizenshipNumber: isPrivacyEnabled ? maskSensitiveInfo(worker.citizenshipNumber) : (worker.citizenshipNumber || "N/A")
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
      worker.passportNumber = maskSensitiveInfo(worker.passportNumber);
      worker.citizenshipNumber = maskSensitiveInfo(worker.citizenshipNumber);
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc Add Worker + Kafka Notification
 */
exports.addWorker = async (req, res) => {
  try {
    const { jobDemandId, name, employerId } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    const sanitizedData = sanitizeSparseFields({ ...req.body });

    if (sanitizedData.passportNumber) {
      const existing = await Worker.findOne({ passportNumber: sanitizedData.passportNumber, companyId });
      if (existing) return res.status(400).json({ msg: 'Passport number already exists' });
    }

    if (jobDemandId && mongoose.Types.ObjectId.isValid(jobDemandId)) {
      const demand = await JobDemand.findById(jobDemandId);
      if (demand && demand.status === 'closed') {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'This job demand is already full and closed.' });
      }
    }

    let initialDocs = [];
    if (req.files && req.files.length > 0) {
      const largeFile = req.files.find(f => f.size > MAX_FILE_SIZE);
      if (largeFile) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          success: false, 
          msg: `File "${largeFile.originalname}" exceeds the 5MB limit.` 
        });
      }

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
    ].map(sName => ({ stage: sName, status: 'pending', date: new Date() }));

    const initialStatus = employerId ? 'processing' : 'pending';

    const newWorker = new Worker({
      ...sanitizedData,
      documents: initialDocs,
      createdBy: userId,
      companyId: companyId,
      stageTimeline: initialStages,
      status: initialStatus
    });

    await newWorker.save();

    if (jobDemandId && mongoose.Types.ObjectId.isValid(jobDemandId)) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
      await syncJobDemandStatus(jobDemandId);
    }

    // Trigger Notification via Kafka (Bridge handles Socket.io)
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `registered a new worker: ${name}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Worker Details + Kafka Notification
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    const oldWorker = await Worker.findOne({ _id: id, companyId });
    if (!oldWorker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    const sanitizedData = sanitizeSparseFields({ ...req.body });
    const { jobDemandId: newJobDemandId, existingDocuments, ...otherUpdates } = sanitizedData;

    let updatedDocsList = existingDocuments ? JSON.parse(existingDocuments) : oldWorker.documents;
    
    if (req.files && req.files.length > 0) {
      const largeFile = req.files.find(f => f.size > MAX_FILE_SIZE);
      if (largeFile) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          success: false, 
          msg: `File "${largeFile.originalname}" exceeds the 5MB limit.` 
        });
      }

      const newDocs = req.files.map((file, index) => {
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};
        return {
          name: meta.name || file.originalname,
          category: meta.category || 'Other',
          fileName: file.filename,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          path: file.path,
          uploadedAt: new Date()
        };
      });
      updatedDocsList = [...updatedDocsList, ...newDocs];
    }
    
    const updateData = { ...otherUpdates, jobDemandId: newJobDemandId, documents: updatedDocsList };

    if (updateData.employerId && oldWorker.status === 'pending') {
        updateData.status = 'processing';
    } else if (updateData.employerId === null || updateData.employerId === "") {
        updateData.status = 'pending';
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    const oldJobId = oldWorker.jobDemandId?.toString();
    const newJobId = newJobDemandId?.toString();

    if (oldJobId !== newJobId) {
      if (oldJobId) {
        await JobDemand.findByIdAndUpdate(oldJobId, { $pull: { workers: id } });
        await syncJobDemandStatus(oldJobId);
      }
      if (newJobId) {
        await JobDemand.findByIdAndUpdate(newJobId, { $addToSet: { workers: id } });
        await syncJobDemandStatus(newJobId);
      }
    } else if (newJobId) {
      await syncJobDemandStatus(newJobId);
    }

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated details for worker: ${updatedWorker.name}`
    });

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Stage + Automatic Status Logic + Kafka Notification
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body; 
    const userId = req.user._id || req.user.userId || req.user.id;
    const companyId = req.user.companyId;

    const worker = await Worker.findOne({ _id: id, companyId });
    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    let stageEntry = worker.stageTimeline.find(s => 
      s.stage === stageId || (s._id && s._id.toString() === stageId)
    );

    if (!stageEntry) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Stage entry not found' });
    }

    stageEntry.status = status;
    stageEntry.date = new Date();

    if (status === 'rejected') {
      worker.status = 'rejected';
    } else {
      const totalStages = worker.stageTimeline.length;
      const completedCount = worker.stageTimeline.filter(s => s.status === 'completed').length;
      
      const isLastStageCompleted = worker.stageTimeline[totalStages - 1].status === 'completed';

      if (isLastStageCompleted) {
          worker.status = 'deployed';
      } else if (completedCount > 0 || status === 'in-progress' || worker.employerId) {
          worker.status = 'processing';
      } else {
          worker.status = 'pending';
      }
    }

    worker.currentStage = stageEntry.stage;
    await worker.save();

    const readableStage = stageEntry.stage
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated ${worker.name}'s stage [${readableStage}] to ${status}`
    });

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: message.error });
  }
};

/**
 * @desc Delete Worker + Kafka Notification
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    const worker = await Worker.findOne({ _id: req.params.id, companyId });
    
    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        msg: 'Worker not found' 
      });
    }

    const jobDemandId = worker.jobDemandId;
    const workerName = worker.name;

    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { 
        $pull: { workers: worker._id } 
      });
    }

    await Worker.deleteOne({ _id: worker._id });

    if (jobDemandId) {
      await syncJobDemandStatus(jobDemandId);
    }

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `deleted worker: ${workerName}`
    });

    res.status(200).json({ success: true, msg: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Deployment Stats (Monthly)
 */
exports.getDeploymentStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const stats = await Worker.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), status: 'deployed' } },
      { $unwind: "$stageTimeline" },
      { $match: { "stageTimeline.stage": "deployed", "stageTimeline.status": "completed" } },
      {
        $group: {
          _id: { year: { $year: "$stageTimeline.date" }, month: { $month: "$stageTimeline.date" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedData = stats.map(item => ({ name: monthNames[item._id.month - 1], total: item.count }));
    res.status(StatusCodes.OK).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc Worker Status Stats (Dashboard)
 */
exports.getWorkerStatusStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const stats = await Worker.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const statusMap = { pending: 0, processing: 0, deployed: 0, rejected: 0 };
    stats.forEach(item => { if (statusMap.hasOwnProperty(item._id)) statusMap[item._id] = item.count; });
    res.status(StatusCodes.OK).json({ success: true, data: statusMap });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};