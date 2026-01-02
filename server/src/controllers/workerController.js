const Worker = require('../models/Worker');
const mongoose = require('mongoose');

exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, dob, country, status, currentStage } = req.body;

    // 1. Strict ID Check from Middleware
    const creatorId = req.user.userId;
    const companyId = req.user.companyId;

    if (!creatorId || !companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in again.'
      });
    }

    // 2. Prevent Duplicate Passport
    const existingWorker = await Worker.findOne({ passportNumber });
    if (existingWorker) {
      return res.status(400).json({ success: false, message: 'Passport already exists.' });
    }

    // 3. Handle Documents
    const documentFiles = req.files ? req.files.map(f => ({ name: f.originalname, path: f.path })) : [];

    const defaultTimeline = [
      { stage: 'interview', status: 'pending', date: new Date() },
      { stage: 'medical', status: 'pending', date: new Date() },
      { stage: 'training', status: 'pending', date: new Date() },
      { stage: 'visa', status: 'pending', date: new Date() },
    ];

    // 4. Create Worker with FORCED ObjectId casting
    const newWorker = new Worker({
      ...req.body,
      dob: new Date(dob),
      country: country || 'Nepal',
      status: status || 'pending',
      currentStage: currentStage || 'interview',
      documents: documentFiles,
      stageTimeline: defaultTimeline,
      // Force IDs to ObjectId to ensure the stats query finds them
      createdBy: new mongoose.Types.ObjectId(creatorId),
      assignedTo: new mongoose.Types.ObjectId(creatorId),
      companyId: new mongoose.Types.ObjectId(companyId)
    });

    await newWorker.save();
    res.status(201).json({ success: true, message: 'Worker registered successfully', data: newWorker });
  } catch (error) {
    console.error("Add Worker Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('employerId', 'name employerName companyName') // Added companyName just in case
      .populate('subAgentId', 'name agentName')
      .populate('jobDemandId', 'title jobTitle')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.body.dob) updateData.dob = new Date(req.body.dob);

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employerId', 'name employerName companyName');

    if (!updatedWorker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// RUN THIS ONCE TO CLEAN UP OLD DATA
exports.fixWorkerData = async (req, res) => {
  try {
    const workers = await Worker.find({});
    let updatedCount = 0;

    for (let worker of workers) {
      // Use findByIdAndUpdate to bypass the full .save() validation if needed
      await Worker.findByIdAndUpdate(worker._id, {
        createdBy: new mongoose.Types.ObjectId(worker.createdBy),
        companyId: new mongoose.Types.ObjectId(worker.companyId),
        assignedTo: worker.assignedTo ? new mongoose.Types.ObjectId(worker.assignedTo) : worker.createdBy
      });
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      msg: `Successfully converted ${updatedCount} workers to ObjectId format.`
    });
  } catch (error) {
    console.error("Fix Data Error:", error);
    res.status(500).json({ error: error.message });
  }
};