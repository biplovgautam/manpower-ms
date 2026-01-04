const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const mongoose = require('mongoose');

/**
 * ADD WORKER
 * Handles initial registration, file uploads, and default timeline creation.
 */
exports.addWorker = async (req, res) => {
  try {
    const {
      name,
      dob,
      passportNumber,
      contact,
      address,
      email, // Ensure email is extracted
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
      return res.status(400).json({ success: false, message: 'Passport number already exists.' });
    }

    // 2. Auth Check
    const creatorId = req.user?.userId;
    const companyId = req.user?.companyId;

    if (!creatorId) {
      return res.status(401).json({ success: false, message: 'User authentication failed.' });
    }

    // 3. Document Handling
    const documentFiles = req.files
      ? req.files.map((file) => ({
          name: file.originalname,
          path: file.path,
          category: 'other',
          uploadedAt: new Date()
        }))
      : [];

    // 4. Default Timeline
    const defaultTimeline = [
      { stage: 'document-collection', status: 'completed', date: new Date() },
      { stage: 'document-verification', status: 'in-progress', date: new Date() },
      { stage: 'medical-checkup', status: 'pending', date: new Date() },
      { stage: 'visa-processing', status: 'pending', date: new Date() },
    ];

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

    const populated = await Worker.findById(newWorker._id)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('createdBy', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      data: populated,
    });
  } catch (error) {
    console.error("Add Worker Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL WORKERS
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'title jobTitle')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error("Get All Workers Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET WORKER BY ID
 * Crucial for the Details Page
 */
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'title jobTitle')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    console.error("Get Worker Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE WORKER
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.body.dob) {
      updateData.dob = new Date(req.body.dob);
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
        uploadedAt: new Date()
      }));
      
      delete updateData.documents; 
      updateData.$push = { documents: { $each: newDocs } };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'title jobTitle');

    if (!updatedWorker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Worker Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE WORKER STAGE (The Timeline "Action" dropdown trigger)
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;

    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: id, "stageTimeline._id": stageId },
      { 
        $set: { 
          "stageTimeline.$.status": status,
          "stageTimeline.$.date": new Date() 
        } 
      },
      { new: true }
    )
    .populate('employerId', 'name employerName companyName')
    .populate('subAgentId', 'name')
    .populate('jobDemandId', 'title jobTitle');

    if (!updatedWorker) {
      return res.status(404).json({ success: false, message: 'Worker or Stage not found' });
    }

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Stage Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};