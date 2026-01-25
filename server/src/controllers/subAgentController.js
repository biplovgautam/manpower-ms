const SubAgent = require('../models/SubAgent');
const Worker = require('../models/Worker');
const User = require('../models/User');
// Import your centralized helper
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all sub-agents (Company-wide view)
 */
exports.getSubAgents = async (req, res) => {
  try {
    const { companyId } = req.user;

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId)
    };

    const agents = await SubAgent.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: 'subAgentId',
          as: 'workersList'
        }
      },
      {
        $addFields: {
          totalWorkersBrought: { $size: '$workersList' }
        }
      },
      { $project: { workersList: 0 } },
      { $sort: { name: 1 } }
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a new sub-agent
 */
exports.createSubAgent = async (req, res) => {
  try {
    const { name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId;

    // 1. Prevent Double Creation
    const recentAgent = await SubAgent.findOne({
      name,
      companyId,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentAgent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Duplicate entry detected. Please wait."
      });
    }

    // 2. Create Agent
    const agent = await SubAgent.create({
      ...req.body,
      companyId: companyId,
      createdBy: userId
    });

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `added a new sub-agent: ${name}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: agent });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update sub-agent
 */
exports.updateSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: req.params.id, companyId };

    // Role check: Only admin or the creator can edit
    if (role !== 'admin' && role !== 'tenant_admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });

    if (!agent) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized or Agent not found."
      });
    }

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `updated sub-agent details: ${agent.name}`
    });

    res.status(StatusCodes.OK).json({ success: true, data: agent });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete sub-agent
 */
exports.deleteSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: req.params.id, companyId };

    if (role !== 'admin' && role !== 'tenant_admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    // Find first to get the name before deletion
    const agentToDelete = await SubAgent.findOne(filter);

    if (!agentToDelete) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized or Agent not found."
      });
    }

    const agentName = agentToDelete.name;
    await agentToDelete.deleteOne();

    // --- TRIGGER NOTIFICATION ---
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `removed sub-agent: ${agentName}`
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Agent removed successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get workers for a specific agent
 */
exports.getSubAgentWorkers = async (req, res) => {
  try {
    const { companyId } = req.user;

    const agent = await SubAgent.findOne({ _id: req.params.id, companyId });

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found"
      });
    }

    const workers = await Worker.find({
      subAgentId: req.params.id,
      companyId: companyId
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({ success: true, data: workers });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};