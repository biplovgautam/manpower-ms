"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    AlertCircle, Briefcase, Building2, Clock, 
    FileText, Trash2, UserCircle, Users, Plus, Edit, X, RefreshCw, Bell, Calendar as CalendarIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import adbs from 'ad-bs-converter';

const API_BASE = 'http://localhost:5000/api/dashboard';

// --- UTILITY: NEPAL TIME & CALENDAR CONVERSION ---
const getNepalTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
};

const convertADtoBS = (adDateString) => {
    if (!adDateString) return "";
    try {
        const date = new Date(adDateString);
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        
        // Range check for ad-bs-converter (approx 1944 AD to 2033 AD)
        if (y < 1944 || y > 2033) return adDateString; 
        
        const converted = adbs.ad2bs(`${y}/${m}/${d}`);
        return `${converted.en.year}-${String(converted.en.month).padStart(2, '0')}-${String(converted.en.day).padStart(2, '0')} BS`;
    } catch (e) {
        return adDateString;
    }
};

// --- SUB-COMPONENTS ---
function StatCard({ title, value, icon, onClick, gradient = 'from-blue-500 to-blue-600' }) {
    return (
        <Card 
            onClick={onClick} 
            className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardContent className="flex items-center justify-between p-6">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`shrink-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg ml-4`}>
                    {React.cloneElement(icon, { size: 28 })}
                </div>
            </CardContent>
        </Card>
    );
}

