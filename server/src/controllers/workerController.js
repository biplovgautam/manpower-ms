const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const mongoose = require('mongoose');

/**
 * ADD WORKER
 */
exports.addWorker = async (req, res) => {
  try {
    const {
      name,
      dob,
      passportNumber,
      contact,
      address,
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

    // 2. Auth Check (Critical for the 'createdBy' field in your model)
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

    // 4. Default Timeline (Matching your 11-stage enum if possible)
    const defaultTimeline = [
      { stage: 'document-collection', status: 'completed', date: new Date() },
      { stage: 'document-verification', status: 'in-progress', date: new Date() },
    ];

    const newWorker = new Worker({
      name,
      dob: new Date(dob),
      passportNumber,
      contact,
      address,
      country: country || 'Nepal',
      employerId: employerId || null,
      jobDemandId: jobDemandId || null,
      subAgentId: subAgentId || null, // Reference to 'SubAgent' collection
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

    // Populate before sending back to frontend
    const populated = await Worker.findById(newWorker._id)
      .populate('employerId', 'name employerName')
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
    // We use .lean() to prevent Mongoose from trying to validate instances of deleted refs
    const workers = await Worker.find()
      .populate('employerId', 'name employerName companyName')
      .populate('subAgentId', 'name') // Pulls 'name' from SubAgent model
      .populate('jobDemandId', 'title jobTitle')
      .populate('createdBy', 'fullName') // Pulls 'fullName' from User model
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
 * UPDATE WORKER
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.body.dob) {
      updateData.dob = new Date(req.body.dob);
    }

    // Handle new file uploads if any
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
        uploadedAt: new Date()
      }));

      // If updating documents, we use $push
      delete updateData.documents; // Prevent overwriting array
      updateData.$push = { documents: { $each: newDocs } };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employerId', 'name employerName')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'title')
      .populate('createdBy', 'fullName');

    if (!updatedWorker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Update Worker Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};