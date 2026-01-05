const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Add new Worker
 * @route   POST /api/workers/add
 * @access  Private
 */
exports.addWorker = async (req, res) => {
  try {
    const {
      name,
      dob,
      passportNumber,
      contact,
      address,
      email,
      country,
      employerId,
      jobDemandId,
      subAgentId,
      status,
      currentStage,
      notes,
    } = req.body;

    // 1. Duplicate Check
    const existingWorker = await Worker.findOne({ passportNumber });
    if (existingWorker) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Passport number already exists.'
      });
    }

    // 2. Auth Check
    const creatorId = req.user?.userId;
    const companyId = req.user?.companyId;

    if (!creatorId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User authentication failed.'
      });
    }

    // 3. Document Handling (mapping Multer files)
    const documentFiles = req.files
      ? req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
        category: 'other',
        uploadedAt: new Date()
      }))
      : [];

    // 4. Default Timeline Initialization
    const defaultTimeline = [
      { stage: 'document-collection', status: 'completed', date: new Date() },
      { stage: 'document-verification', status: 'in-progress', date: new Date() },
      { stage: 'medical-checkup', status: 'pending', date: new Date() },
      { stage: 'visa-processing', status: 'pending', date: new Date() },
    ];

    // 5. Create Worker
    const newWorker = new Worker({
      name,
      dob: dob ? new Date(dob) : null,
      passportNumber,
      contact,
      address,
      email,
      country: country || 'Nepal',
      employerId: employerId || null,
      jobDemandId: jobDemandId || null,
      subAgentId: subAgentId || null,
      status: status || 'pending',
      currentStage: currentStage || 'document-collection',
      notes,
      documents: documentFiles,
      stageTimeline: defaultTimeline,
      createdBy: creatorId,
      companyId: companyId,
      assignedTo: creatorId
    });

    await newWorker.save();

    // 6. SYNC WITH JOB DEMAND (Critical Fix)
    // This pushes the worker ID into the JobDemand's workers array
    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, {
        $addToSet: { workers: newWorker._id }
      });
    }

    const populated = await Worker.findById(newWorker._id)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('createdBy', 'fullName');

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Worker registered successfully and linked to Job Demand',
      data: populated,
    });
  } catch (error) {
    console.error("Add Worker Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all Workers for the company
 * @route   GET /api/workers
 * @access  Private
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ companyId: req.user.companyId })
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
    console.error("Get All Workers Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get Worker by ID
 * @route   GET /api/workers/:id
 * @access  Private
 */
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    })
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    console.error("Get Worker Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update Worker details
 * @route   PUT /api/workers/:id
 * @access  Private
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Fetch original worker to check for Job Demand reassignment
    const oldWorker = await Worker.findById(id);
    if (!oldWorker) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (req.body.dob) {
      updateData.dob = new Date(req.body.dob);
    }

    // Handle new file uploads if present
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
        uploadedAt: new Date()
      }));
      updateData.$push = { documents: { $each: newDocs } };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle');

    // SYNC JOB DEMANDS IF CHANGED
    if (updateData.jobDemandId && updateData.jobDemandId.toString() !== oldWorker.jobDemandId?.toString()) {
      // Remove from previous demand array
      if (oldWorker.jobDemandId) {
        await JobDemand.findByIdAndUpdate(oldWorker.jobDemandId, {
          $pull: { workers: id }
        });
      }
      // Add to new demand array
      await JobDemand.findByIdAndUpdate(updateData.jobDemandId, {
        $addToSet: { workers: id }
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Worker Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update specific stage in worker timeline
 * @route   PATCH /api/workers/:id/stage/:stageId
 * @access  Private
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status, notes } = req.body;

    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: id, "stageTimeline._id": stageId },
      {
        $set: {
          "stageTimeline.$.status": status,
          "stageTimeline.$.notes": notes || "",
          "stageTimeline.$.date": new Date()
        }
      },
      { new: true }
    )
      .populate('employerId', 'name employerName')
      .populate('jobDemandId', 'jobTitle');

    if (!updatedWorker) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Worker or Stage not found'
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Stage Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete Worker
 * @route   DELETE /api/workers/:id
 * @access  Private
 */
exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Remove worker reference from JobDemand before deleting worker
    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, {
        $pull: { workers: worker._id }
      });
    }

    await worker.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Worker and associated references removed'
    });
  } catch (error) {
    console.error("Delete Worker Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};