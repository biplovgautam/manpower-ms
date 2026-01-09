// D:\manpower-ms\server\controllers\auth.js
const User = require('../models/User');
const Company = require('../models/Company');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

// Helper: Only normalizes if email exists
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return null;
    const [local, domain] = email.toLowerCase().trim().split('@');
    if (!local || !domain) return null;
    return `${local.split('+')[0]}@${domain}`;
};

// 1. REGISTER ADMIN/SUPER_ADMIN
const register = async (req, res) => {
    // Destructure 'logo' from the request body
    const { fullName, email, password, role, companyName, contactNumber, address, logo } = req.body;

    if (!fullName || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Full Name and Password are required.' });
    }

    const cleanEmail = normalizeEmail(email);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (cleanEmail) {
            const existingUser = await User.findOne({ email: cleanEmail }).session(session);
            if (existingUser) {
                await session.abortTransaction();
                return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email already exists.' });
            }
        }

        const isFirstAccount = (await User.countDocuments({}).session(session)) === 0;
        let userRole = isFirstAccount ? 'super_admin' : (role || 'admin');

        const userId = new mongoose.Types.ObjectId();
        let companyId = null;

        if (userRole === 'admin') {
            if (!companyName) {
                await session.abortTransaction();
                return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Company Name required for Admin.' });
            }
            // Create company and include the logo
            const company = await Company.create([{
                name: companyName,
                adminId: userId,
                logo: logo || null
            }], { session });
            companyId = company[0]._id;
        }

        const user = await User.create([{
            _id: userId,
            fullName,
            email: cleanEmail || undefined,
            password,
            role: userRole,
            contactNumber: contactNumber || 'N/A',
            address: address || 'N/A',
            companyId
        }], { session });

        await session.commitTransaction();
        res.status(StatusCodes.CREATED).json({
            success: true,
            user: { fullName: user[0].fullName, email: user[0].email || 'No email provided' }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    } finally {
        session.endSession();
    }
};

// 2. LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email and password required' });

        const cleanEmail = normalizeEmail(email);
        const user = await User.findOne({ email: cleanEmail }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
        }

        const token = user.createJWT();
        res.status(StatusCodes.OK).json({
            success: true,
            user: { userId: user._id, fullName: user.fullName, role: user.role, companyId: user.companyId },
            token
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    }
};

// 3. REGISTER EMPLOYEE (Admin Action)
const registerEmployee = async (req, res) => {
    try {
        const { fullName, email, password, contactNumber, address } = req.body;
        const adminCompanyId = req.user.companyId;

        if (!adminCompanyId) {
            return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Admin Company context missing.' });
        }

        if (!fullName || !password || !contactNumber || !address) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Name, Password, Contact, and Address are required.' });
        }

        const cleanEmail = normalizeEmail(email);

        if (cleanEmail) {
            const existingUser = await User.findOne({ email: cleanEmail });
            if (existingUser) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email already exists.' });
        }

        const employee = await User.create({
            fullName,
            email: cleanEmail || undefined,
            password,
            contactNumber,
            address,
            role: 'employee',
            companyId: adminCompanyId
        });

        res.status(StatusCodes.CREATED).json({
            success: true,
            msg: 'Employee registered successfully',
            employee: { id: employee._id, email: employee.email || 'N/A' }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    }
};

// 4. GET ALL EMPLOYEES
const getAllEmployees = async (req, res) => {
    try {
        const adminCompanyId = req.user.companyId;
        const compId = new mongoose.Types.ObjectId(adminCompanyId);

        const employees = await User.find({ companyId: compId, role: 'employee' }).select('-password').lean();

        const employeesWithStats = await Promise.all(employees.map(async (emp) => {
            const targetId = new mongoose.Types.ObjectId(emp._id);
            const [employersCount, demandsCount, workersCount] = await Promise.all([
                Employer.countDocuments({ createdBy: targetId }),
                JobDemand.countDocuments({ createdBy: targetId }),
                Worker.countDocuments({
                    companyId: compId,
                    $or: [{ createdBy: targetId }, { assignedTo: targetId }]
                })
            ]);

            return { ...emp, employersAdded: employersCount, jobDemandsCreated: demandsCount, workersManaged: workersCount };
        }));

        res.status(StatusCodes.OK).json({ success: true, count: employeesWithStats.length, data: employeesWithStats });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};
// controllers/auth.js

const forceResetPassword = async (req, res) => {
    const { email, newPassword, recoveryKey } = req.body;

    // 1. Security Check: Compare against environment variable
    if (!recoveryKey || recoveryKey !== process.env.ADMIN_RECOVERY_KEY) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Unauthorized: Invalid Recovery Key' });
    }

    if (!email || !newPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email and New Password are required' });
    }

    try {
        const cleanEmail = normalizeEmail(email);

        // Find the user
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'User not found' });
        }

        // 2. Update the password field
        // Assigning the plain text password here will trigger the .pre('save') 
        // hook in your User model to hash it before storing.
        user.password = newPassword;

        // Use validateModifiedOnly to bypass validation for fields not being changed
        await user.save({ validateModifiedOnly: true });

        res.status(StatusCodes.OK).json({
            success: true,
            msg: `Password for ${user.fullName} updated successfully.`
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    }
};
// Add to module.exports
module.exports = {
    register,
    login,
    registerEmployee,
    getAllEmployees,
    forceResetPassword // <--- Added
};
