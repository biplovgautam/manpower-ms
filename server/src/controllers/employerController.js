const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all employers for a specific company (List View with Stats)
exports.getEmployers = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;
        const { view } = req.query; 

        let filter = { companyId };

        if (role !== 'admin' && view !== 'all') {
            filter.createdBy = userId;
        }

        // UPDATED: Added populate for the two virtual count fields
        const employers = await Employer.find(filter)
            .populate('createdBy', 'fullName')
            .populate('totalJobDemands') // <--- This fixes the 0 Demands
            .populate('totalHires')      // <--- This fixes the 0 Hires
            .sort({ employerName: 1 }); 

        return res.status(StatusCodes.OK).json({
            success: true,
            count: employers.length,
            data: employers,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Employer Details
exports.getEmployerDetails = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;

        let filter = { _id: req.params.id, companyId };
        if (role !== 'admin') {
            filter.createdBy = userId;
        }

        // We populate the virtuals here too so the details page has the latest counts
        const employer = await Employer.findOne(filter)
            .populate('createdBy', 'fullName')
            .populate('totalJobDemands')
            .populate('totalHires');

        if (!employer) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Employer not found" });
        }

        // Fetch the actual lists for the details view
        const demands = await JobDemand.find({ employerId: req.params.id, companyId });
        const workers = await Worker.find({ employerId: req.params.id, companyId });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: { 
                ...employer.toObject(), // Use toObject to include virtuals
                demands, 
                workers 
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