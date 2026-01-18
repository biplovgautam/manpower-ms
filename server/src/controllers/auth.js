const User = require('../models/User');
const Company = require('../models/Company');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendNepaliSMS = require('../utils/sendSMS');

// --- HELPER FUNCTIONS ---
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string' || email.trim() === '') return undefined;
    const [local, domain] = email.toLowerCase().trim().split('@');
    if (!local || !domain) return undefined;
    return `${local.split('+')[0]}@${domain}`;
};

const normalizeIdentifier = (id) => {
    if (!id || typeof id !== 'string') return id;
    const val = id.trim();
    if (val.includes('@')) return normalizeEmail(val);
    if (/^[9][0-9]{9}$/.test(val)) return `+977${val}`;
    return val;
};

// --- 1. REGISTER ADMIN & COMPANY ---
const register = async (req, res) => {
    const { agencyName, fullAddress, fullName, email, contactNumber, password } = req.body;
    if (!agencyName || !fullName || !contactNumber || !fullAddress || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'All fields required.' });
    }
    if (!req.file) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Logo required.' });

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizeIdentifier(contactNumber);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existingUser = await User.findOne({ contactNumber: cleanPhone }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Account already exists.` });
        }

        const adminId = new mongoose.Types.ObjectId();
        const logoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const company = await Company.create([{
            name: agencyName,
            adminId,
            logo: logoBase64
        }], { session });

        const user = await User.create([{
            _id: adminId,
            fullName,
            email: cleanEmail,
            password,
            role: (await User.countDocuments({}).session(session)) === 0 ? 'super_admin' : 'admin',
            contactNumber: cleanPhone,
            address: fullAddress,
            companyId: company[0]._id
        }], { session });

        await session.commitTransaction();
        res.status(StatusCodes.CREATED).json({
            success: true,
            user: { fullName: user[0].fullName, role: user[0].role },
            token: user[0].createJWT()
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    } finally { session.endSession(); }
};

// --- 2. REGISTER EMPLOYEE ---
const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;
    const cleanPhone = normalizeIdentifier(contactNumber);
    const cleanEmail = email && email.trim() !== "" ? normalizeEmail(email) : undefined;

    try {
        const existing = await User.findOne({ contactNumber: cleanPhone });
        if (existing) return res.status(400).json({ msg: `Phone number already exists.` });

        await User.create({
            fullName,
            email: cleanEmail,
            password,
            contactNumber: cleanPhone,
            address,
            role: 'employee',
            companyId: req.user.companyId
        });

        sendNepaliSMS(cleanPhone, `Welcome ${fullName}! Login: ${contactNumber}, Pass: ${password}`);
        res.status(201).json({ success: true, msg: 'Employee registered.' });
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
};

// --- 3. GET ALL EMPLOYEES (Stats) ---
const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('-password').sort({ createdAt: -1 }).lean();

        const employeesWithStats = await Promise.all(employees.map(async (employee) => {
            return {
                ...employee,
                employersAdded: await Employer.countDocuments({ createdBy: employee._id }),
                jobDemandsCreated: await JobDemand.countDocuments({ createdBy: employee._id }),
                workersManaged: await Worker.countDocuments({ createdBy: employee._id })
            };
        }));

        res.status(StatusCodes.OK).json({ success: true, data: employeesWithStats });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to fetch employees.' });
    }
};

// --- 4. GET SINGLE EMPLOYEE DETAILS (Data Isolation Fix) ---
const getSingleEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params; // The ID of the employee (e.g. Hari)

        const employee = await User.findById(id).select('-password');
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Fetch data strictly created by this employee
        const [workers, demands, employers] = await Promise.all([
            Worker.find({ createdBy: id }).sort({ createdAt: -1 }),
            JobDemand.find({ createdBy: id }).sort({ createdAt: -1 }),
            Employer.find({ createdBy: id }).sort({ createdAt: -1 }) // Added Employers
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...employee.toObject(),
                workers,
                demands,
                employers // Now returning all 3 lists
            }
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// --- 5. LOGIN ---
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const cleanId = normalizeIdentifier(identifier);

        const user = await User.findOne({
            $or: [{ email: cleanId }, { contactNumber: cleanId }]
        }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid credentials.' });
        }

        const company = await Company.findById(user.companyId);

        res.status(StatusCodes.OK).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId,
                companyName: company?.name || 'ManpowerMS',
                companyLogo: company?.logo || null
            },
            token: user.createJWT()
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Login failed.' });
    }
};

// --- 6. PASSWORD MANAGEMENT ---
const forgotPassword = async (req, res) => {
    try {
        const cleanId = normalizeIdentifier(req.body.identifier);
        const user = await User.findOne({ $or: [{ email: cleanId }, { contactNumber: cleanId }] });
        if (!user) return res.status(404).json({ msg: 'Account not found.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpRef = crypto.randomBytes(2).toString('hex').toUpperCase();

        user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        user.otpReference = otpRef;
        await user.save();

        await sendNepaliSMS(user.contactNumber, `OTP: ${otp} (Ref: ${otpRef})`);
        res.status(StatusCodes.OK).json({ success: true, otpReference: otpRef });
    } catch (err) {
        res.status(500).json({ msg: 'Error sending OTP' });
    }
};

const resendOTP = async (req, res) => {
    try {
        const cleanId = normalizeIdentifier(req.body.identifier);
        const user = await User.findOne({ $or: [{ email: cleanId }, { contactNumber: cleanId }] });
        if (!user) return res.status(404).json({ msg: 'Account not found.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpRef = crypto.randomBytes(2).toString('hex').toUpperCase();

        user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        user.otpReference = otpRef;
        await user.save();

        await sendNepaliSMS(user.contactNumber, `New OTP: ${otp} (Ref: ${otpRef})`);
        res.status(200).json({ success: true, msg: 'OTP resent.' });
    } catch (err) {
        res.status(500).json({ msg: 'Resend failed.' });
    }
};

const resetPassword = async (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    const cleanId = normalizeIdentifier(identifier);
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        $or: [{ email: cleanId }, { contactNumber: cleanId }],
        passwordResetToken: hashedOTP,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Invalid or Expired OTP.' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.otpReference = undefined;
    await user.save();

    res.status(200).json({ success: true, msg: 'Password updated.' });
};

module.exports = {
    register,
    login,
    registerEmployee,
    getAllEmployees,
    getSingleEmployeeDetails,
    forgotPassword,
    resendOTP,
    resetPassword
};