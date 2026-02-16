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
    ExternalLink, Globe
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
    
    const successRate = useMemo(() => {
        return summary.totalWorkers > 0 
            ? Math.round(((summary.deployed || 0) / summary.totalWorkers) * 100) 
            : 0;
    }, [summary]);

    const formattedLabels = useMemo(() => {
        return chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
    }, [chartData]);

    const barThickness = useMemo(() => {
        if (timeframe === 'Day') return 45;
        if (timeframe === 'Week') return 20;
        return 8; 
    }, [timeframe]);

    // FIX: Moved inside component so it can access 'timeframe'
    const chartOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
        plugins: { 
            legend: { 
                position: 'bottom', 
                labels: { usePointStyle: true, font: { size: 11, weight: '700' }, padding: 30, color: '#64748b' } 
            },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 16,
                cornerRadius: 12,
                displayColors: true,
                intersect: false,
                mode: 'index',
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { color: '#f1f5f9' }, 
                ticks: { font: { size: 11, weight: '600' }, color: '#94a3b8', stepSize: 1 } 
            },
            x: { 
                grid: { display: false }, 
                ticks: { 
                    font: { size: 10, weight: '600' }, 
                    color: '#94a3b8',
                    autoSkip: true,
                    maxTicksLimit: timeframe === 'Month' ? 8 : 12 // 'timeframe' is now defined!
                } 
            }
        }
    }), [timeframe]);

    if (loading && !reportData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Analyzing growth patterns...</p>
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
                        Network growth and <span className="text-blue-600 font-bold">{reportData?.viewType || 'Agency Performance'}</span>
                    </p>
                </div>

                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner border border-slate-200">
                    {['Day', 'Week', 'Month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                timeframe === period ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <LargeStatCard label="Total Workers" value={summary.totalWorkers} icon={<Users size={24}/>} color="emerald" trend="Records" href="/dashboard/tenant-admin/workers" />
                <LargeStatCard label="Job Demands" value={summary.totalJobDemands} icon={<Building2 size={24}/>} color="indigo" trend="Active" href="/dashboard/tenant-admin/job-demand" />
                <LargeStatCard label="Total Employers" value={summary.totalEmployers || 0} icon={<Globe size={24}/>} color="blue" trend="Partners" href="/dashboard/tenant-admin/employers" />
                <LargeStatCard label="Success Rate" value={`${successRate}%`} icon={<Activity size={24}/>} color="orange" trend="Avg" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                <Card className="p-8 border-none shadow-xl rounded-3xl bg-white">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"/> Acquisition Overview
                    </h3>
                    <div className="h-[350px]">
                        <Bar 
                            key={`bar-${timeframe}`}
                            data={{
                                labels: formattedLabels,
                                datasets: [
                                    { label: 'Workers', data: chartData.map(d => d.workers), backgroundColor: '#10b981', borderRadius: 4, barThickness: barThickness },
                                    { label: 'Demands', data: chartData.map(d => d.demands), backgroundColor: '#6366f1', borderRadius: 4, barThickness: barThickness },
                                    { label: 'Employers', data: chartData.map(d => d.employers || 0), backgroundColor: '#3b82f6', borderRadius: 4, barThickness: barThickness }
                                ]
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl rounded-3xl bg-white overflow-hidden">
                    <div className="flex justify-between items-start mb-8">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full"/> Deployment Velocity
                        </h3>
                        <div className="text-right">
                            <span className="text-2xl font-black text-orange-500">{summary.deployed}</span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Deployed</p>
                        </div>
                    </div>
                    <div className="h-[320px] -mx-2">
                        <Line 
                            key={`line-${timeframe}`}
                            data={{
                                labels: formattedLabels,
                                datasets: [{
                                    label: 'Deployments',
                                    data: chartData.map(d => d.deployed),
                                    fill: true,
                                    borderColor: '#f59e0b',
                                    borderWidth: 4,
                                    tension: 0.4, 
                                    backgroundColor: (context) => {
                                        const ctx = context.chart.ctx;
                                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
                                        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
                                        return gradient;
                                    },
                                }]
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-xl font-bold text-slate-800">Top Employers</h3>
                    <Link href="/dashboard/tenant-admin/employers" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
                        Manage All Employers
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Employer</th>
                                <th className="px-8 py-5">Location</th>
                                <th className="px-8 py-5 text-center">Deployments</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topEmployers.length > 0 ? topEmployers.map((emp) => (
                                <tr key={emp._id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-8 py-6 font-bold text-slate-800">{emp.name}</td>
                                    <td className="px-8 py-6 text-slate-500 font-medium">{emp.loc}</td>
                                    <td className="px-8 py-6 text-center font-black text-slate-900 text-lg">
                                        <span className="bg-slate-100 px-3 py-1 rounded-lg">{emp.deployed}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            emp.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link href={`/dashboard/tenant-admin/employers/${emp._id}`}>
                                            <button className="p-2.5 bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                                                <ExternalLink size={16} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-medium">No active employers in this timeframe.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function LargeStatCard({ label, value, icon, color, trend, href }) {
    const theme = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100"
    };

    const content = (
        <Card className={`p-8 border border-transparent shadow-lg rounded-3xl bg-white group transition-all duration-300 ${href ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl border ${theme[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline justify-between">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h2>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-50 text-slate-400">{trend}</span>
            </div>
        </Card>
    );

    return href ? <Link href={href} className="no-underline">{content}</Link> : content;
}