const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers'); // Fixed based on your require line
const SubAgent = require('../models/SubAgent');

// Change export name to match what your route file is importing
exports.getPerformanceStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [workerTrend, demandTrend, counts, statusData] = await Promise.all([
            // Trend: Workers Added
            Worker.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
            ]),
            // Trend: Demands Created
            JobDemand.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
            ]),
            // Summary Totals
            Promise.all([
                Worker.countDocuments(),
                Employer.countDocuments({ status: 'active' }),
                JobDemand.countDocuments(),
                SubAgent.countDocuments({ status: 'active' })
            ]),
            // Doughnut: Status distribution
            Worker.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // Merge Trends by Date and align keys with frontend (workersAdded / jobDemandsCreated)
        const allDates = [...new Set([...workerTrend.map(x => x._id), ...demandTrend.map(x => x._id)])].sort();
        const chartData = allDates.map(date => ({
            date,
            workersAdded: workerTrend.find(w => w._id === date)?.count || 0,
            jobDemandsCreated: demandTrend.find(d => d._id === date)?.count || 0
        }));

        const statusMap = statusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            summary: {
                totalWorkers: counts[0],
                activeEmployers: counts[1],
                totalDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: statusMap['processing'] || 0,
                pending: statusMap['pending'] || 0,
                statusMap // Keeping this for flexibility
            },
            chartData
        });
    } catch (error) {
        console.error("Report Controller Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getPerformanceStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [workerTrend, demandTrend, counts, statusData, topSubAgents] = await Promise.all([
            // Recruitment in last 30 days
            Worker.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } }
            ]),
            // Job Demands in last 30 days
            JobDemand.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } }
            ]),
            // Global Totals (Current Snapshot)
            Promise.all([
                Worker.countDocuments(),
                Employer.countDocuments({ status: 'active' }),
                JobDemand.countDocuments(),
                SubAgent.countDocuments({ status: 'active' })
            ]),
            // Funnel Stats
            Worker.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            // Top Performers (Last 30 Days)
            Worker.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: "$subAgentId", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: "subagents", localField: "_id", foreignField: "_id", as: "details" } },
                { $unwind: "$details" }
            ])
        ]);

        const statusMap = statusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            summary: {
                totalWorkers: counts[0],
                activeEmployers: counts[1],
                totalDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: statusMap['processing'] || 0,
                pending: statusMap['pending'] || 0,
            },
            chartData: workerTrend.map(w => ({
                date: w._id,
                workers: w.count,
                demands: demandTrend.find(d => d._id === w._id)?.count || 0
            })),
            topPerformers: topSubAgents.map(a => ({ name: a.details.name, count: a.count }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};