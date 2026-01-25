const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get Dashboard stats, notes, and dropdown data
 * Logic: Stats are Company-wide, Notes are filtered by "Tag" (assignedTo)
 */
const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;
        const companyFilter = { companyId };

        // PERSONALIZED NOTE FILTER: 
        // 1. You created it OR 
        // 2. You are tagged in it OR 
        // 3. It's a general note for the whole company (assignedTo is null)
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

            // Fetch personalized notes
            Note.find(noteFilter)
                .populate('createdBy', '_id fullName role email')
                .populate('assignedTo', '_id fullName')
                .populate('linkedEntityId')
                .sort({ createdAt: -1 })
                .limit(200),

            // Dropdowns (Always company-wide so employees can select any entity)
            Employer.find(companyFilter).select('employerName country _id').sort('employerName'),
            Worker.find(companyFilter).select('name passportNumber _id').sort('name'),
            JobDemand.find(companyFilter).select('jobTitle _id').sort('jobTitle'),
            SubAgent.find(companyFilter).select('name _id').sort('name'),
            User.find(companyFilter).select('fullName email _id').sort('fullName')
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: agentsCount,
                    totalEmployees: employeesCount
                },
                notes,
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
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to fetch dashboard data"
        });
    }
};

/**
 * @desc    Create a new note/reminder (with assignedTo tagging)
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
            assignedTo: assignedTo || null, // The "Tag" logic
            companyId: companyId,
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

        // Restriction: Only Creator or Admin can modify content
        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
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
 * @desc    Mark as done (Anyone tagged in the note OR the creator)
 */
const markReminderAsDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        // Permission: User must be part of the company AND (Creator OR Tagged Person)
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
 * @desc    Delete Note (Owner or Admin Only)
 */
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;

        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
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