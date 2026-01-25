const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const SubAgent = require('../models/SubAgent');
const { StatusCodes } = require('http-status-codes');

exports.getPerformanceStats = async (req, res) => {
    try {
        const { companyId, role } = req.user;
        // Robust userId fallback
        const userId = req.user._id || req.user.userId || req.user.id;

        const { view } = req.query; // Optional: ?view=personal

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Define the Match Filter
        const aggFilter = {
            companyId: new mongoose.Types.ObjectId(companyId)
        };

        /**
         * LOGIC CHANGE: 
         * By default, show company-wide stats. 
         * If the user explicitly asks for 'personal' and isn't an admin, filter by createdBy.
         */
        if (view === 'personal' && role !== 'admin' && role !== 'super_admin') {
            aggFilter.createdBy = new mongoose.Types.ObjectId(userId);
        }

        const [workerTrend, demandTrend, counts, statusData] = await Promise.all([
            // Workers Added Trend (Last 30 Days)
            Worker.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Job Demands Trend (Last 30 Days)
            JobDemand.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Totals for Summary Cards
            Promise.all([
                Worker.countDocuments(aggFilter),
                Employer.countDocuments(aggFilter), // Removed status check to match Dashboard logic
                JobDemand.countDocuments(aggFilter),
                SubAgent.countDocuments(aggFilter)
            ]),
            // Worker Status Distribution (Pie Chart data)
            Worker.aggregate([
                { $match: aggFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // Merge Trends into single array for Area/Line Charts
        const allDates = [...new Set([...workerTrend.map(x => x._id), ...demandTrend.map(x => x._id)])].sort();
        const formattedChartData = allDates.map(date => ({
            date,
            workersAdded: workerTrend.find(w => w._id === date)?.count || 0,
            jobDemandsCreated: demandTrend.find(d => d._id === date)?.count || 0
        }));

        // Convert aggregation array to easy-to-use object
        const statusMap = statusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(StatusCodes.OK).json({
            success: true,
            summary: {
                totalWorkers: counts[0],
                activeEmployers: counts[1],
                totalJobDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: statusMap['processing'] || 0,
                pending: statusMap['pending'] || 0,
                // Additional status often used in recruitment
                interview: statusMap['interview'] || 0,
                medical: statusMap['medical-examination'] || 0
            },
            data: formattedChartData,
            viewType: view === 'personal' ? 'Personal Stats' : 'Company Stats'
        });
    } catch (error) {
        console.error("REPORT_ERROR:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
};