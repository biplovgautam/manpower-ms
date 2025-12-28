const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');

exports.getPerformanceStats = async (req, res) => {
    try {
        // 1. Get Worker counts grouped by date (Last 30 days)
        const workerStats = await Worker.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Get Job Demand counts grouped by date
        const jobStats = await JobDemand.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Combine data into a single array for the frontend chart
        // Format: { date: "2023-12-01", workersAdded: 5, jobDemandsCreated: 2 }
        
        // Create a map of all dates found in both collections
        const allDates = new Set([
            ...workerStats.map(item => item._id),
            ...jobStats.map(item => item._id)
        ]);

        const formattedData = Array.from(allDates).map(date => {
            return {
                date: date,
                workersAdded: workerStats.find(w => w._id === date)?.count || 0,
                jobDemandsCreated: jobStats.find(j => j._id === date)?.count || 0
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};