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

        // 2. TIMEFRAME LOGIC
        const now = new Date();
        const startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);

        switch(view) {
            case 'day': break; 
            case 'week': 
                startDate.setUTCDate(startDate.getUTCDate() - 7);
                break;
            case 'month': 
                startDate.setUTCDate(startDate.getUTCDate() - 30);
                break;
            default: 
                startDate.setUTCDate(startDate.getUTCDate() - 90);
        }

        const compId = new mongoose.Types.ObjectId(companyId);
        const aggFilter = { companyId: compId };

        if (view === 'personal' && role !== 'admin' && role !== 'super_admin') {
            aggFilter.createdBy = new mongoose.Types.ObjectId(userId);
        }

        // 3. EXECUTE AGGREGATIONS
        const [
            workerTrend, 
            demandTrend, 
            deploymentTrend, 
            employerTrend, 
            counts, 
            statusData, 
            topEmployers
        ] = await Promise.all([
            // Workers Registration Trend
            Worker.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: startDate } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // Job Demands Trend
            JobDemand.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: startDate } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // Deployment Trend (based on updatedAt when status is 'deployed')
            Worker.aggregate([
                { 
                    $match: { 
                        ...aggFilter, 
                        $or: [{ status: "deployed" }, { currentStage: "deployed" }],
                        updatedAt: { $gte: startDate } 
                    } 
                },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // Employer Acquisition Trend
            Employer.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: startDate } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { _id: 1 } }
            ]),

            // Global Totals for KPI Cards
            Promise.all([
                Worker.countDocuments(aggFilter),
                Employer.countDocuments(aggFilter),
                JobDemand.countDocuments(aggFilter),
                SubAgent.countDocuments(aggFilter)
            ]),

            // Status Breakdown for Pie/Donut charts
            Worker.aggregate([
                { $match: aggFilter },
                { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } }
            ]),

            // Top Employers Ranking
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
                                    cond: { $or: [{ $eq: ["$$w.status", "deployed"] }, { $eq: ["$$w.currentStage", "deployed"] }] }
                                }
                            }
                        }
                    }
                },
                { $sort: { deployed: -1 } },
                { $limit: 5 }
            ])
        ]);

        // 4. CHART DATA FORMATTING (Creating a continuous timeline)
        const dateMap = {};
        const endOfToday = new Date();
        endOfToday.setUTCHours(23, 59, 59, 999);
        let currentLoopDate = new Date(startDate);
        
        while (currentLoopDate <= endOfToday) {
            const dateStr = currentLoopDate.toISOString().split('T')[0];
            // Initialize all metrics to 0 for each date in the range
            dateMap[dateStr] = { 
                date: dateStr, 
                workers: 0, 
                demands: 0, 
                deployed: 0, 
                employers: 0 
            };
            currentLoopDate.setUTCDate(currentLoopDate.getUTCDate() + 1);
        }

        // Fill the map with actual data from aggregations
        workerTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].workers = item.count; });
        demandTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].demands = item.count; });
        deploymentTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].deployed = item.count; });
        employerTrend.forEach(item => { if (dateMap[item._id]) dateMap[item._id].employers = item.count; });

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
                totalEmployers: counts[1],
                totalJobDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: (statusMap['processing'] || 0) + (statusMap['in-progress'] || 0),
                pending: statusMap['pending'] || 0
            },
            chartData: Object.values(dateMap),
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