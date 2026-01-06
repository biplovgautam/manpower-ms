const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent'); // Imported SubAgent
const { StatusCodes } = require('http-status-codes');

const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.user;

        // Run all counts and notes query in parallel for better performance
        const [
            employersCount, 
            demandsCount, 
            workersCount, 
            agentsCount, 
            notes
        ] = await Promise.all([
            Employer.countDocuments({ companyId }),
            JobDemand.countDocuments({ companyId }),
            Worker.countDocuments({ companyId }),
            SubAgent.countDocuments({}), // Use {} if SubAgents aren't filtered by companyId yet
            Note.find({ companyId }).sort({ createdAt: -1 }).limit(10)
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    tasksNeedingAttention: 0,
                    activeSubAgents: agentsCount // Now returns the real count from database
                },
                notes
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            success: false, 
            msg: error.message 
        });
    }
};

const addNote = async (req, res) => {
    try {
        const { content, category } = req.body;
        const note = await Note.create({
            content,
            category,
            companyId: req.user.companyId,
            createdBy: req.user.userId 
        });
        res.status(StatusCodes.CREATED).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

const updateNote = async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = { getDashboardData, addNote, updateNote, deleteNote };