const User = require('../models/User');
const Company = require('../models/Company');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

const register = async (req, res) => {
    const { fullName, email, password, role, companyName } = req.body;

    // Check if it's the first account ever created
    const isFirstAccount = (await User.countDocuments({})) === 0;
    let userRole = isFirstAccount ? 'super_admin' : role;

    if (!fullName || !email || !password || !userRole) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide all required fields.' });
    }

    if (!isFirstAccount && userRole === 'super_admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Super Admin registration forbidden.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Email already exists.` });
    }

    let user;
    if (userRole === 'admin') {
        if (!companyName) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Company Name required.' });

        // 1. Create the user first
        user = new User({ fullName, email, password, role: userRole });
        await user.save();

        // 2. Create the company linked to this admin
        const company = await Company.create({ name: companyName, adminId: user._id });

        // 3. Update the user with the new Company ID and fetch the UPDATED document
        // This is critical so createJWT() sees the companyId
        user = await User.findByIdAndUpdate(
            user._id,
            { companyId: company._id },
            { new: true, runValidators: true }
        );
    } else {
        user = await User.create({ fullName, email, password, role: userRole });
    }

    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
        success: true,
        user: {
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            companyId: user.companyId
        },
        token
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide email and password' });
    }

    // Find user and explicitly select password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    // Generate token containing the companyId
    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
        success: true,
        user: {
            userId: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            companyId: user.companyId
        },
        token
    });
};

const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;

    // req.user is populated by the 'protect' middleware
    const adminCompanyId = req.user.companyId;

    if (!adminCompanyId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: 'Account configuration error: Admin Company ID not found.'
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email already exists.' });
    }

    // Create employee and link them to the same company as the admin
    const employee = await User.create({
        fullName,
        email,
        password,
        contactNumber,
        address,
        role: 'employee',
        companyId: adminCompanyId
    });

    res.status(StatusCodes.CREATED).json({
        success: true,
        msg: 'Employee registered successfully',
        employee: {
            id: employee._id,
            fullName: employee.fullName,
            companyId: employee.companyId
        }
    });
};

const getAllEmployees = async (req, res) => {
    try {
        const adminCompanyId = req.user.companyId;

        if (!adminCompanyId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Company context missing." });
        }

        // Convert string ID to Mongoose ObjectId
        const compId = new mongoose.Types.ObjectId(adminCompanyId);

        // 1. Get all employees for this company
        const employees = await User.find({
            companyId: compId,
            role: 'employee'
        }).select('-password').lean();

        // 2. Map through employees and attach real-time counts from other collections
        const employeesWithStats = await Promise.all(employees.map(async (emp) => {
            const targetId = new mongoose.Types.ObjectId(emp._id);

            const [employersCount, demandsCount, workersCount] = await Promise.all([
                Employer.countDocuments({ createdBy: targetId }),
                JobDemand.countDocuments({ createdBy: targetId }),
                // Worker count: includes those they created OR are assigned to manage
                Worker.countDocuments({
                    companyId: compId,
                    $or: [
                        { createdBy: targetId },
                        { assignedTo: targetId }
                    ]
                })
            ]);

            return {
                ...emp,
                employersAdded: employersCount,
                jobDemandsCreated: demandsCount,
                workersManaged: workersCount
            };
        }));

        res.status(StatusCodes.OK).json({
            success: true,
            count: employeesWithStats.length,
            data: employeesWithStats
        });
    } catch (error) {
        console.error("Error in getAllEmployees:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to fetch employee statistics"
        });
    }
};

module.exports = { register, login, registerEmployee, getAllEmployees };