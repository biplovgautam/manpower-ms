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
        const companyId = new mongoose.Types.ObjectId();
        const logoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Calculate 1 year from now
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        // 1. Create the Company using your specific Schema structure
        const company = await Company.create([{
            _id: companyId,
            name: agencyName,
            adminId: adminId,
            logo: logoBase64,
            billing: {
                plan: 'trial', // or 'annual' based on your logic
                startDate: new Date(),
                expiryDate: oneYearFromNow // Aligned with your Company.js model
            },
            settings: {
                isPassportPrivate: false // Default for your Passport Masking
            }
        }], { session });

        const userCount = await User.countDocuments({}).session(session);
        const assignedRole = userCount === 0 ? 'super_admin' : 'admin';

        // 2. Create the Admin User
        const user = await User.create([{
            _id: adminId,
            fullName,
            email: cleanEmail,
            password,
            role: assignedRole,
            contactNumber: cleanPhone,
            address: fullAddress,
            companyId: companyId,
            notificationSettings: {
                enabled: true,
                newJob: true,
                newEmployer: true,
                newWorker: true,
                newSubAgent: true
            }
        }], { session });

        await session.commitTransaction();

        res.status(StatusCodes.CREATED).json({
            success: true,
            user: {
                _id: user[0]._id,
                fullName: user[0].fullName,
                role: user[0].role
            },
            token: user[0].createJWT()
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    } finally {
        session.endSession();
    }
};

// --- 2. REGISTER EMPLOYEE (UPDATED WITH EMAIL LOGIC) ---
const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;
    const cleanPhone = normalizeIdentifier(contactNumber);
    const cleanEmail = email && email.trim() !== "" ? normalizeEmail(email) : undefined;

    try {
        const existing = await User.findOne({ contactNumber: cleanPhone });
        if (existing) return res.status(400).json({ msg: `Phone number already exists.` });

        const newUser = await User.create({
            fullName,
            email: cleanEmail,
            password,
            contactNumber: cleanPhone,
            address,
            role: 'employee',
            companyId: req.user.companyId
        });

        // 1. Send SMS Notification
        try {
            await sendNepaliSMS(cleanPhone, `Welcome ${fullName}! Login: ${contactNumber}, Pass: ${password}`);
        } catch (smsErr) {
            console.error("SMS Error:", smsErr.message);
        }

        // 2. Send Email Notification (The fixed part)
        if (cleanEmail) {
            try {
                await sendEmail({
                    to: cleanEmail,
                    subject: "Staff Account Created",
                    html: `
                        <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #2563eb;">Welcome, ${fullName}!</h2>
                            <p>Your employee account has been registered successfully.</p>
                            <p><strong>Login ID:</strong> ${contactNumber}</p>
                            <p><strong>Password:</strong> ${password}</p>
                            <br/>
                            <p style="font-size: 12px; color: #64748b;">Please login to your dashboard to get started.</p>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.error("Email Error:", emailErr.message);
                // We do not throw error here to ensure the client gets a success msg 
                // because the user was already created in DB.
            }
        }

        res.status(201).json({ success: true, msg: 'Employee registered successfully.' });
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

// --- 4. GET SINGLE EMPLOYEE DETAILS ---
const getSingleEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await User.findById(id).select('-password');
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        const [workers, demands, employers] = await Promise.all([
            Worker.find({ createdBy: id }).sort({ createdAt: -1 }),
            JobDemand.find({ createdBy: id }).sort({ createdAt: -1 }),
            Employer.find({ createdBy: id }).sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...employee.toObject(),
                workers,
                demands,
                employers
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

        // --- REQUIREMENT 5: CHECK BLOCKED STATUS ---
        if (user.isBlocked) {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: 'This account has been blocked by Admin. Access denied.'
            });
        }

        const company = await Company.findById(user.companyId);
        res.status(StatusCodes.OK).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId,
                notificationSettings: user.notificationSettings // Send settings to frontend
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

        // 1. Send SMS (Existing)
        if (user.contactNumber) {
            await sendNepaliSMS(user.contactNumber, `OTP: ${otp} (Ref: ${otpRef})`);
        }

        // 2. Send Email (New)
        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset OTP - Manpower Support',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p>You requested a password reset. Use the OTP below to proceed:</p>
                        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                            ${otp}
                        </div>
                        <p style="margin-top: 10px; color: #666;">Reference Code: <strong>${otpRef}</strong></p>
                        <p style="color: #ff0000; font-size: 12px;">This code expires in 10 minutes.</p>
                        <hr style="border: 0; border-top: 1px solid #eee;" />
                        <p style="font-size: 11px; color: #999;">If you did not request this, please ignore this email.</p>
                    </div>
                `
            });
        }

        res.status(200).json({ success: true, otpReference: otpRef });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error sending verification codes.' });
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

        // Send SMS
        if (user.contactNumber) {
            await sendNepaliSMS(user.contactNumber, `New OTP: ${otp} (Ref: ${otpRef})`);
        }

        // Send Email
        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: 'New Password Reset OTP',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
                        <h3>New OTP Requested</h3>
                        <p>Your new verification code is:</p>
                        <h2 style="color: #2c3e50; letter-spacing: 2px;">${otp}</h2>
                        <p>Reference: <strong>${otpRef}</strong></p>
                        <p>This code is valid for 10 minutes.</p>
                    </div>
                `
            });
        }

        res.status(200).json({ success: true, msg: 'OTP resent.', otpReference: otpRef });
    } catch (err) {
        res.status(500).json({ msg: 'Resend failed.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        const cleanId = normalizeIdentifier(identifier);
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            $or: [{ email: cleanId }, { contactNumber: cleanId }],
            passwordResetToken: hashedOTP,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or Expired OTP.' });

        // Update password and clear reset fields
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.otpReference = undefined;
        await user.save();

        // Send confirmation email
        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully',
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h3 style="color: #27ae60;">Success!</h3>
                        <p>Hello,</p>
                        <p>This is a confirmation that the password for your <strong>Manpower Support</strong> account has been successfully changed.</p>
                        <p>If you did not perform this action, please contact our support team immediately.</p>
                    </div>
                `
            });
        }

        res.status(200).json({ success: true, msg: 'Password updated.' });
    } catch (err) {
        res.status(500).json({ msg: 'Internal server error.' });
    }
};



const getMe = async (req, res) => {
    try {
        // req.user is provided by your 'protect' middleware
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            // This triggers your "User not found" console error
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// Update your module.exports at the bottom of controllers/auth.js
module.exports = {
    register,
    login,
    registerEmployee,
    getAllEmployees,
    getSingleEmployeeDetails,
    forgotPassword,
    resendOTP,
    resetPassword,
    getMe // <--- Add this
};