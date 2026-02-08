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
import 'chartjs-adapter-date-fns';

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
        const res = await axios.get(`http://localhost:5000/api/reports/performance-stats?view=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          // DEBUG: Check your console to see the exact structure of chartData[0]
          console.log("Backend Chart Data Sample:", res.data.chartData?.[0]);
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

    return {
      labels: backendData.chartData.map((d) => 
        new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          type: 'bar',
          label: 'Workers Added',
          data: backendData.chartData.map((d) => d.workers || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          type: 'bar',
          label: 'Deployed',
          // Tries multiple common keys in case backend naming differs from summary naming
          data: backendData.chartData.map((d) => d.deployed ?? d.deployedCount ?? d.count ?? 0),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Job Demands',
          data: backendData.chartData.map((d) => d.demands || 0),
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          yAxisID: 'y1',
        },
      ],
    };
  }, [backendData]);

  if (loading && !backendData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="font-medium">Loading Agency Analytics...</p>
      </div>
    );
  }

  const summary = backendData?.summary || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        <StatCard 
          title="Total Workers" 
          value={summary.totalWorkers || 0} 
          icon={<Users />} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          onClick={() => onNavigate('worker')} 
        />
        <StatCard 
          title="Active Demands" 
          value={summary.totalJobDemands || 0} 
          icon={<Briefcase />} 
          color="text-indigo-600" 
          bg="bg-indigo-50" 
          onClick={() => onNavigate('job-demand')} 
        />
        <StatCard 
          title="Deployed" 
          value={summary.deployed || 0} 
          icon={<Plane />} 
          color="text-amber-600" 
          bg="bg-amber-50" 
        />
        <StatCard 
          title="Processing" 
          value={summary.processing || 0} 
          icon={<Calendar />} 
          color="text-purple-600" 
          bg="bg-purple-50" 
        />
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
        <CardHeader className="border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
            Performance Trends ({backendData?.viewType})
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] pt-6">
          {chartData && (
            <Chart 
              type="bar" 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: {
                  legend: { 
                    position: 'top', 
                    labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 11 } } 
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    usePointStyle: true,
                  }
                },
                scales: { 
                  y: { 
                    beginAtZero: true, 
                    grid: { color: '#f8fafc' }, 
                    title: { display: true, text: 'Worker Count', font: { size: 10, weight: 'bold' } } 
                  }, 
                  y1: { 
                    position: 'right', 
                    beginAtZero: true, 
                    grid: { drawOnChartArea: false }, 
                    title: { display: true, text: 'Job Demands', font: { size: 10, weight: 'bold' } } 
                  } 
                } 
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