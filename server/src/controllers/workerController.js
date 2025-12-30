const Worker = require('../models/Worker');

exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, dob, country, status, currentStage } = req.body;

    const existingWorker = await Worker.findOne({ passportNumber });
    if (existingWorker) {
      return res.status(400).json({ success: false, message: 'Passport already exists.' });
    }

    const documentFiles = req.files ? req.files.map(f => ({ name: f.originalname, path: f.path })) : [];

    const defaultTimeline = [
      { stage: 'interview', status: 'pending', date: new Date() },
      { stage: 'medical', status: 'pending', date: new Date() },
      { stage: 'training', status: 'pending', date: new Date() },
      { stage: 'visa', status: 'pending', date: new Date() },
    ];

    const newWorker = new Worker({
      ...req.body,
      dob: new Date(dob),
      country: country || 'Nepal',
      status: status || 'pending',
      currentStage: currentStage || 'interview',
      documents: documentFiles,
      stageTimeline: defaultTimeline,
    });

    await newWorker.save();
    res.status(201).json({ success: true, message: 'Worker registered', data: newWorker });
  } catch (error) {
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

    const updatedWorker = await Worker.findByIdAndUpdate(id, updateData, { new: true })
      .populate('employerId', 'name employerName companyName') // MUST populate here too
      .populate('subAgentId', 'name agentName');

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};