const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all Job Demands
exports.getJobDemands = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { view } = req.query;

    let filter = { companyId };

    // Apply ownership filter unless it's an admin or dropdown 'all' view
    if (role !== 'admin' && role !== 'super_admin' && view !== 'all') {
      filter.createdBy = userId;
    }

    const jobDemands = await JobDemand.find(filter)
      .populate('employerId', 'employerName')
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
exports.getJobDemandById = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    // Security: Filter by owner if not admin
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
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Job Demand not found or unauthorized"
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

    // Important: Ensure the employer being linked belongs to the same company
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
    const { companyId, userId, role } = req.user;

    // Security check: Can only update if they own it or are admin
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    let jobDemand = await JobDemand.findOne(filter);

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Job Demand not found or unauthorized",
      });
    }

    if (employerName) {
      const employer = await Employer.findOne({
        employerName: employerName,
        companyId: companyId
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
    const { companyId, userId, role } = req.user;

    // Security check: Only owner or admin can delete
    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const jobDemand = await JobDemand.findOneAndDelete(filter);

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
    const { companyId, userId, role } = req.user;

    // If an employee is looking at an employer's demands, 
    // they should still only see the demands they created for that employer.
    let filter = { employerId, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const jobDemands = await JobDemand.find(filter).sort({ createdAt: -1 });

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