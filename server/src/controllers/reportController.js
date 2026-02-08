const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const SubAgent = require('../models/SubAgent');

exports.getPerformanceStats = async (req, res) => {
    try {
        // 1. SAFETY CHECK
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ 
                success: false, 
                error: "Unauthorized: Company context missing" 
            });
        }

        const { companyId, role } = req.user;
        const userId = req.user._id || req.user.userId || req.user.id;
        const { view } = req.query;

        // 2. REFINED TIMEFRAME LOGIC
        let timeframeDays;
        switch(view) {
            case 'day': timeframeDays = 1; break;
            case 'week': timeframeDays = 7; break;
            case 'month': timeframeDays = 30; break;
            default: timeframeDays = 90; 
        }

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - timeframeDays);

        const compId = new mongoose.Types.ObjectId(companyId);
        const aggFilter = { companyId: compId };

        if (view === 'personal' && role !== 'admin' && role !== 'super_admin') {
            aggFilter.createdBy = new mongoose.Types.ObjectId(userId);
        }

        // 3. EXECUTE AGGREGATIONS
        const [workerTrend, demandTrend, deploymentTrend, counts, statusData, topEmployers] = await Promise.all([
            // New Workers Trend
            Worker.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: startDate } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // New Job Demands Trend
            JobDemand.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: startDate } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // ACTUAL Deployment Trend
            // This tracks workers who reached "deployed" status during this period
            Worker.aggregate([
                { 
                    $match: { 
                        ...aggFilter, 
                        status: "deployed", 
                        updatedAt: { $gte: startDate } 
                    } 
                },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // Global Totals
            Promise.all([
                Worker.countDocuments(aggFilter),
                Employer.countDocuments(aggFilter),
                JobDemand.countDocuments(aggFilter),
                SubAgent.countDocuments(aggFilter)
            ]),

            // Status Breakdown
            Worker.aggregate([
                { $match: aggFilter },
                { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } }
            ]),

            // Top Employers
            Employer.aggregate([
                { $match: aggFilter },
                {
                    $lookup: {
                        from: "workers", 
                        localField: "_id",
                        foreignField: "employerId",
                        as: "workerDocs"
                    }
                },
                {
                    $project: {
                        name: { $ifNull: ["$employerName", "Unknown Employer"] },
                        loc: { $ifNull: ["$country", "N/A"] },
                        status: { $ifNull: ["$status", "active"] },
                        deployed: {
                            $size: {
                                $filter: {
                                    input: "$workerDocs",
                                    as: "w",
                                    cond: { $eq: ["$$w.status", "deployed"] }
                                }
                            }
                        }
                    }
                },
                { $sort: { deployed: -1 } },
                { $limit: 5 }
            ])
        ]);

        // 4. CHART DATA FORMATTING
        const dateMap = {};
        for (let i = 0; i <= timeframeDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            dateMap[dateStr] = { date: dateStr, workers: 0, demands: 0, deployed: 0 };
        }

        // Fill the map with actual data from MongoDB
        workerTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].workers = item.count; });
        demandTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].demands = item.count; });
        deploymentTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].deployed = item.count; });

        const statusMap = statusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // 5. FINAL RESPONSE
        res.status(200).json({
            success: true,
            viewType: view === 'personal' ? 'Personal Performance' : 'Agency Overview',
            summary: {
                totalWorkers: counts[0],
                activeEmployers: counts[1],
                totalJobDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: statusMap['processing'] || statusMap['in-progress'] || 0,
                pending: statusMap['pending'] || 0
            },
            chartData: Object.values(dateMap), // Using actual DB values 
            topEmployers: topEmployers
        });

    } catch (error) {
        console.error("CRITICAL_STATS_ERROR:", error);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error",
            message: error.message 
        });
    }
};