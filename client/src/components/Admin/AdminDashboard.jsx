"use client";

import axios from "axios";
import {
  Bell,
  Briefcase,
  Building2,
  Edit,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  TrendingUp,
  UserCircle,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { AddEmployeeForm } from "./AddEmployeeForm";

const BAR_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState({
    employersAdded: 0,
    activeJobDemands: 0,
    workersInProcess: 0,
    activeSubAgents: 0,
  });
  const [adminNotes, setAdminNotes] = useState([]);
  const [staffNotes, setStaffNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  const api = axios.create({ baseURL: "http://localhost:5000/api" });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard");
      const { stats, notes } = data.data;
      const currentUserId = localStorage.getItem("userId");

      setStats(stats);
      setAdminNotes(
        notes.filter((n) => (n.createdBy?._id || n.createdBy) === currentUserId)
      );
      setStaffNotes(
        notes.filter((n) => (n.createdBy?._id || n.createdBy) !== currentUserId)
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (view === "add-employee") {
    return (
      <AddEmployeeForm
        onBack={() => setView("dashboard")}
        onSuccess={() => {
          setView("dashboard");
          fetchData();
        }}
      />
    );
  }

  const chartData = [
    { name: "Employers", value: stats.employersAdded },
    { name: "Job Demands", value: stats.activeJobDemands },
    { name: "Workers", value: stats.workersInProcess },
    { name: "Sub-Agents", value: stats.activeSubAgents },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Overview of operations • Team activity • Key metrics
            </p>
          </div>

          <Button onClick={() => setView("add-employee")} className="gap-2 shadow-sm">
            <Plus size={18} />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <StatCard
            label="Total Employers"
            value={stats.employersAdded}
            icon={<Building2 size={22} />}
            color="blue"
          />
          <StatCard
            label="Active Job Demands"
            value={stats.activeJobDemands}
            icon={<Briefcase size={22} />}
            color="amber"
          />
          <StatCard
            label="Workers In Process"
            value={stats.workersInProcess}
            icon={<UserCircle size={22} />}
            color="emerald"
          />
          <StatCard
            label="Sub-Agents"
            value={stats.activeSubAgents}
            icon={<Users size={22} />}
            color="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-8">
            {/* Growth Chart */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp size={18} className="text-primary" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(241,245,249,0.4)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="value" radius={6} barSize={48}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Staff Activity */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell size={18} className="text-emerald-600" />
                    Staff Activity
                  </CardTitle>
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    Live
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {staffNotes.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No recent staff activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffNotes.map((note) => (
                      <div
                        key={note._id}
                        className="flex gap-4 p-4 rounded-lg border border-transparent hover:bg-slate-50/70 hover:border-slate-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center shrink-0">
                          {note.createdBy?.fullName?.[0] ?? "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="font-medium text-slate-900 truncate">
                              {note.createdBy?.fullName ?? "Team Member"}
                            </p>
                            <time className="text-xs text-slate-500 whitespace-nowrap">
                              {new Date(note.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Notes Sidebar */}
          <div className="lg:col-span-4">
            <Card className="border-slate-200/70 shadow-sm h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText size={18} className="text-primary" />
                  Private Admin Notes
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col pt-2">
                {/* Note Input */}
                <div className="mb-6 flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a private note..."
                    className="flex-1 h-11 px-4 text-sm border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition"
                  />
                  <Button size="icon" disabled={!newNote.trim()}>
                    <Send size={18} />
                  </Button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {adminNotes.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">
                      No private notes yet
                    </div>
                  ) : (
                    adminNotes.map((note) => (
                      <div
                        key={note._id}
                        className="group p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <time>{new Date(note.createdAt).toLocaleDateString()}</time>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="hover:text-slate-700">
                              <Edit size={14} />
                            </button>
                            <button className="hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <Card className="border-slate-200/70 shadow-sm transition-all hover:shadow">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]} ring-1 ring-inset ring-black/5`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}