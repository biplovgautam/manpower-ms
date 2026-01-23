const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all Job Demands
exports.getJobDemands = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { view } = req.query;
    let filter = { companyId };

    if (role !== 'admin' && role !== 'super_admin' && view !== 'all') {
      filter.createdBy = userId;
    }

    const jobDemands = await JobDemand.find(filter)
      .populate('employerId', 'employerName')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({ success: true, count: jobDemands.length, data: jobDemands });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Get Single Job Demand
exports.getJobDemandById = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    let filter = { _id: req.params.id, companyId };

    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const jobDemand = await JobDemand.findOne(filter)
      .populate('employerId', 'employerName')
      .populate({
        path: 'workers',
        select: 'name fullName status currentStage passportNumber'
      });

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Job Demand not found" });
    }

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Create new Job Demand
exports.createJobDemand = async (req, res) => {
  try {
    const { employerName, ...otherData } = req.body;
    const employer = await Employer.findOne({ employerName, companyId: req.user.companyId });

    if (!employer) return res.status(404).json({ error: "Employer not found" });

    const jobDemand = await JobDemand.create({
      ...otherData,
      employerId: employer._id,
      createdBy: req.user.userId,
      companyId: req.user.companyId
    });

    // --- REQUIREMENT 6: NOTIFY ADMIN & EMPLOYEES ---
    const notifyUsers = await User.find({
      companyId: req.user.companyId,
      isBlocked: false,
      "notificationSettings.newJob": true,
      "notificationSettings.enabled": true
    });

    notifyUsers.forEach(user => {
      console.log(`[Notification Sent] To: ${user.fullName} | New Job Created: ${otherData.jobTitle}`);
      // Call your sendEmail or sendSMS functions here
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update Job Demand
exports.updateJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { employerName, ...updateData } = req.body;
    const { companyId, userId, role } = req.user;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    let jobDemand = await JobDemand.findOne(filter);
    if (!jobDemand) return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Unauthorized" });

    if (employerName) {
      const employer = await Employer.findOne({ employerName, companyId });
      if (employer) updateData.employerId = employer._id;
    }

    jobDemand = await JobDemand.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

// @desc    Delete Job Demand
exports.deleteJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const jobDemand = await JobDemand.findOneAndDelete(filter);
    if (!jobDemand) return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Unauthorized" });

    res.status(StatusCodes.OK).json({ success: true, message: "Removed successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Get Employer Specific Demands
exports.getEmployerJobDemands = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { companyId, userId, role } = req.user;
    let filter = { employerId, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const jobDemands = await JobDemand.find(filter).sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ success: true, count: jobDemands.length, data: jobDemands });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};