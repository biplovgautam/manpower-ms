"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
    ArcElement, BarElement, CategoryScale, Chart as ChartJS,
    Filler, Legend, LinearScale, LineElement, PointElement,
    Title, Tooltip,
} from 'chart.js';
import { 
    Users, Building2, Activity, 
    Briefcase, ExternalLink
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';
import { apiUrl } from '@/lib/api';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, Title, Tooltip, Legend, Filler, ArcElement
);

export default function AdminReportsView({ initialData }) {
    const [timeframe, setTimeframe] = useState('Month');
    const [reportData, setReportData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token'); 
                const timestamp = new Date().getTime();
                const response = await axios.get(
                    apiUrl(`/api/reports/performance-stats?view=${timeframe.toLowerCase()}&_t=${timestamp}`), 
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    setReportData(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [timeframe]);

    const summary = reportData?.summary || {};
    const chartData = reportData?.chartData || [];
    const topEmployers = reportData?.topEmployers || [];
    const successRate = summary.totalWorkers > 0 
        ? Math.round(((summary.deployed || 0) / summary.totalWorkers) * 100) 
        : 0;

    const formattedLabels = useMemo(() => {
        return chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
    }, [chartData]);

    if (loading && !reportData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Updating discrete analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 lg:p-12 bg-[#fcfcfd] min-h-screen font-sans text-slate-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics Dashboard</h1>
                    <p className="text-base text-slate-500 mt-2 font-medium">
                        Real-time counts for <span className="text-blue-600">{reportData?.viewType || 'Agency Records'}</span>
                    </p>
                </div>

                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner">
                    {['Day', 'Week', 'Month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                timeframe === period 
                                ? 'bg-white text-slate-900 shadow-md' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <LargeStatCard 
                    label="Total Workers" 
                    value={summary.totalWorkers} 
                    icon={<Users size={24}/>} 
                    color="emerald" 
                    trend="Records" 
                    href="/dashboard/tenant-admin/workers" 
                />
                <LargeStatCard 
                    label="Job Demands" 
                    value={summary.totalJobDemands} 
                    icon={<Building2 size={24}/>} 
                    color="indigo" 
                    trend="Active" 
                    href="/dashboard/tenant-admin/job-demand" 
                />
                <LargeStatCard label="Deployed" value={summary.deployed} icon={<Briefcase size={24}/>} color="orange" trend="Total" />
                <LargeStatCard label="Success Rate" value={`${successRate}%`} icon={<Activity size={24}/>} color="blue" trend="Avg" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                <Card className="p-8 border-none shadow-xl rounded-3xl bg-white">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"/> Activity counts
                    </h3>
                    <div className="h-[350px]">
                        <Bar 
                            key={`bar-discrete-${timeframe}`}
                            data={{
                                labels: formattedLabels,
                                datasets: [
                                    { 
                                        label: 'Workers', 
                                        data: chartData.map(d => d.workers), 
                                        backgroundColor: '#3b82f6', 
                                        borderRadius: 4, 
                                        barThickness: timeframe === 'Day' ? 60 : 15 
                                    },
                                    { 
                                        label: 'Demands', 
                                        data: chartData.map(d => d.demands), 
                                        backgroundColor: '#cbd5e1', 
                                        borderRadius: 4, 
                                        barThickness: timeframe === 'Day' ? 60 : 15 
                                    }
                                ]
                            }}
                            options={discreteChartOptions}
                        />
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl rounded-3xl bg-white">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"/> Deployment Timeline
                    </h3>
                    <div className="h-[350px]">
                        <Line 
                            key={`line-discrete-${timeframe}`}
                            data={{
                                labels: formattedLabels,
                                datasets: [{
                                    label: 'Deployed',
                                    data: chartData.map(d => d.deployed), 
                                    borderColor: '#10b981',
                                    borderWidth: 2.5,
                                    fill: true,
                                    backgroundColor: 'rgba(16, 185, 129, 0.03)',
                                    tension: 0, // 0 = Straight discrete lines (no curves)
                                    pointBackgroundColor: '#fff',
                                    pointBorderColor: '#10b981',
                                    pointBorderWidth: 2,
                                    pointRadius: 5,
                                    pointHoverRadius: 7
                                }]
                            }}
                            options={discreteChartOptions}
                        />
                    </div>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">Top Employers</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Employer</th>
                                <th className="px-8 py-5">Location</th>
                                <th className="px-8 py-5 text-center">Deployments</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topEmployers.length > 0 ? topEmployers.map((emp) => (
                                <tr key={emp._id} className="hover:bg-slate-50/80 transition-all">
                                    <td className="px-8 py-6 font-bold text-slate-800">{emp.name}</td>
                                    <td className="px-8 py-6 text-slate-500 font-medium">{emp.loc}</td>
                                    <td className="px-8 py-6 text-center font-black text-slate-900 text-lg">{emp.deployed}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            emp.status?.toLowerCase() === 'active' 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link href={`/dashboard/tenant-admin/employers/${emp._id}`}>
                                            <button className="p-2 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                                                <ExternalLink size={16} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-slate-400">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// Stats Card Helper
function LargeStatCard({ label, value, icon, color, trend, href }) {
    const theme = {
        emerald: "bg-emerald-50 text-emerald-600",
        indigo: "bg-indigo-50 text-indigo-600",
        orange: "bg-orange-50 text-orange-600",
        blue: "bg-blue-50 text-blue-600"
    };

    const content = (
        <Card className={`p-8 border-none shadow-lg rounded-3xl bg-white group transition-all duration-300 ${href ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl ${theme[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline justify-between">
                <h2 className="text-4xl font-black text-slate-900">{value}</h2>
                <span className="text-[11px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-400">
                    {trend}
                </span>
            </div>
        </Card>
    );

    return href ? <Link href={href} className="no-underline">{content}</Link> : content;
}

// Config for Discrete Values
const discreteChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 11, weight: '600' }, padding: 20 } },
        tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            intersect: false, // Easier to trigger tooltip
            mode: 'index'
        }
    },
    scales: {
        y: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' }, 
            ticks: { 
                font: { size: 11 }, 
                color: '#94a3b8',
                stepSize: 1, // FORCE DISCRETE: Only whole numbers
                precision: 0 // No decimal points allowed
            } 
        },
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } }
    }
};