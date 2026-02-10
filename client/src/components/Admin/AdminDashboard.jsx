"use client";

import adbs from 'ad-bs-converter';
import axios from 'axios';
import {
  Bell,
  BriefcaseBusiness,
  Building,
  Building2,
  CheckCircle,
  Edit, FileText, Paperclip,
  Plus, RefreshCw, Search, ShieldCheck,
  Trash2, TrendingUp,
  User,
  UserCircle, UserPlus, Users,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  Area, AreaChart, BarChart, CartesianGrid,
  Bar as ReBar,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { AddEmployeeForm } from './AddEmployeeForm';
import { apiUrl, FILE_BASE_URL } from '@/lib/api';

const API_BASE = apiUrl('/api/dashboard');
const WORKER_API = apiUrl('/api/workers'); // adjust if your route is different
const FILE_BASE = FILE_BASE_URL;
const NEPALI_MONTHS = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

const getNepalTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));

const convertADtoBS = (adDateString) => {
  if (!adDateString) return { month: "N/A", day: "" };
  try {
    const date = new Date(adDateString);
    const converted = adbs.ad2bs(`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
    return {
      month: NEPALI_MONTHS[converted.en.month - 1].substring(0, 3),
      day: converted.en.day
    };
  } catch {
    return { month: "N/A", day: "" };
  }
};

function AdminStatCard({ title, value, icon, gradient, onClick }) {
  return (
    <Card onClick={onClick} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group">
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { size: 28 })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard({ onNavigate = () => { } }) {

  const [view, setView] = useState('dashboard');
  const [isBS, setIsBS] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [currentTime, setCurrentTime] = useState(getNepalTime());

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId')?.trim() : null;

  const [newNote, setNewNote] = useState({
    content: '',
    category: 'general',
    targetDate: '',
    linkedEntityId: '',
    attachment: null
  });

  const [stats, setStats] = useState({
    employersAdded: 0,
    activeJobDemands: 0,
    workersInProcess: 0,
    activeSubAgents: 0,
    totalEmployees: 0
  });

  const [workerStats, setWorkerStats] = useState({
    pending: 0,
    processing: 0,
    deployed: 0,
    rejected: 0 // optional – you can show it or not
  });

  const [allData, setAllData] = useState([]);
  const [dropdowns, setDropdowns] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(currentUserId || 'all');
  const [editId, setEditId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Global Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/search`, {
        params: { q: q.trim() },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSearchResults(res.data.results || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Search failed', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(debounce(performSearch, 400), [performSearch]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (item) => {
    setSearchQuery('');
    setShowSearchResults(false);

    const id = item._id;

    if (!id) {
      toast.error("Cannot open item: missing ID");
      return;
    }

    switch (item.type) {
      case 'employee':
      case 'staff':
        onNavigate(`/employees?id=${id}`);
        break;
      case 'employer':
        onNavigate(`/employers?id=${id}`);
        break;
      case 'worker':
        onNavigate(`/workers?id=${id}`);
        break;
      case 'job-demand':
        onNavigate(`/job-demand?id=${id}`);
        break;
      case 'sub-agent':
        onNavigate(`/sub-agents?id=${id}`);
        break;
      case 'note':
      case 'reminder':
        toast.success(`Selected ${item.type}: ${item.content?.substring(0, 40) || 'Note'}...`);
        break;
      default:
        toast.error(`Unknown entity type: ${item.type}`);
        break;
    }
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const s = res.data.data.stats || {};
        setStats(s);
        setAllData(res.data.data.notes || []);
        setDropdowns(res.data.data.dropdowns || {});
        setChartData([
          { name: 'Workers', count: s.workersInProcess || 0 },
          { name: 'Staff', count: s.totalEmployees || 0 },
          { name: 'Employers', count: s.employersAdded || 0 },
          { name: 'Demands', count: s.activeJobDemands || 0 },
          { name: 'Agents', count: s.activeSubAgents || 0 },
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${WORKER_API}/stats/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWorkerStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch worker status stats', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchWorkerStats();
    const timer = setInterval(() => setCurrentTime(getNepalTime()), 1000);
    return () => clearInterval(timer);
  }, [fetchAdminData]);

  const handleFileChange = (e) => {
    setNewNote(prev => ({ ...prev, attachment: e.target.files?.[0] || null }));
  };

  const resetForm = () => {
    setNewNote({
      content: '',
      category: 'general',
      targetDate: '',
      linkedEntityId: '',
      attachment: null,
    });
    setEditId(null);
    setShowAddModal(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.content?.trim()) return toast.error("Note content is required");

    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('content', newNote.content);
      fd.append('category', newNote.category);
      if (newNote.targetDate) fd.append('targetDate', newNote.targetDate);
      if (newNote.linkedEntityId) fd.append('linkedEntityId', newNote.linkedEntityId);
      if (newNote.attachment) fd.append('attachment', newNote.attachment);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editId) {
        await axios.patch(`${API_BASE}/notes/${editId}`, fd, config);
        toast.success("Note updated");
      } else {
        await axios.post(`${API_BASE}/notes`, fd, config);
        toast.success("Note created");
      }

      resetForm();
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to save note");
    }
  };

  const handleEdit = (note) => {
    const creatorId = note.createdBy?._id || note.createdBy;
    if (String(creatorId).trim() !== String(currentUserId).trim()) {
      return toast.error("You can only edit your own notes");
    }

    setEditId(note._id);
    const linkedId = note.linkedEntityId?._id || note.linkedEntityId || '';

    setNewNote({
      content: note.content || '',
      category: note.category || 'general',
      targetDate: note.targetDate ? new Date(note.targetDate).toISOString().split('T')[0] : '',
      linkedEntityId: linkedId,
      attachment: null,
    });

    setShowAddModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note permanently?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Note deleted');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Delete failed');
    }
  };

  const markDone = async (id) => {
    if (!window.confirm('Mark this reminder as done?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/notes/${id}/done`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reminder marked as done');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update status');
    }
  };

  const getDaysRemaining = (date) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - getNepalTime().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const employees = dropdowns.employees || [];
  const workers = dropdowns.workers || [];

  const reminders = allData
    .filter(n => n.category === 'reminder')
    .sort((a, b) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime());

  const activeReminders = reminders.filter(
    n => !n.isCompleted && ((getDaysRemaining(n.targetDate) ?? 999) >= 0)
  );

  const archivedReminders = reminders.filter(
    n => n.isCompleted || ((getDaysRemaining(n.targetDate) ?? -999) < 0)
  );

  const notes = allData.filter(n => n.category !== 'reminder');

  const filteredNotes = notes.filter(n => {
    if (selectedEmployeeFilter === 'all') return true;
    const creatorId = n.createdBy?._id || n.createdBy;
    const linkedId = n.linkedEntityId?._id || n.linkedEntityId;
    return String(creatorId) === String(selectedEmployeeFilter) ||
      String(linkedId) === String(selectedEmployeeFilter);
  });

  const workerChartData = [
    { name: 'Pending', count: workerStats.pending },
    { name: 'Processing', count: workerStats.processing },
    { name: 'Deployed', count: workerStats.deployed },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (view === 'register-employee') {
    return (
      <AddEmployeeForm
        onBack={() => setView('dashboard')}
        onSuccess={() => {
          setView('dashboard');
          fetchAdminData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10 space-y-10 text-slate-800 relative">
      <Toaster position="top-right" />

      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
              <TrendingUp size={16} /> Live • {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-slate-200 p-1.5 rounded-xl font-bold">
            <button
              onClick={() => setIsBS(false)}
              className={`px-5 py-2 rounded-lg transition-all ${!isBS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              AD
            </button>
            <button
              onClick={() => setIsBS(true)}
              className={`px-5 py-2 rounded-lg transition-all ${isBS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              BS
            </button>
          </div>

          <Button
            onClick={() => setView('register-employee')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-12 font-bold shadow-lg flex items-center gap-2"
          >
            <UserPlus size={18} /> Register Staff
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 font-bold shadow-lg flex items-center gap-2"
          >
            <Plus size={18} /> Add Note
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative w-full">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search employees, employers, workers, demands, agents, notes..."
            className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white shadow-md text-base placeholder:text-slate-400"
          />
          {searchLoading && (
            <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={22} />
          )}
          {searchQuery && !searchLoading && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[60vh] overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No results found for <span className="font-medium">"{searchQuery}"</span>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 border-b">
                  Results ({searchResults.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {searchResults.map((item) => {
                    let subtitle = '';
                    switch (item.type) {
                      case 'worker':
                        subtitle = [item.passportNumber, item.phone || item.contact].filter(Boolean).join(' • ') || item.status || 'Worker';
                        break;
                      case 'employee':
                      case 'staff':
                        subtitle = [item.phone || item.contactNumber, item.email].filter(Boolean).join(' • ') || 'Staff';
                        break;
                      case 'sub-agent':
                        subtitle = [item.phone || item.contact, item.email].filter(Boolean).join(' • ') || 'Sub-agent';
                        break;
                      case 'employer':
                        subtitle = item.country || 'Employer';
                        break;
                      case 'job-demand':
                        subtitle = [item.employerName || item.companyName, item.country].filter(Boolean).join(' • ') || 'Demand';
                        break;
                      case 'note':
                      case 'reminder':
                        subtitle = `${item.category} • ${new Date(item.createdAt || item.targetDate).toLocaleDateString()} • ${item.createdBy?.fullName || '—'}`;
                        break;
                      default:
                        subtitle = item.subtitle || item.country || item.category || item.status || '—';
                    }

                    let iconComponent;
                    switch (item.type) {
                      case 'employee':
                      case 'staff':
                        iconComponent = <User size={20} />;
                        break;
                      case 'employer':
                        iconComponent = <Building size={20} />;
                        break;
                      case 'worker':
                        iconComponent = <Users size={20} />;
                        break;
                      case 'job-demand':
                        iconComponent = <BriefcaseBusiness size={20} />;
                        break;
                      case 'sub-agent':
                        iconComponent = <UserCircle size={20} />;
                        break;
                      case 'note':
                      case 'reminder':
                        iconComponent = <FileText size={20} />;
                        break;
                      default:
                        iconComponent = <Search size={20} />;
                    }

                    return (
                      <button
                        key={item._id}
                        onClick={() => handleResultClick(item)}
                        className="w-full px-6 py-4 text-left hover:bg-indigo-50 transition-colors flex items-center gap-5"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${item.type === 'employee' ? 'bg-indigo-600' :
                            item.type === 'employer' ? 'bg-emerald-600' :
                              item.type === 'worker' ? 'bg-teal-600' :
                                item.type === 'job-demand' ? 'bg-orange-600' :
                                  item.type === 'sub-agent' ? 'bg-purple-600' :
                                    'bg-amber-600'
                          }`}>
                          {iconComponent}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-base">
                            {item.title || item.fullName || item.name || item.employerName || item.jobTitle || item.content?.substring(0, 60) || '—'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1 truncate">
                            {item.type.toUpperCase()} • {subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatCard
          title="Workers"
          value={stats.workersInProcess}
          icon={<Users />}
          gradient="from-blue-600 to-indigo-600"
          onClick={() => onNavigate("/workers")}
        />

        <AdminStatCard
          title="Staff"
          value={stats.totalEmployees}
          icon={<UserCircle />}
          gradient="from-indigo-600 to-purple-600"
          onClick={() => onNavigate('/employees')}
        />

        <AdminStatCard
          title="Employers"
          value={stats.employersAdded}
          icon={<Building2 />}
          gradient="from-emerald-600 to-teal-600"
          onClick={() => onNavigate('/employers')}
        />

        <AdminStatCard
          title="Job Demands"
          value={stats.activeJobDemands}
          icon={<BriefcaseBusiness />}
          gradient="from-orange-500 to-rose-600"
          onClick={() => onNavigate('/job-demand')}
        />

        <AdminStatCard
          title="Sub Agents"
          value={stats.activeSubAgents}
          icon={<UserCircle />}
          gradient="from-slate-700 to-slate-900"
          onClick={() => onNavigate('/sub-agents')}
        />
      </div>

      {/* Charts – ONLY first chart changed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
        <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
          <h3 className="font-black text-slate-900 mb-8 uppercase text-sm tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" /> Worker Pipeline
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <ReBar 
                  dataKey="count" 
                  fill="#4f46e5" 
                  radius={[10, 10, 0, 0]} 
                  barSize={60} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* This chart is unchanged from your original code */}
        <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
          <h3 className="font-black text-slate-900 mb-8 uppercase text-sm tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-900" /> Organizational Overview
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <ReBar dataKey="count" fill="#1e293b" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={resetForm}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-3">
                  {editId ? <Edit className="text-indigo-600" /> : <Plus className="text-indigo-600" />}
                  {editId ? "Edit Note" : "Add New Note"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <X size={24} />
                </Button>
              </div>

              <CardContent className="p-8">
                <form onSubmit={handleAddNote} className="space-y-6">
                  <textarea
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[140px]"
                    placeholder="Note content..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <select
                      className="p-3 rounded-xl border font-bold text-sm bg-slate-50"
                      value={newNote.category}
                      onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="reminder">Reminder</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    <input
                      type="date"
                      className="p-3 rounded-xl border font-bold text-sm"
                      value={newNote.targetDate}
                      onChange={(e) => setNewNote({ ...newNote, targetDate: e.target.value })}
                    />
                  </div>

                  <select
                    className="w-full p-3 rounded-xl border font-bold text-sm bg-slate-50"
                    value={newNote.linkedEntityId}
                    onChange={(e) => setNewNote({ ...newNote, linkedEntityId: e.target.value })}
                  >
                    <option value="">Link to entity (Optional)</option>
                    <optgroup label="Staff">
                      {employees.map(e => (
                        <option key={e._id} value={e._id}>{e.fullName}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Workers">
                      {workers.map(w => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </optgroup>
                  </select>

                  <input type="file" onChange={handleFileChange} className="w-full text-xs text-slate-500" />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold"
                    >
                      {editId ? 'Update Note' : 'Save Note'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1 py-4 rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Main Content - Reminders & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left - Reminders */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <Bell size={24} className="text-red-600" /> Reminders
            </h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs font-black px-4 py-2 rounded-xl border bg-white"
            >
              {showArchived ? 'Active' : 'Archive'}
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {(showArchived ? archivedReminders : activeReminders).map(rem => {
              const days = getDaysRemaining(rem.targetDate);
              const bs = convertADtoBS(rem.targetDate);
              const adDate = rem.targetDate ? new Date(rem.targetDate) : null;

              return (
                <div
                  key={rem._id}
                  className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-red-600 flex gap-5"
                >
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-red-50 rounded-2xl shrink-0 border border-red-100">
                    <span className="text-xs font-black text-red-600">
                      {isBS ? bs.month : adDate?.toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black text-red-700">
                      {isBS ? bs.day : adDate?.getDate()}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="text-md font-bold text-slate-900">{rem.content}</p>

                    <div className="mt-4 flex items-center gap-4">
                      <Badge
                        className={`text-xs font-black ${days <= 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
                      >
                        {days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : `${days} DAYS LEFT`}
                      </Badge>

                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={() => handleEdit(rem)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(rem._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          onClick={() => markDone(rem._id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right - Operational Logs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <FileText size={24} className="text-indigo-600" /> Operational Logs
            </h2>

            <select
              className="p-2 rounded-xl border-2 border-indigo-100 bg-white text-sm font-bold shadow-sm outline-none focus:border-indigo-500"
              value={selectedEmployeeFilter}
              onChange={e => setSelectedEmployeeFilter(e.target.value)}
            >
              <option value="all">Show Everyone</option>
              <optgroup label="Staff Members">
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {String(emp._id).trim() === String(currentUserId).trim()
                      ? "My Notes (Me)"
                      : emp.fullName}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredNotes.map(note => {
              const creatorId = note.createdBy?._id || note.createdBy;
              const isOwnNote = String(creatorId).trim() === String(currentUserId).trim();
              
              const adDate = new Date(note.createdAt);
              const bsDate = convertADtoBS(note.createdAt);

              return (
                <div
                  key={note._id}
                  className={`p-6 rounded-3xl border-2 transition-all ${isOwnNote
                    ? 'bg-indigo-50/60 border-indigo-200 shadow-md'
                    : 'bg-white border-slate-100 shadow-sm'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge
                      className={`${note.category === 'urgent'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                        } border-none text-[10px] font-black uppercase px-3 py-1`}
                    >
                      {note.category}
                    </Badge>

                    {note.attachment && (
                      <a
                        href={`${FILE_BASE}${note.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Paperclip size={16} />
                      </a>
                    )}
                  </div>

                  <p className="text-md text-slate-800 font-medium leading-relaxed mb-5">
                    {note.content}
                  </p>

                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOwnNote ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${isOwnNote ? 'text-indigo-700' : 'text-slate-500'}`}
                    >
                      BY {isOwnNote ? "ME" : (note.createdBy?.fullName || 'Unknown')}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex gap-5">
                      {isOwnNote && (
                        <>
                          <button
                            onClick={() => handleEdit(note)}
                            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors"
                          >
                            <Edit size={15} /> Edit
                          </button>

                          <button
                            onClick={() => handleDelete(note._id)}
                            className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-semibold text-sm transition-colors"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 font-black">
                      {isBS 
                        ? `${bsDate.day} ${bsDate.month}` 
                        : adDate.toLocaleDateString('en-GB')
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}