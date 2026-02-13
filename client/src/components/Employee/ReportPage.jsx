"use client";

import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, Users, Briefcase, Calendar, Loader2, Plane } from 'lucide-react';
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
import { apiUrl } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

export function ReportsPage({ onNavigate = () => {} }) {
  const [filter, setFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const timestamp = new Date().getTime();
        const res = await axios.get(apiUrl(`/api/reports/performance-stats?view=${filter}&_t=${timestamp}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setBackendData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [filter]);

  const chartData = useMemo(() => {
    if (!backendData?.chartData) return null;

    // Calculate thickness to maintain gaps between clusters of 3 bars
    const thickness = filter === 'day' ? 40 : filter === 'week' ? 15 : 6;

    return {
      labels: backendData.chartData.map((d) => 
        new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          type: 'bar',
          label: 'New Workers',
          data: backendData.chartData.map((d) => d.workers || 0),
          backgroundColor: '#22c55e', // Emerald
          borderRadius: 2,
          barThickness: thickness,
        },
        {
          type: 'bar',
          label: 'Deployed',
          data: backendData.chartData.map((d) => d.deployed || 0),
          backgroundColor: '#f59e0b', // Amber
          borderRadius: 2,
          barThickness: thickness,
        },
        {
          type: 'bar',
          label: 'Job Demands',
          data: backendData.chartData.map((d) => d.demands || 0),
          backgroundColor: '#6366f1', // Indigo
          borderRadius: 2,
          barThickness: thickness,
        },
      ],
    };
  }, [backendData, filter]);

  if (loading && !backendData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="font-medium animate-pulse">Syncing Agency Analytics...</p>
      </div>
    );
  }

  const summary = backendData?.summary || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <TrendingUp className="text-indigo-600" /> 
          {backendData?.viewType === 'Personal Performance' ? 'My Performance' : 'Agency Analytics'}
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
        <StatCard title="Total Workers" value={summary.totalWorkers || 0} icon={<Users size={20}/>} color="text-emerald-600" bg="bg-emerald-50" onClick={() => onNavigate('worker')} />
        <StatCard title="Active Demands" value={summary.totalJobDemands || 0} icon={<Briefcase size={20}/>} color="text-indigo-600" bg="bg-indigo-50" onClick={() => onNavigate('job-demand')} />
        <StatCard title="Deployed" value={summary.deployed || 0} icon={<Plane size={20}/>} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Processing" value={summary.processing || 0} icon={<Calendar size={20}/>} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-400">
            Resource Distribution Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[420px] pt-6">
          {chartData && (
            <Chart 
              key={`grouped-bar-${filter}`}
              type="bar" 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: {
                  legend: { 
                    position: 'bottom', 
                    labels: { usePointStyle: true, padding: 25, font: { weight: '600', size: 12 } } 
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1e293b',
                    padding: 12,
                    cornerRadius: 8,
                  }
                },
                scales: { 
                  y: { 
                    beginAtZero: true, 
                    grid: { color: '#f8fafc' }, 
                    ticks: { 
                        stepSize: 1, 
                        precision: 0,
                        color: '#94a3b8' 
                    } 
                  }, 
                  x: { 
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                  } 
                },
                // These two settings control the "gap" between day clusters
                categoryPercentage: 0.7, // Percentage of the available width for each day
                barPercentage: 0.9,      // Percentage of the category width for the bars
              }} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg, onClick }) {
  return (
    <Card 
      onClick={onClick}
      className={`border-none shadow-sm transition-all duration-300 rounded-3xl ${bg} ${
        onClick 
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95' 
          : ''
      }`}
    >
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
        </div>
        <div className={`p-3 rounded-2xl bg-white/80 shadow-sm ${color}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}