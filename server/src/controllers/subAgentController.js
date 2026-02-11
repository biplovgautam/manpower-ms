const SubAgent = require('../models/SubAgent');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all sub-agents (Company-wide view with worker names for search)
 */
exports.getSubAgents = async (req, res) => {
  try {
    const { companyId } = req.user;

    const agents = await SubAgent.aggregate([
      { 
        $match: { companyId: new mongoose.Types.ObjectId(companyId) } 
      },
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
          totalWorkersBrought: { $size: '$workersList' },
          workerNames: '$workersList.fullName' 
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
    console.error('Error in getSubAgents:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching sub-agents'
    });
  }
};

/**
 * @desc    Get a single sub-agent by ID
 */
exports.getSubAgentById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const agentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid sub-agent ID format'
      });
    }

    const agent = await SubAgent.findOne({
      _id: agentId,
      companyId: new mongoose.Types.ObjectId(companyId)
    });

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Sub-agent not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Error in getSubAgentById:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching sub-agent'
    });
  }
};

/**
 * @desc    Create a new sub-agent + Kafka Notify
 */
exports.createSubAgent = async (req, res) => {
  try {
    const { name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId;

    // Prevent accidental double-submissions
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

    const agent = await SubAgent.create({
      ...req.body,
      companyId,
      createdBy: userId
    });

    // Pushes to Kafka Topic via notificationController
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `added a new sub-agent: ${name}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: agent });
  } catch (error) {
    console.error('Error in createSubAgent:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create sub-agent'
    });
  }
};

/**
 * @desc    Update sub-agent + Kafka Notify
 */
exports.updateSubAgent = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId;

    const agent = await SubAgent.findOneAndUpdate(
      { _id: req.params.id, companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Sub-agent not found or unauthorized"
      });
    }

    // Notify via Kafka
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `updated sub-agent details: ${agent.name}`
    });

    res.status(StatusCodes.OK).json({ success: true, data: agent });
  } catch (error) {
    console.error('Error in updateSubAgent:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update sub-agent'
    });
  }
};

/**
 * @desc    Delete sub-agent + Kafka Notify
 */
exports.deleteSubAgent = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId;

    const agentToDelete = await SubAgent.findOne({ _id: req.params.id, companyId });

    if (!agentToDelete) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Sub-agent not found or unauthorized"
      });
    }

    const agentName = agentToDelete.name;
    await agentToDelete.deleteOne();

    // Notify via Kafka
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `removed sub-agent: ${agentName}`
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Sub-agent removed successfully" });
  } catch (error) {
    console.error('Error in deleteSubAgent:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error deleting sub-agent'
    });
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
        message: "Sub-agent not found"
      });
    }

    const workers = await Worker.find({
      subAgentId: req.params.id,
      companyId
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({ success: true, data: workers });
  } catch (error) {
    console.error('Error in getSubAgentWorkers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching workers'
    });
  }
};