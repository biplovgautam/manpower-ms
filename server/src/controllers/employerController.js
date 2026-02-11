const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const User = require('../models/User');
// This function now handles both DB saving AND Kafka producing
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all employers for a specific company
exports.getEmployers = async (req, res) => {
    try {
        const { companyId } = req.user;
        let filter = { companyId };

        const employers = await Employer.find(filter)
            .populate('createdBy', 'fullName')
            .populate('totalJobDemands')
            .populate('totalHires')
            .sort({ employerName: 1 });

        return res.status(StatusCodes.OK).json({
            success: true,
            count: employers.length,
            data: employers,
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Employer Details
exports.getEmployerDetails = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;
        let filter = { _id: req.params.id, companyId };

        if (role !== 'admin' && role !== 'tenant_admin') {
            filter.createdBy = userId;
        }

        const employer = await Employer.findOne(filter)
            .populate('createdBy', 'fullName')
            .populate('totalJobDemands')
            .populate('totalHires');

        if (!employer) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Employer not found" });
        }

        const demands = await JobDemand.find({ employerId: req.params.id, companyId });
        const workers = await Worker.find({ employerId: req.params.id, companyId });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                ...employer.toObject(),
                demands,
                workers
            },
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

// @desc    Create a new employer
exports.createEmployer = async (req, res) => {
    try {
        const { employerName, country, contact, address, notes } = req.body;
        const userId = req.user._id || req.user.userId;
        const companyId = req.user.companyId;

        const newEmployer = await Employer.create({
            employerName,
            country,
            contact,
            address,
            notes,
            createdBy: userId,
            companyId: companyId
        });

        // This triggers the Kafka producer automatically
        await createNotification({
            companyId,
            createdBy: userId,
            category: 'employer',
            content: `added a new employer: ${employerName} (${country})`
        });

        res.status(StatusCodes.CREATED).json({ success: true, data: newEmployer });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
    }
};

// @desc    Update an employer
exports.updateEmployer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.userId;
        const companyId = req.user.companyId;

        let employer = await Employer.findOne({ _id: id, companyId });

        if (!employer) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Employer not found" });
        }

        const updatedEmployer = await Employer.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        // Notify via Kafka bridge
        await createNotification({
            companyId,
            createdBy: userId,
            category: 'employer',
            content: `updated details for employer: ${updatedEmployer.employerName}`
        });

        res.status(StatusCodes.OK).json({ success: true, data: updatedEmployer });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
    }
};

// @desc    Delete an employer
exports.deleteEmployer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.userId;
        const companyId = req.user.companyId;

        const employer = await Employer.findOne({ _id: id, companyId });

        if (!employer) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Employer not found" });
        }

        const employerName = employer.employerName;
        await employer.deleteOne(); 

        // Notify via Kafka bridge
        await createNotification({
            companyId,
            createdBy: userId,
            category: 'employer',
            content: `removed employer: ${employerName}`
        });

        res.status(StatusCodes.OK).json({ success: true, message: "Employer deleted successfully" });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};