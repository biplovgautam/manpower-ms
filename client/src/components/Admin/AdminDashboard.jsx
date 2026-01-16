"use client";

import adbs from 'ad-bs-converter';
import axios from 'axios';
import {
  Bell, Briefcase, Building2,
  CheckCircle, Contact,
  Edit, FileText, Paperclip,
  Plus, RefreshCw, ShieldCheck,
  Trash2, TrendingUp,
  UserCircle, UserPlus, Users
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { AddEmployeeForm } from './AddEmployeeForm';

const API_BASE = 'http://localhost:5000/api/dashboard';
const FILE_BASE = 'http://localhost:5000';
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
    attachment: null,
  });

  const [stats, setStats] = useState({
    employersAdded: 0,
    activeJobDemands: 0,
    workersInProcess: 0,
    activeSubAgents: 0,
    totalEmployees: 0
  });
  const [allData, setAllData] = useState([]);
  const [dropdowns, setDropdowns] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(currentUserId || 'all');
  const [editId, setEditId] = useState(null);

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
          { name: 'Workers', count: s.workersInProcess },
          { name: 'Staff', count: s.totalEmployees },
          { name: 'Employers', count: s.employersAdded },
          { name: 'Demands', count: s.activeJobDemands },
          { name: 'Agents', count: s.activeSubAgents },
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
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
    .sort((a, b) => new Date(a.targetDate || 0) - new Date(b.targetDate || 0));

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
    <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10 space-y-10 text-slate-800">
      <Toaster position="top-right" />

      {/* Header */}
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

        <div className="flex items-center gap-4">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-14 text-lg font-bold shadow-lg flex items-center gap-3"
          >
            <UserPlus size={22} /> Register Staff
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatCard title="Workers" value={stats.workersInProcess} icon={<UserCircle />} gradient="from-blue-600 to-indigo-600" onClick={() => onNavigate('worker')} />
        <AdminStatCard title="Staff" value={stats.totalEmployees} icon={<Contact />} gradient="from-indigo-600 to-purple-600" onClick={() => onNavigate('employee-list')} />
        <AdminStatCard title="Employers" value={stats.employersAdded} icon={<Building2 />} gradient="from-emerald-600 to-teal-600" onClick={() => onNavigate('employer')} />
        <AdminStatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase />} gradient="from-orange-500 to-rose-600" onClick={() => onNavigate('job-demand')} />
        <AdminStatCard title="Sub Agents" value={stats.activeSubAgents} icon={<Users />} gradient="from-slate-700 to-slate-900" onClick={() => onNavigate('subagent')} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left - Quick Add + Reminders */}
        <div className="lg:col-span-5 space-y-8">
          {/* Quick Add */}
          <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              {editId ? <Edit className="text-indigo-600" /> : <Plus className="text-indigo-600" />}
              {editId ? "Edit Note" : "Quick Add"}
            </h2>

            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold"
                >
                  {editId ? 'Update' : 'Save'}
                </Button>

                {editId && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="py-4 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Reminders */}
          <div className="space-y-4">
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
                          className={`text-xs font-black ${days <= 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {days === 0
                            ? 'TODAY'
                            : days < 0
                              ? 'OVERDUE'
                              : `${days} DAYS LEFT`}
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
        </div>

        {/* Right - Operational Logs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <FileText size={24} className="text-indigo-600" /> Operational Logs
            </h2>

            <select
              className="p-2 rounded-xl border-2 border-indigo-100 bg-white text-sm font-bold shadow-sm"
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
                      className={`text-xs font-bold uppercase tracking-wide ${isOwnNote ? 'text-indigo-700' : 'text-slate-500'
                        }`}
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

                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(note.createdAt).toLocaleDateString('en-GB')}
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