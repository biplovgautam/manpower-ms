const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all Job Demands (Company-wide)
 * @route   GET /api/v1/demands
 */
exports.getJobDemands = async (req, res) => {
  try {
    const { companyId } = req.user;
    const jobDemands = await JobDemand.find({ companyId })
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Single Job Demand
 * @route   GET /api/v1/demands/:id
 */
exports.getJobDemandById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const jobDemand = await JobDemand.findOne({ _id: req.params.id, companyId })
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
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

/**
 * @desc    Create new Job Demand + Notify
 * @route   POST /api/v1/demands
 */
exports.createJobDemand = async (req, res) => {
  try {
    const { employerName, ...otherData } = req.body;
    const userId = req.user._id || req.user.userId;
    const { companyId } = req.user;

    // 1. Validate Employer
    const employer = await Employer.findOne({ employerName, companyId });
    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Employer not found in your company records" });
    }

    // 2. Prevent Spam (5-second debounce)
    const isDuplicate = await JobDemand.findOne({
      createdBy: userId,
      jobTitle: otherData.jobTitle,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (isDuplicate) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Duplicate demand detected. Please wait." });
    }

    // 3. Save to DB
    const jobDemand = await JobDemand.create({
      ...otherData,
      employerId: employer._id,
      createdBy: userId,
      companyId: companyId
    });

    // 4. Trigger Activity Log (Object-based syntax)
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'demand',
      content: `added a new job demand: ${jobDemand.jobTitle} for ${employerName}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

/**
 * @desc    Update Job Demand + Notify
 * @route   PATCH /api/v1/demands/:id
 */
exports.updateJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { employerName, ...updateData } = req.body;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    // Security check
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'tenant_admin') {
      filter.createdBy = userId;
    }

    if (employerName) {
      const employer = await Employer.findOne({ employerName, companyId });
      if (employer) updateData.employerId = employer._id;
    }

    const jobDemand = await JobDemand.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true
    });

    if (!jobDemand) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: "Permission denied or Demand does not exist."
      });
    }

    // Trigger Activity Log (Object-based syntax)
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'demand',
      content: `updated the details for job demand: ${jobDemand.jobTitle}`
    });

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete Job Demand + Notify
 * @route   DELETE /api/v1/demands/:id
 */
exports.deleteJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'tenant_admin') {
      filter.createdBy = userId;
    }

    const demandToDelete = await JobDemand.findOne(filter).populate('employerId', 'employerName');

    if (!demandToDelete) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Demand not found or unauthorized access."
      });
    }

    const title = demandToDelete.jobTitle;
    const emp = demandToDelete.employerId?.employerName || "Employer";

    await demandToDelete.deleteOne();

    // Trigger Activity Log (Object-based syntax)
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'demand',
      content: `removed the job demand: ${title} (${emp})`
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Demand successfully deleted" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Employer Specific Demands
 */
exports.getEmployerJobDemands = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { companyId } = req.user;

    const jobDemands = await JobDemand.find({ employerId, companyId }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};