const CustomTextarea = React.forwardRef(({ className, ...props }, ref) => (
    <textarea
        ref={ref}
        className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] shadow-sm transition-all ${className || ''}`}
        {...props}
    />
));
CustomTextarea.displayName = "CustomTextarea";

// --- MAIN COMPONENT ---
export function EmployeeDashboard({ onNavigate = () => { } }) {
    const [isBS, setIsBS] = useState(false); 
    const [currentTime, setCurrentTime] = useState(getNepalTime());
    const [stats, setStats] = useState({ 
        employersAdded: 0, 
        activeJobDemands: 0, 
        workersInProcess: 0, 
        tasksNeedingAttention: 0, 
        activeSubAgents: 0 
    });
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [noteCategory, setNoteCategory] = useState('general');
    const [importantDate, setImportantDate] = useState('');

    const noteCategories = useMemo(() => [
        { value: 'general', label: 'General' },
        { value: 'employer', label: 'Employer' },
        { value: 'worker', label: 'Worker' },
        { value: 'job-demand', label: 'Job Demand' }
    ], []);

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getNepalTime()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDisplayDate = useCallback((dateString) => {
        if (!dateString) return "N/A";
        return isBS ? convertADtoBS(dateString) : new Date(dateString).toLocaleDateString();
    }, [isBS]);

    const getDaysRemaining = useCallback((dateString) => {
        if (!dateString) return null;
        const target = new Date(dateString);
        const today = getNepalTime();
        today.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, []);

    const triggerDeadlineAlerts = useCallback((allNotes) => {
        const urgent = allNotes.filter(n => {
            if (n.category !== 'reminder') return false;
            const days = getDaysRemaining(n.targetDate);
            return days !== null && days >= 0 && days <= 3;
        });

        if (urgent.length > 0) {
            toast.dismiss('urgent-deadline-alert'); 
            toast.error(
                (t) => (
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm">
                            <strong>Action Required:</strong> {urgent.length} urgent tasks pending!
                        </span>
                        <button 
                            onClick={() => toast.dismiss(t.id)}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-[10px] font-bold uppercase border border-white/40 transition-colors"
                        >Dismiss</button>
                    </div>
                ),
                {
                    id: 'urgent-deadline-alert',
                    duration: 6000,
                    icon: '⏳',
                    style: { borderRadius: '12px', background: '#1e293b', color: '#fff', minWidth: '350px' }
                }
            );
        }
    }, [getDaysRemaining]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(API_BASE, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (res.data.success) {
                setStats(res.data.data.stats);
                setNotes(res.data.data.notes);
                triggerDeadlineAlerts(res.data.data.notes);
            }
        } catch (err) { 
            console.error("Dashboard Load Error:", err); 
            toast.error("Failed to sync dashboard");
        } finally { 
            setLoading(false); 
        }
    }, [triggerDeadlineAlerts]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const resetNoteForm = () => {
        setNewNoteContent('');
        setEditingNote(null);
        setIsAddingNote(false);
        setNoteCategory('general');
        setImportantDate('');
    };

    const handleSaveNote = async () => {
        if (!newNoteContent.trim()) {
            toast.error("Please enter note content");
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const payload = {
                content: newNoteContent,
                category: noteCategory,
                targetDate: importantDate || null
            };

            if (editingNote) {
                const res = await axios.patch(`${API_BASE}/notes/${editingNote._id}`, payload, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                setNotes(prev => prev.map(n => n._id === editingNote._id ? res.data.data : n));
                toast.success('Note updated');
            } else {
                const res = await axios.post(`${API_BASE}/notes`, payload, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                setNotes(prev => [res.data.data, ...prev]);
                toast.success('Note created');
            }
            resetNoteForm();
            fetchDashboardData();
        } catch (err) { 
            toast.error("Save failed");
        }
    };

    const deleteNote = async (id) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setNotes(prev => prev.filter(n => (n._id || n.id) !== id));
            toast.success('Note removed');
        } catch (err) { 
            toast.error("Delete failed");
        }
    };

    const startEdit = (note) => {
        setEditingNote(note);
        setNewNoteContent(note.content);
        setNoteCategory(note.category);
        setImportantDate(note.targetDate ? note.targetDate.split('T')[0] : '');
        setIsAddingNote(true);
    };

    const getCategoryColor = (category) => {
        const colors = {
            general: 'bg-gray-100 text-gray-800',
            employer: 'bg-indigo-100 text-indigo-800',
            worker: 'bg-emerald-100 text-emerald-800',
            'job-demand': 'bg-purple-100 text-purple-800',
            reminder: 'bg-orange-100 text-orange-800'
        };
        return colors[category] || colors.general;
    };

    const operationNotes = notes.filter(n => n.category !== 'reminder');
    const reminderNotes = notes
        .filter(n => n.category === 'reminder')
        .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <RefreshCw className="animate-spin text-blue-500" size={40} />
            <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="space-y-8 p-2 md:p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <Toaster position="top-right" />
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recruitment Dashboard</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1.5 px-3 py-1">
                            <Clock size={12} /> Kathmandu: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                        <p className="text-gray-500 text-sm font-medium italic hidden sm:block">Real-time pipeline overview</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setIsBS(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isBS ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>AD</button>
                        <button onClick={() => setIsBS(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isBS ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>BS</button>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDashboardData} className="border-gray-200">
                        <RefreshCw size={14} className="mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Employers" value={stats.employersAdded} icon={<Building2 />} gradient="from-indigo-500 to-blue-600" onClick={() => onNavigate('employer')} />
                <StatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase />} gradient="from-purple-500 to-indigo-600" onClick={() => onNavigate('job-demand')} />
                <StatCard title="Workers" value={stats.workersInProcess} icon={<UserCircle />} gradient="from-emerald-500 to-teal-600" onClick={() => onNavigate('worker')} />
                <StatCard title="Attention" value={stats.tasksNeedingAttention} icon={<AlertCircle />} gradient="from-orange-500 to-red-600" />
                <StatCard title="Sub-Agents" value={stats.activeSubAgents} icon={<Users />} gradient="from-cyan-500 to-blue-600" onClick={() => onNavigate('subagent')} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Reminders Panel */}
                <Card className="xl:col-span-5 shadow-xl border-orange-200 overflow-hidden flex flex-col bg-white">
                    <CardHeader className="bg-orange-50/50 border-b border-orange-100 flex flex-row items-center justify-between py-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Bell size={22} className={reminderNotes.length > 0 ? "animate-bounce" : ""} />
                            </div>
                            <CardTitle className="text-lg">Priority Reminders</CardTitle>
                        </div>
                        <Badge className="bg-orange-500 text-white border-none text-sm px-3">{reminderNotes.length}</Badge>
                    </CardHeader>
                    <CardContent className="p-6 overflow-y-auto flex-1 max-h-[500px] custom-scrollbar">
                        <div className="space-y-4">
                            {reminderNotes.length === 0 ? (
                                <div className="text-center py-20 opacity-30 italic">No pending reminders</div>
                            ) : reminderNotes.map(reminder => {
                                const daysLeft = getDaysRemaining(reminder.targetDate);
                                const isUrgent = daysLeft !== null && daysLeft <= 3;
                                
                                return (
                                    <div key={reminder._id} className={`group relative flex gap-4 p-4 rounded-2xl border transition-all ${isUrgent ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:border-orange-300'}`}>
                                        <div className={`flex flex-col items-center justify-center bg-white border rounded-xl w-24 h-14 shrink-0 shadow-sm ${isUrgent ? 'border-red-300 text-red-600' : 'border-gray-200 text-gray-500'}`}>
                                            <span className="text-[10px] uppercase font-black">
                                                {isBS ? 'Nepali' : (reminder.targetDate ? new Date(reminder.targetDate).toLocaleString('en-US', { month: 'short' }) : 'ASAP')}
                                            </span>
                                            <span className={`${isBS ? 'text-[11px]' : 'text-xl'} font-black leading-none mt-1`}>
                                                {isBS ? convertADtoBS(reminder.targetDate).replace(' BS', '') : (reminder.targetDate ? new Date(reminder.targetDate).getDate() : '!!')}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 font-semibold leading-snug mb-2">{reminder.content}</p>
                                            {daysLeft !== null && (
                                                <Badge className={`text-[10px] font-bold border-none px-3 py-1 rounded-full ${
                                                    daysLeft < 0 ? 'bg-slate-800 text-white' :
                                                    daysLeft === 0 ? 'bg-red-600 text-white' :
                                                    daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft} Days Left`}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => startEdit(reminder)} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                                            <button onClick={() => deleteNote(reminder._id)} className="p-2 text-gray-400 hover:text-red-500"><X size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Operations Panel */}
                <Card className="xl:col-span-7 border border-gray-200 shadow-lg overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between bg-gray-50/80 border-b border-gray-100 py-5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md"><FileText size={20} /></div>
                            <CardTitle className="text-lg">Operation Logs</CardTitle>
                        </div>
                        <Button 
                            onClick={() => isAddingNote ? resetNoteForm() : setIsAddingNote(true)} 
                            className={`${isAddingNote ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                            size="sm"
                        >
                            {isAddingNote ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                            {isAddingNote ? 'Cancel' : 'Add Note'}
                        </Button>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {isAddingNote && (
                            <div className="mb-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4">
                                <div className="grid md:grid-cols-4 gap-4 mb-4">
                                    <div className="space-y-3">
                                        <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none">
                                            {noteCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                            <option value="reminder">Special Reminder</option>
                                        </select>
                                        <div className="relative">
                                            <CalendarIcon size={14} className="absolute left-3 top-3.5 text-gray-400" />
                                            <input type="date" value={importantDate} onChange={(e) => setImportantDate(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-3">
                                        <CustomTextarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Type update here..." />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button variant="ghost" onClick={resetNoteForm}>Discard</Button>
                                    <Button onClick={handleSaveNote} className="bg-blue-600 text-white px-8">Save Note</Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {operationNotes.map(note => (
                                <div key={note._id || note.id} className="relative group p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 transition-all duration-300">
                                    <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(note)} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                                        <button onClick={() => deleteNote(note._id || note.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="pr-20 space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge className={`${getCategoryColor(note.category)} border-none capitalize text-[10px] px-3 py-0.5 rounded-full font-bold`}>{note.category}</Badge>
                                            {note.targetDate && (
                                                <span className="flex items-center gap-1.5 text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                                                    <CalendarIcon size={12} /> {formatDisplayDate(note.targetDate)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-lg border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                    <CardTitle className="text-base font-bold text-gray-700">Management Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                    <QuickActionButton title="Add Employer" desc="Register Company" icon={<Building2 />} onClick={() => onNavigate('employer')} />
                    <QuickActionButton title="Post Demand" desc="Open Position" icon={<Briefcase />} onClick={() => onNavigate('job-demand')} />
                    <QuickActionButton title="Recruit Worker" desc="New Profile" icon={<UserCircle />} onClick={() => onNavigate('worker')} />
                    <QuickActionButton title="Sub-Agents" desc="Directory" icon={<Users />} onClick={() => onNavigate('subagent')} />
                </CardContent>
            </Card>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}

function QuickActionButton({ title, desc, icon, onClick }) {
    return (
        <button 
            type="button"
            onClick={onClick} 
            className="group h-24 flex flex-col items-center justify-center bg-white hover:bg-blue-600 text-gray-900 hover:text-white border border-gray-200 rounded-2xl shadow-sm transition-all duration-300"
        >
            <div className="mb-2 text-blue-600 group-hover:text-white transition-colors transform group-hover:scale-110 duration-300">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div className="font-bold text-sm tracking-tight">{title}</div>
            <div className="text-[9px] opacity-60 group-hover:opacity-100 font-bold uppercase tracking-tighter mt-1">{desc}</div>
        </button>
    );
}