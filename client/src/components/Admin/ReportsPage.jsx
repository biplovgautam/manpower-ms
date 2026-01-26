"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
    ArcElement, BarElement, CategoryScale, Chart as ChartJS,
    Filler, Legend, LinearScale, LineElement, PointElement,
    Title, Tooltip,
} from 'chart.js';
import { 
    Users, Building2, Activity, 
    ArrowUpRight, ArrowDownRight, Briefcase
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, Title, Tooltip, Legend, Filler, ArcElement
);

export default function AdminReportsView({ initialData }) {
    const [timeframe, setTimeframe] = useState('Month');
    const [reportData, setReportData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) {
            setReportData(initialData);
            setLoading(false);
        }
    }, [initialData]);

    useEffect(() => {
        const fetchStats = async () => {
            if (timeframe === 'Month' && initialData && !reportData?.isUpdate) {
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('token'); 
                const response = await axios.get(`http://localhost:5000/api/reports/performance-stats?view=${timeframe.toLowerCase()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.success) {
                    setReportData({ ...response.data, isUpdate: true });
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

    if (loading && !reportData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                    <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Updating Analytics...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 bg-[#f9fafb] min-h-screen font-sans text-slate-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manpower Analytics</h1>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        Monitoring {reportData?.viewType || 'Agency Records'}
                    </p>
                </div>

                <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    {['Day', 'Week', 'Month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                                timeframe === period 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MiniStatCard 
                    label="Total Workers" 
                    value={summary.totalWorkers || 0} 
                    trend="Live" 
                    isUp={true} 
                    icon={<Users size={20} className="text-emerald-500" />} 
                    bgColor="bg-emerald-50"
                />
                <MiniStatCard 
                    label="Job Openings" 
                    value={summary.totalJobDemands || 0} 
                    trend="Active" 
                    isUp={true} 
                    icon={<Building2 size={20} className="text-purple-500" />} 
                    bgColor="bg-purple-50"
                />
                <MiniStatCard 
                    label="People at Work" 
                    value={summary.deployed || 0} 
                    trend="Success" 
                    isUp={true} 
                    icon={<Briefcase size={20} className="text-orange-500" />} 
                    bgColor="bg-orange-50"
                />
                <MiniStatCard 
                    label="Success Rate" 
                    value={`${successRate}%`} 
                    trend="Ratio" 
                    isUp={successRate > 50} 
                    icon={<Activity size={20} className="text-blue-500" />} 
                    bgColor="bg-blue-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <Card className="lg:col-span-3 border-none shadow-sm rounded-2xl bg-white p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-slate-800 text-sm">Workers vs Jobs</h3>
                        <div className="flex gap-4 text-[9px] font-bold uppercase text-slate-400 tracking-tighter">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> New Workers</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Job Demands</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <Bar 
                            data={{
                                labels: chartData.map(d => d.date),
                                datasets: [
                                    { label: 'Workers', data: chartData.map(d => d.workers), backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 8 },
                                    { label: 'Demands', data: chartData.map(d => d.demands), backgroundColor: '#10b981', borderRadius: 4, barThickness: 8 }
                                ]
                            }}
                            options={{ 
                                maintainAspectRatio: false, 
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white p-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-6">Success Trend</h3>
                    <div className="h-[300px]">
                        <Line 
                            data={{
                                labels: chartData.map(d => d.date),
                                datasets: [{
                                    label: 'Deployed',
                                    data: chartData.map(d => d.deployed), 
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 2
                                }]
                            }}
                            options={{ 
                                maintainAspectRatio: false, 
                                plugins: { 
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => `Deployed: ${context.raw}`
                                        }
                                    }
                                },
                                scales: {
                                    y: { beginAtZero: true, display: false },
                                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* Top 5 Employers Table */}
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Top Performing Employers</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-5">Employer Name</th>
                                <th className="px-6 py-5">Location</th>
                                <th className="px-6 py-5 text-center">Total Deployed</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topEmployers.length > 0 ? topEmployers.map((emp, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    {/* FIX: Using emp.name which now maps to employerName in backend */}
                                    <td className="px-6 py-4 font-bold text-slate-700">{emp.name || "Unknown"}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{emp.loc}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800 text-center">{emp.deployed}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize ${
                                            emp.status?.toLowerCase() === 'active' 
                                            ? 'text-emerald-600 bg-emerald-50' 
                                            : 'text-slate-400 bg-slate-50'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/admin/employers/${emp._id}`}>
                                            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-xs italic">
                                        No employer data found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function MiniStatCard({ label, value, trend, isUp, icon, bgColor }) {
    return (
        <Card className="border-none shadow-sm rounded-2xl bg-white p-5 transition-all hover:shadow-md group">
            <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-full ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                    {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {trend}
                </div>
            </div>
        </Card>
    );
}