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

        // Admins get all notes (including completed). Non-admins get only their notes.
        const notesFilter = { companyId };
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
            subAgentList,
            employeeList
        ] = await Promise.all([
            Employer.countDocuments(companyFilter),
            JobDemand.countDocuments(companyFilter),
            Worker.countDocuments(companyFilter),
            SubAgent.countDocuments(companyFilter),
            User.countDocuments({ ...companyFilter, role: 'employee' }),
            // Return notes (no isCompleted filter so admin can see archived/completed)
            Note.find(notesFilter)
                .populate('createdBy', 'fullName role email')
                .populate('linkedEntityId') // uses refPath/categoryRef
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

        // map category to model name for refPath
        const categoryModelMap = {
            'employer': 'Employer',
            'worker': 'Worker',
            'job-demand': 'JobDemand',
            'sub-agent': 'SubAgent'
        };
        const categoryRef = categoryModelMap[category] || null;

        const note = await Note.create({
            content,
            category: category || 'general',
            targetDate: targetDate || null,
            attachment: fileUrl,
            linkedEntityId: linkedEntityId || null,
            categoryRef: linkedEntityId ? categoryRef : null,
            companyId: req.user.companyId,
            createdBy: req.user.userId,
            isCompleted: false // default
        });

        const populatedNote = await Note.findById(note._id)
            .populate('createdBy', 'fullName role email')
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
        const { companyId, userId, role } = req.user;

        const filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            filter.createdBy = userId;
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.attachment = `/uploads/${req.file.filename}`;
        }

        // update categoryRef when linkedEntityId or category is provided
        if (updateData.linkedEntityId || updateData.category) {
            const categoryModelMap = {
                'employer': 'Employer',
                'worker': 'Worker',
                'job-demand': 'JobDemand',
                'sub-agent': 'SubAgent'
            };
            const newCategory = updateData.category || (await Note.findById(id).select('category')).category;
            updateData.categoryRef = categoryModelMap[newCategory] || null;
            if (!updateData.linkedEntityId) {
                // if linkedEntityId removed, clear categoryRef too
                updateData.linkedEntityId = null;
                updateData.categoryRef = null;
            }
        }

        const updatedNote = await Note.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true
        })
            .populate('createdBy', 'fullName role email')
            .populate('linkedEntityId');

        if (!updatedNote) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: "Note not found or unauthorized" });
        }

        res.status(StatusCodes.OK).json({ success: true, data: updatedNote });
    } catch (error) {
        console.error(error);
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
        )
            .populate('createdBy', 'fullName role email')
            .populate('linkedEntityId');

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
        console.error(error);
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