const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

const getDashboardData = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;

        /**
         * ownershipFilter ensures:
         * 1. Admins see everything in the company.
         * 2. Employees ONLY see what they personally created.
         */
        const ownershipFilter = { companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            ownershipFilter.createdBy = userId;
        }

        // Calculation for "Urgent" tasks: Target date within the next 3 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        const [
            employersCount,
            demandsCount,
            workersCount,
            agentsCount,
            notes,
            urgentTasksCount
        ] = await Promise.all([
            Employer.countDocuments(ownershipFilter),
            JobDemand.countDocuments(ownershipFilter),
            Worker.countDocuments(ownershipFilter),
            SubAgent.countDocuments(ownershipFilter),
            Note.find(ownershipFilter)
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(20), // Increased limit to ensure reminders are visible

            // Dynamically count tasks that have a deadline approaching
            Note.countDocuments({
                ...ownershipFilter,
                targetDate: { 
                    $gte: today, 
                    $lte: threeDaysFromNow 
                }
            })
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: agentsCount,
                    tasksNeedingAttention: urgentTasksCount // Real count from DB
                },
                notes
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

const addNote = async (req, res) => {
    try {
        // Included targetDate in destructuring
        const { content, category, targetDate } = req.body;
        
        if (!content) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Note content is required" });
        }

        const newNote = await Note.create({
            content,
            category: category || 'general',
            targetDate: targetDate || null, // Saves the deadline from the calendar
            companyId: req.user.companyId,
            createdBy: req.user.userId
        });

        const note = await Note.findById(newNote._id).populate('createdBy', 'fullName');
        res.status(StatusCodes.CREATED).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

const updateNote = async (req, res) => {
    try {
        // Using req.body allows targetDate, content, and category to be updated
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body, 
            { new: true, runValidators: true }
        ).populate('createdBy', 'fullName');

        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = { getDashboardData, addNote, updateNote, deleteNote };