const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get Dashboard stats, notes, and dropdown data
 * @route   GET /api/dashboard
 */
const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.user;
        const companyFilter = { companyId };

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
            Note.find({ companyId })
                .populate('createdBy', '_id fullName role email')
                .populate('linkedEntityId')
                .sort({ createdAt: -1 })
                .limit(200),
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
 * @desc    Create a new note/reminder
 * @route   POST /api/notes
 */
const addNote = async (req, res) => {
    try {
        const { content, category, targetDate, linkedEntityId } = req.body;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const note = await Note.create({
            content,
            category: category || 'general',
            targetDate: targetDate || null,
            attachment: fileUrl,
            linkedEntityId: linkedEntityId || null,
            companyId: req.user.companyId,
            createdBy: req.user.userId,
            isCompleted: false
        });

        const populatedNote = await Note.findById(note._id)
            .populate('createdBy', '_id fullName role email')
            .populate('linkedEntityId');

        res.status(StatusCodes.CREATED).json({ success: true, data: populatedNote });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Update an existing Note
 * @route   PATCH /api/notes/:id
 */
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user;

        const note = await Note.findOne({
            _id: id,
            companyId,
            createdBy: userId
        });

        if (!note) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                msg: "You can only edit your own notes"
            });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.attachment = `/uploads/${req.file.filename}`;
        }

        // Handle categoryRef if needed
        if (updateData.linkedEntityId || updateData.category) {
            const categoryModelMap = {
                'employer': 'Employer',
                'worker': 'Worker',
                'job-demand': 'JobDemand',
                'sub-agent': 'SubAgent'
            };
            const newCategory = updateData.category || note.category;
            updateData.categoryRef = categoryModelMap[newCategory] || null;
        }

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('createdBy', '_id fullName role email')
            .populate('linkedEntityId');

        res.status(StatusCodes.OK).json({ success: true, data: updatedNote });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Mark a reminder/note as done
 * @route   PATCH /api/notes/:id/done
 */
const markReminderAsDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user;

        const note = await Note.findOne({
            _id: id,
            companyId,
            createdBy: userId
        });

        if (!note) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                msg: "You can only mark your own reminders as done"
            });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { isCompleted: true },
            { new: true, runValidators: true }
        )
            .populate('createdBy', '_id fullName role email')
            .populate('linkedEntityId');

        res.status(StatusCodes.OK).json({
            success: true,
            msg: "Reminder marked as done",
            data: updatedNote
        });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to mark as done"
        });
    }
};

/**
 * @desc    Delete a Note permanently
 * @route   DELETE /api/notes/:id
 */
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user;

        const note = await Note.findOneAndDelete({
            _id: id,
            companyId,
            createdBy: userId
        });

        if (!note) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                msg: "You can only delete your own notes"
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            msg: "Note deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: error.message
        });
    }
};

module.exports = {
    getDashboardData,
    addNote,
    updateNote,
    markReminderAsDone,
    deleteNote
};