const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all Job Demands
exports.getJobDemands = async (req, res) => {
  try {
    const jobDemands = await JobDemand.find({ companyId: req.user.companyId })
      .populate('employerId', 'employerName')
      .populate('companyId', 'name')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get Single Job Demand (WITH POPULATED WORKERS)
// @desc    Get Single Job Demand (WITH POPULATED WORKERS)
exports.getJobDemandById = async (req, res) => {
  try {
    const jobDemand = await JobDemand.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    })
      .populate('employerId', 'employerName')
      .populate({
        path: 'workers',
        // ADDED passportNumber to the select string below
        select: 'name fullName status currentStage passportNumber'
      });

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Job Demand not found"
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new Job Demand
exports.createJobDemand = async (req, res) => {
  try {
    const { employerName, ...otherData } = req.body;

    const employer = await Employer.findOne({
      employerName: employerName,
      companyId: req.user.companyId
    });

    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: `Employer with name "${employerName}" not found.`
      });
    }

    const jobDemand = await JobDemand.create({
      ...otherData,
      employerId: employer._id,
      createdBy: req.user.userId,
      companyId: req.user.companyId
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: jobDemand,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update Job Demand
exports.updateJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { employerName, ...updateData } = req.body;

    let jobDemand = await JobDemand.findOne({ _id: id, companyId: req.user.companyId });

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Job Demand not found or unauthorized",
      });
    }

    if (employerName) {
      const employer = await Employer.findOne({
        employerName: employerName,
        companyId: req.user.companyId
      });

      if (!employer) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: "Updated employer name not found."
        });
      }
      updateData.employerId = employer._id;
    }

    jobDemand = await JobDemand.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: jobDemand,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete Job Demand
exports.deleteJobDemand = async (req, res) => {
  try {
    const { id } = req.params;

    const jobDemand = await JobDemand.findOneAndDelete({
      _id: id,
      companyId: req.user.companyId
    });

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Job Demand not found or unauthorized",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Job Demand removed successfully",
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get Job Demands for a specific employer
exports.getEmployerJobDemands = async (req, res) => {
  try {
    const { employerId } = req.params;

    const jobDemands = await JobDemand.find({
      employerId,
      companyId: req.user.companyId
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};