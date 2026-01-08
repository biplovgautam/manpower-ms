const SubAgent = require('../models/SubAgent');
const Worker = require('../models/Worker');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all sub-agents (Admin: All, Employee: Own Only)
 */
exports.getSubAgents = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { view } = req.query;

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId)
    };

    // Apply ownership filter unless it's an admin or dropdown 'all' view
    if (role !== 'admin' && role !== 'super_admin' && view !== 'all') {
      matchStage.createdBy = new mongoose.Types.ObjectId(userId);
    }

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
    const agentData = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.userId // Now correctly allowed by the Schema
    };

    const agent = await SubAgent.create(agentData);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update sub-agent (Ownership Protected)
 */
exports.updateSubAgent = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    let agent = await SubAgent.findOne(filter);

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found or unauthorized"
      });
    }

    agent = await SubAgent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(StatusCodes.OK).json({ success: true, data: agent });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete sub-agent (Ownership Protected)
 */
exports.deleteSubAgent = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOneAndDelete(filter);

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found or unauthorized"
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Agent removed successfully"
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get workers for a specific agent
 */
exports.getSubAgentWorkers = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOne(filter);

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found or unauthorized"
      });
    }

    const workers = await Worker.find({ subAgentId: req.params.id })
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: workers
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};