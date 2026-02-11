const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const User = require('../models/User');
const Worker = require('../models/Worker'); 
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

/**
 * HELPER: Calculates if a demand should be 'closed'
 */
const getComputedStatus = (demand, actualWorkerCount) => {
    const requiredCount = demand.requiredWorkers || 0;
    
    // Rule 1: Fulfillment check
    const isFull = actualWorkerCount >= requiredCount && requiredCount > 0;
    
    // Rule 2: Deadline check
    const isExpired = demand.deadline && new Date(demand.deadline) < new Date();

    return (isFull || isExpired) ? 'closed' : 'open';
};

/**
 * @desc    Get all Job Demands (Company-wide)
 */
exports.getJobDemands = async (req, res) => {
    try {
        const { companyId } = req.user;
        if (!companyId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, error: "Company context missing" });
        }

        const jobDemands = await JobDemand.find({ companyId })
            .populate('employerId', 'employerName')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        const dataWithLiveCounts = await Promise.all(jobDemands.map(async (jd) => {
            const linkedWorkers = await Worker.find({ jobDemandId: jd._id }).select('name fullName');
            
            const actualWorkerCount = linkedWorkers.length;
            const computedStatus = getComputedStatus(jd, actualWorkerCount);

            if (jd.status !== computedStatus) {
                await JobDemand.updateOne({ _id: jd._id }, { $set: { status: computedStatus } });
                jd.status = computedStatus;
            }

            const demandObj = jd.toObject();
            demandObj.workers = linkedWorkers; 
            return demandObj;
        }));

        res.status(StatusCodes.OK).json({
            success: true,
            count: dataWithLiveCounts.length,
            data: dataWithLiveCounts
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Get Single Job Demand
 */
exports.getJobDemandById = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: "Invalid ID format" });
        }

        const jobDemandDoc = await JobDemand.findOne({ _id: id, companyId })
            .populate('employerId', 'employerName')
            .populate('createdBy', 'fullName');

        if (!jobDemandDoc) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Job Demand not found" });
        }

        const workersByRef = await Worker.find({ jobDemandId: id, companyId })
            .select('name fullName status currentStage passportNumber citizenshipNumber contact');

        const computedStatus = getComputedStatus(jobDemandDoc, workersByRef.length);
        if (jobDemandDoc.status !== computedStatus) {
            await JobDemand.updateOne({ _id: id }, { $set: { status: computedStatus } });
            jobDemandDoc.status = computedStatus;
        }

        const jobDemandData = jobDemandDoc.toObject();
        jobDemandData.workers = workersByRef;

        res.status(StatusCodes.OK).json({ 
            success: true, 
            data: jobDemandData,
            totalCandidates: workersByRef.length 
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Create Job Demand
 */
exports.createJobDemand = async (req, res) => {
    try {
        const { employerName, ...otherData } = req.body;
        const userId = req.user._id || req.user.userId;
        const { companyId } = req.user;

        const employer = await Employer.findOne({ employerName, companyId });
        if (!employer) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: "Employer not found" });
        }

        const initialStatus = (otherData.deadline && new Date(otherData.deadline) < new Date()) ? 'closed' : 'open';

        const jobDemand = await JobDemand.create({
            ...otherData,
            status: initialStatus,
            employerId: employer._id,
            createdBy: userId,
            companyId: companyId,
            workers: [] 
        });

        // KAFKA TRIGGER: Dispatched via notificationController
        await createNotification({
            companyId, 
            createdBy: userId, 
            category: 'demand',
            content: `added a new job demand: ${jobDemand.jobTitle} for ${employerName}`
        });

        res.status(StatusCodes.CREATED).json({ success: true, data: jobDemand });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
};

/**
 * @desc    Update Job Demand
 */
exports.updateJobDemand = async (req, res) => {
    try {
        const { id } = req.params;
        const { employerName, ...updateData } = req.body;
        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId;

        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'tenant_admin') {
            filter.createdBy = userId;
        }

        if (employerName) {
            const employer = await Employer.findOne({ employerName, companyId });
            if (employer) updateData.employerId = employer._id;
        }

        const jobDemand = await JobDemand.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true
        });

        if (!jobDemand) {
            return res.status(StatusCodes.FORBIDDEN).json({ success: false, error: "Access denied or not found" });
        }

        const actualWorkerCount = await Worker.countDocuments({ jobDemandId: id });
        const computedStatus = getComputedStatus(jobDemand, actualWorkerCount);
        
        if (jobDemand.status !== computedStatus) {
            jobDemand.status = computedStatus;
            await jobDemand.save();
        }

        // KAFKA TRIGGER
        await createNotification({
            companyId, 
            createdBy: userId, 
            category: 'demand',
            content: `updated job demand: ${jobDemand.jobTitle}`
        });

        res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Delete Job Demand
 */
exports.deleteJobDemand = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId;

        let filter = { _id: id, companyId };
        if (role !== 'admin' && role !== 'tenant_admin') { filter.createdBy = userId; }

        const demandToDelete = await JobDemand.findOne(filter);
        if (!demandToDelete) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Access denied" });
        }

        const title = demandToDelete.jobTitle;
        await demandToDelete.deleteOne();

        // KAFKA TRIGGER
        await createNotification({
            companyId, 
            createdBy: userId, 
            category: 'demand',
            content: `removed job demand: ${title}`
        });

        res.status(StatusCodes.OK).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Get Employer Specific Demands
 */
exports.getEmployerJobDemands = async (req, res) => {
    try {
        const { employerId } = req.params;
        const { companyId } = req.user;

        const jobDemands = await JobDemand.find({ employerId, companyId }).sort({ createdAt: -1 });

        const updatedDemands = await Promise.all(jobDemands.map(async (jd) => {
            const linkedWorkers = await Worker.find({ jobDemandId: jd._id }).select('name fullName');
            
            const actualWorkerCount = linkedWorkers.length;
            const computedStatus = getComputedStatus(jd, actualWorkerCount);

            if (jd.status !== computedStatus) {
                await JobDemand.updateOne({ _id: jd._id }, { $set: { status: computedStatus } });
                jd.status = computedStatus;
            }

            const demandObj = jd.toObject();
            demandObj.workers = linkedWorkers; 
            return demandObj;
        }));

        res.status(StatusCodes.OK).json({ success: true, count: updatedDemands.length, data: updatedDemands });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};