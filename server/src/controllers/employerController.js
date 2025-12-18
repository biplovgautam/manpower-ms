const Employer = require('../models/Employers'); // Double check this filename is exactly Employers.js
const { StatusCodes } = require('http-status-codes');

exports.getEmployers = async (req, res) => {
    try {
        // Debugging logs - Check your server terminal!
        console.log("Full User Object from Token:", req.user);

        if (!req.user || !req.user.companyId) {
            console.error("ERROR: No companyId found in request user object");
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: "Company ID is missing from your session. Please log out and back in."
            });
        }

        const employers = await Employer.find({ companyId: req.user.companyId })
            .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({
            success: true,
            count: employers.length,
            data: employers,
        });
    } catch (error) {
        console.error("SERVER CRASH ERROR:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message || 'Internal Server Error',
        });
    }
};

exports.createEmployer = async (req, res) => {
    try {
        const { employerName, country, contact, address, notes } = req.body;

        if (!req.user.companyId || !req.user.userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                error: "Authentication data missing. Please log in again."
            });
        }

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
        console.error("CREATE ERROR:", error);
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message,
        });
    }
};