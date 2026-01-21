"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, Users, Briefcase, Calendar, Info } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

export function ReportsPage({ data, summary, onNavigate = () => {} }) {
  const [filter, setFilter] = useState('month');
  const isMock = !data;

  const reportData = useMemo(() => {
    if (data) return data;
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return {
        date: d.toISOString().split('T')[0],
        workersAdded: Math.floor(Math.random() * 10),
        jobDemandsCreated: Math.floor(Math.random() * 5),
      };
    });
  }, [data]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (filter === 'day') cutoff.setHours(0, 0, 0, 0);
    else if (filter === 'week') cutoff.setDate(now.getDate() - 7);
    else cutoff.setMonth(now.getMonth() - 1);

    return [...reportData]
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [reportData, filter]);

  const stats = useMemo(() => {
    const workers = filteredData.reduce((sum, d) => sum + d.workersAdded, 0);
    const demands = filteredData.reduce((sum, d) => sum + d.jobDemandsCreated, 0);
    return {
      totalWorkers: summary?.totalWorkers || workers,
      totalJobDemands: summary?.totalJobDemands || demands,
      avgWorkers: (workers / (filteredData.length || 1)).toFixed(1),
      avgDemands: (demands / (filteredData.length || 1)).toFixed(1),
    };
  }, [filteredData, summary]);

  const chartData = {
    labels: filteredData.map((d) => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })),
    datasets: [
      {
        type: 'bar',
        label: 'Workers Added',
        data: filteredData.map((d) => d.workersAdded),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Job Demands',
        data: filteredData.map((d) => d.jobDemandsCreated),
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isMock && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-center gap-3 rounded-r-lg">
          <span className="text-amber-600"><Info size={20} /></span>
          <p className="text-amber-700 text-sm font-medium">Showing Demo Data. Connect API for live stats.</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <TrendingUp className="text-indigo-600" /> Agency Analytics
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['day', 'week', 'month'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Updated to lowercase 'worker' to match Sidebar logic */}
        <StatCard 
          title="Total Workers" 
          value={stats.totalWorkers} 
          icon={<Users />} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          onClick={() => onNavigate('worker')} 
        />
        
        {/* Updated to 'job-demand' to match Sidebar logic */}
        <StatCard 
          title="Active Demands" 
          value={stats.totalJobDemands} 
          icon={<Briefcase />} 
          color="text-indigo-600" 
          bg="bg-indigo-50" 
          onClick={() => onNavigate('job-demand')} 
        />

        <StatCard title="Avg Workers/Day" value={stats.avgWorkers} icon={<TrendingUp />} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Avg Demands/Day" value={stats.avgDemands} icon={<Calendar />} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] pt-6">
          <Chart 
            type="bar" 
            data={chartData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false, 
              plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, font: { weight: 'bold' } } }
              },
              scales: { 
                y: { beginAtZero: true, grid: { display: false } }, 
                y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } } 
              } 
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg, onClick }) {
  const handleClick = (e) => {
    console.log(`StatCard "${title}" clicked`);
    if (onClick) onClick(e);
  };

  return (
    <Card 
      onClick={handleClick}
      className={`border-none shadow-sm transition-all duration-300 rounded-3xl ${bg} ${
        onClick 
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.03] active:scale-95 ring-1 ring-transparent hover:ring-indigo-200' 
          : 'ring-1 ring-slate-100/50'
      }`}
    >
      <CardContent className="p-6 flex justify-between items-center pointer-events-none">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
        </div>
        <div className={`p-3 rounded-2xl bg-white/50 ${color} shadow-sm`}>{icon}</div>
      </CardContent>
    </Card>
  );
}