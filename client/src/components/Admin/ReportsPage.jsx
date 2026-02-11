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
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) {
            setReportData(initialData);
            setLoading(false);
        }
    }, [initialData]);

    useEffect(() => {
        const fetchStats = async () => {
            if (timeframe === 'Month' && initialData && !reportData?.isUpdate) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token'); 
                const response = await axios.get(apiUrl(`/api/reports/performance-stats?view=${timeframe.toLowerCase()}`), {
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
    const successRate = summary.totalWorkers > 0 ? Math.round(((summary.deployed || 0) / summary.totalWorkers) * 100) : 0;

    if (loading && !reportData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Syncing Data...</p>
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
                        Performance monitoring for <span className="text-blue-600">Agency-Wide Records</span>
                    </p>
                </div>

                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner">
                    {['Day', 'Week', 'Month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                timeframe === period 
                                ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' 
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
                {/* Clickable Workers Card */}
                <LargeStatCard 
                    label="Total Workers" 
                    value={summary.totalWorkers} 
                    icon={<Users size={24}/>} 
                    color="emerald" 
                    trend="View List" 
                    href="/dashboard/tenant-admin/workers" 
                />
                {/* Clickable Job Demands Card */}
                <LargeStatCard 
                    label="Job Demands" 
                    value={summary.totalJobDemands} 
                    icon={<Building2 size={24}/>} 
                    color="indigo" 
                    trend="View List" 
                    href="/dashboard/tenant-admin/job-demand" 
                />
                
                <LargeStatCard label="Deployed" value={summary.deployed} icon={<Briefcase size={24}/>} color="orange" trend="Total" />
                <LargeStatCard label="Success Rate" value={`${successRate}%`} icon={<Activity size={24}/>} color="blue" trend="Avg" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"/> Activity Comparison
                    </h3>
                    <div className="h-[350px]">
                        <Bar 
                            data={{
                                labels: chartData.map(d => d.date),
                                datasets: [
                                    { label: 'Workers', data: chartData.map(d => d.workers), backgroundColor: '#3b82f6', borderRadius: 6, barThickness: 12 },
                                    { label: 'Demands', data: chartData.map(d => d.demands), backgroundColor: '#cbd5e1', borderRadius: 6, barThickness: 12 }
                                ]
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"/> Deployment Growth
                    </h3>
                    <div className="h-[350px]">
                        <Line 
                            data={{
                                labels: chartData.map(d => d.date),
                                datasets: [{
                                    data: chartData.map(d => d.deployed), 
                                    borderColor: '#10b981',
                                    borderWidth: 3,
                                    fill: true,
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                    tension: 0.4,
                                    pointBackgroundColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4
                                }]
                            }}
                            options={{...chartOptions, plugins: {legend: {display: false}}}}
                        />
                    </div>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Top Employers</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-[0.1em]">
                            <tr>
                                <th className="px-8 py-5">Employer Details</th>
                                <th className="px-8 py-5">Location</th>
                                <th className="px-8 py-5 text-center">Deployment count</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topEmployers.map((emp, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                                    <td className="px-8 py-6 font-bold text-slate-800 text-base">{emp.name || "Unknown"}</td>
                                    <td className="px-8 py-6 text-slate-500 font-medium">{emp.loc}</td>
                                    <td className="px-8 py-6 text-center font-black text-slate-900 text-lg">{emp.deployed}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                                            emp.status?.toLowerCase() === 'active' 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link href={`/admin/employers/${emp._id}`}>
                                            <button className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all">
                                                <ExternalLink size={18} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// Updated Helper Component
function LargeStatCard({ label, value, icon, color, trend, href }) {
    const theme = {
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
        indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
        orange: "bg-orange-50 text-orange-600",
        blue: "bg-blue-50 text-blue-600"
    };

    const CardContent = (
        <Card className={`p-8 border-none shadow-lg shadow-slate-200/40 rounded-3xl bg-white group transition-all duration-300 ${href ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl ${theme[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300`}>
                {icon}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline justify-between">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h2>
                <span className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${href ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {trend}
                </span>
            </div>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block no-underline">{CardContent}</Link>;
    }

    return CardContent;
}

const chartOptions = {
    maintainAspectRatio: false,
    plugins: { 
        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 12, weight: '600' }, padding: 20 } }
    },
    scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 12, weight: '500' }, color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { font: { size: 12, weight: '500' }, color: '#94a3b8' } }
    }
};