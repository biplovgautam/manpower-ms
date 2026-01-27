const Note = require('../models/Notes');
const Notification = require('../models/Notification'); // Ensure this model exists
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get Dashboard stats, notes, notifications, and dropdown data
 */
const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;
        const companyFilter = { companyId };

        // 1. PERSONALIZED NOTE FILTER (Reminders/Tasks)
        const noteFilter = {
            companyId,
            $or: [
                { createdBy: userId },
                { assignedTo: userId },
                { assignedTo: null }
            ]
        };

        const [
            employersCount,
            demandsCount,
            workersCount,
            agentsCount,
            employeesCount,
            notes,
            notifications, // New: Fetching Activity Logs
            employerList,
            workerList,
            demandList,
            subAgentList,
            employeeList
        ] = await Promise.all([
            Employer.countDocuments(companyFilter),
            JobDemand.countDocuments(companyFilter),
            Worker.countDocuments(companyFilter),
            SubAgent.countDocuments(companyFilter),
            User.countDocuments({ ...companyFilter, role: 'employee' }),

            // Fetch personalized Notes (Reminders)
            Note.find(noteFilter)
                .populate('createdBy', '_id fullName role')
                .populate('assignedTo', '_id fullName')
                .sort({ createdAt: -1 })
                .limit(100),

            // Fetch Company-wide Notifications (Activity Logs)
            Notification.find(companyFilter)
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(50),

            // Dropdowns
            Employer.find(companyFilter).select('employerName country _id').sort('employerName'),
            Worker.find(companyFilter).select('name passportNumber _id').sort('name'),
            JobDemand.find(companyFilter).select('jobTitle _id').sort('jobTitle'),
            SubAgent.find(companyFilter).select('name _id').sort('name'),
            User.find(companyFilter).select('fullName email _id').sort('fullName')
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                user: req.user, // Useful for frontend context
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: agentsCount,
                    totalEmployees: employeesCount
                },
                notes,         // Reminders/Tasks
                notifications, // Activity Logs for Header/Logs page
                dropdowns: {
                    employers: employerList,
                    workers: workerList,
                    demands: demandList,
                    subAgents: subAgentList,
                    employees: employeeList
                }
            }
        });
    } catch (error) {
        console.error("Dashboard Data Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to fetch dashboard data"
        });
    }
};

/**
 * @desc    Create a new note/reminder
 */
const addNote = async (req, res) => {
    try {
        const { content, category, targetDate, linkedEntityId, assignedTo } = req.body;
        const { companyId } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const note = await Note.create({
            content,
            category: category || 'general',
            targetDate: targetDate || null,
            attachment: fileUrl,
            linkedEntityId: linkedEntityId || null,
            assignedTo: assignedTo || null,
            companyId,
            createdBy: userId,
            isCompleted: false
        });

        const populatedNote = await Note.findById(note._id)
            .populate('createdBy', '_id fullName role email')
            .populate('assignedTo', '_id fullName')
            .populate('linkedEntityId');

        res.status(StatusCodes.CREATED).json({ success: true, data: populatedNote });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Update an existing Note (Owner or Admin Only)
 */
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'tenant_admin') {
            filter.createdBy = userId;
        }

        const note = await Note.findOne(filter);
        if (!note) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                msg: "Unauthorized: You can only edit your own notes"
            });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('createdBy assignedTo linkedEntityId');

        res.status(StatusCodes.OK).json({ success: true, data: updatedNote });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Mark reminder as done
 */
const markReminderAsDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                companyId,
                $or: [{ createdBy: userId }, { assignedTo: userId }, { assignedTo: null }]
            },
            { isCompleted: true },
            { new: true }
        ).populate('createdBy assignedTo linkedEntityId');

        if (!note) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                msg: "You do not have permission to mark this note as done"
            });
        }

        res.status(StatusCodes.OK).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Delete Note
 */
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'tenant_admin') {
            filter.createdBy = userId;
        }

        const note = await Note.findOneAndDelete(filter);
        if (!note) return res.status(StatusCodes.FORBIDDEN).json({ success: false, msg: "Unauthorized" });

        res.status(StatusCodes.OK).json({ success: true, msg: "Deleted successfully" });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

module.exports = {
    getDashboardData,
    addNote,
    updateNote,
    markReminderAsDone,
    deleteNote
};