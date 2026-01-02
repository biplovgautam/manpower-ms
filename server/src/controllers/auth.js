const User = require('../models/User');
const Company = require('../models/Company');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const { StatusCodes } = require('http-status-codes');

const register = async (req, res) => {
    const { fullName, email, password, role, companyName } = req.body;
    const isFirstAccount = (await User.countDocuments({})) === 0;
    let userRole = isFirstAccount ? 'super_admin' : role;
    let user;

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

    if (userRole === 'admin') {
        if (!companyName) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Company Name required.' });
        user = new User({ fullName, email, password, role: userRole });
        await user.save();
        const company = await Company.create({ name: companyName, adminId: user._id });
        user = await User.findByIdAndUpdate(user._id, { companyId: company._id }, { new: true });
    } else {
        user = await User.create({ fullName, email, password, role: userRole });
    }

    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
        user: { fullName: user.fullName, email: user.email, role: user.role, companyId: user.companyId },
        token
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        user: { fullName: user.fullName, email: user.email, role: user.role, companyId: user.companyId, userId: user._id },
        token
    });
};

const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;
    const adminCompanyId = req.user.companyId;

    if (!adminCompanyId) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Only Admins can add employees.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email exists.' });

    const employee = await User.create({
        fullName, email, password, contactNumber, address,
        role: 'employee', companyId: adminCompanyId
    });

    res.status(StatusCodes.CREATED).json({ msg: 'Employee registered', employee });
};

const getAllEmployees = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const adminCompanyId = new mongoose.Types.ObjectId(req.user.companyId);

        // 1. Get all employees for this company
        const employees = await User.find({
            companyId: adminCompanyId,
            role: 'employee'
        }).select('-password').lean();

        // 2. Map through employees and attach counts
        const employeesWithStats = await Promise.all(employees.map(async (emp) => {
            const targetId = new mongoose.Types.ObjectId(emp._id);

            const [employersCount, demandsCount, workersCount] = await Promise.all([
                Employer.countDocuments({ createdBy: targetId }),
                JobDemand.countDocuments({ createdBy: targetId }),
                // Counts workers where this employee is either the creator OR the manager
                Worker.countDocuments({
                    companyId: adminCompanyId,
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
                workersManaged: workersCount // This is the key field for your UI
            };
        }));

        res.status(StatusCodes.OK).json({ success: true, data: employeesWithStats });
    } catch (error) {
        console.error("Error in getAllEmployees:", error);
        res.status(500).json({ success: false, msg: "Failed to fetch stats" });
    }
};
module.exports = { register, login, registerEmployee, getAllEmployees };