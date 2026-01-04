const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand'); // Verify this path/filename
const Worker = require('../models/Worker');     // Verify this path/filename
const { StatusCodes } = require('http-status-codes');

// @desc    Get all employers for a specific company (List View)
exports.getEmployers = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Company ID is missing from your session."
      });
    }

    const employers = await Employer.find({ companyId: req.user.companyId })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      count: employers.length,
      data: employers,
    });
  } catch (error) {
    console.error("GET EMPLOYERS ERROR:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

// @desc    Get single employer with Job Demands and Workers (Detail View)
exports.getEmployerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const employer = await Employer.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    }).populate('createdBy', 'fullName');

    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Employer not found" });
    }

    // FIX: Changed 'employer: id' to 'employerId: id' to match your JobDemand model
    const demands = await JobDemand.find({ employerId: id }).sort({ createdAt: -1 });

    // This matches your Worker model ('employerId')
    const workers = await Worker.find({ employerId: id }).sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...employer._doc,
        demands, // Now will contain data
        workers  // Now will contain data
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new employer
exports.createEmployer = async (req, res) => {
  try {
    const { employerName, country, contact, address, notes } = req.body;

    const newEmployer = await Employer.create({
      employerName,
      country,
      contact,
      address,
      notes,
      createdBy: req.user.userId,
      companyId: req.user.companyId
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: newEmployer,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update an employer
exports.updateEmployer = async (req, res) => {
  try {
    const { id } = req.params;

    let employer = await Employer.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    });

    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Employer not found or unauthorized"
      });
    }

    employer = await Employer.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: employer,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete an employer
exports.deleteEmployer = async (req, res) => {
  try {
    const { id } = req.params;

    const employer = await Employer.findOneAndDelete({ 
      _id: id, 
      companyId: req.user.companyId 
    });

    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Employer not found or unauthorized"
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Employer deleted successfully"
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};