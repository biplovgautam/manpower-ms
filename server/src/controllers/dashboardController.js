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
        const { companyId, userId, role } = req.user;
        const companyFilter = { companyId };
        const notesFilter = { companyId, isCompleted: { $ne: true } }; // Exclude completed notes

        if (role !== 'admin' && role !== 'super_admin') {
            notesFilter.createdBy = userId;
        }

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
            subAgentList
        ] = await Promise.all([
            Employer.countDocuments(companyFilter),
            JobDemand.countDocuments(companyFilter),
            Worker.countDocuments(companyFilter),
            SubAgent.countDocuments(companyFilter),
            User.countDocuments({ ...companyFilter, role: 'employee' }),
            Note.find(notesFilter)
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(20),
            Employer.find(companyFilter).select('employerName country _id').sort('employerName'),
            Worker.find(companyFilter).select('name passportNumber _id').sort('name'),
            JobDemand.find(companyFilter).select('jobTitle _id').sort('jobTitle'),
            SubAgent.find(companyFilter).select('name _id').sort('name')
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
                    subAgents: subAgentList
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: "Failed to fetch dashboard data" });
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
            linkedEntityId,
            companyId: req.user.companyId,
            createdBy: req.user.userId,
            isCompleted: false // default
        });

        const populatedNote = await Note.findById(note._id).populate('createdBy', 'fullName');
        res.status(StatusCodes.CREATED).json({ success: true, data: populatedNote });
    } catch (error) {
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
        const { companyId, userId, role } = req.user;

        const filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            filter.createdBy = userId;
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.attachment = `/uploads/${req.file.filename}`;
        }

        const updatedNote = await Note.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true
        }).populate('createdBy', 'fullName');

        if (!updatedNote) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: "Note not found or unauthorized" });
        }

        res.status(StatusCodes.OK).json({ success: true, data: updatedNote });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * @desc    Mark a reminder/note as done (archive)
 * @route   PATCH /api/notes/:id/done
 */
const markReminderAsDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, userId, role } = req.user;

        const filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            filter.createdBy = userId;
        }

        const updatedNote = await Note.findOneAndUpdate(
            filter,
            { isCompleted: true },
            { new: true, runValidators: true }
        ).populate('createdBy', 'fullName');

        if (!updatedNote) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                msg: "Note not found or you don't have permission"
            });
        }

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
        const { companyId, userId, role } = req.user;

        const filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            filter.createdBy = userId;
        }

        const deletedNote = await Note.findOneAndDelete(filter);
        if (!deletedNote) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                msg: "Note not found or unauthorized"
            });
        }

        res.status(StatusCodes.OK).json({ success: true, msg: "Note deleted permanently" });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

module.exports = {
    getDashboardData,
    addNote,
    updateNote,
    markReminderAsDone,   // ← NEW
    deleteNote
};