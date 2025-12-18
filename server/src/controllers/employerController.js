const Employer = require('../models/Employers');
const { StatusCodes } = require('http-status-codes');

// @desc    Create a new employer
// @route   POST /api/employers
exports.createEmployer = async (req, res) => {
  try {
    const { employerName, country, contact, address, notes } = req.body;

    // Use information from the token (attached by your protect middleware)
    const newEmployer = await Employer.create({
      employerName,
      country,
      contact,
      address,
      notes,
      createdBy: req.user.userId, // Link to the user
      companyId: req.user.companyId // Link to the company
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

// @desc    Get all employers (Filtered by company)
exports.getEmployers = async (req, res) => {
  try {
    // Usually, you only want to see employers belonging to your company
    const employers = await Employer.find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: employers.length,
      data: employers,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server Error',
    });
  }
};