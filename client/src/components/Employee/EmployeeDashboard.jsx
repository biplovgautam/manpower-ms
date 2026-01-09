"use client";

import {
    AlertCircle, Briefcase, Building2, Check, Clock, 
    FileText, Trash2, UserCircle, Users, Plus, Edit, X, RefreshCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/dashboard';

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
        className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] shadow-sm ${className || ''}`}
        {...props}
    />
));
CustomTextarea.displayName = "CustomTextarea";

export function EmployeeDashboard({ onNavigate = () => { } }) {
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

    const noteCategories = [
        { value: 'general', label: 'General' },
        { value: 'employer', label: 'Employer' },
        { value: 'worker', label: 'Worker' },
        { value: 'job-demand', label: 'Job Demand' },
        { value: 'reminder', label: 'Reminder' }
    ];

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
            }
        } catch (err) { 
            console.error("Dashboard Load Error:", err); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleSaveNote = async () => {
        if (!newNoteContent.trim()) return;
        const token = localStorage.getItem('token');
        try {
            if (editingNote) {
                const res = await axios.patch(`${API_BASE}/notes/${editingNote._id}`, {
                    content: newNoteContent,
                    category: noteCategory
                }, { headers: { Authorization: `Bearer ${token}` } });
                setNotes(notes.map(n => n._id === editingNote._id ? res.data.data : n));
            } else {
                const res = await axios.post(`${API_BASE}/notes`, {
                    content: newNoteContent,
                    category: noteCategory
                }, { headers: { Authorization: `Bearer ${token}` } });
                setNotes([res.data.data, ...notes]);
            }
            resetNoteForm();
        } catch (err) { console.error("Save Note Error:", err); }
    };

    const resetNoteForm = () => {
        setNewNoteContent('');
        setEditingNote(null);
        setIsAddingNote(false);
        setNoteCategory('general');
    };

    const deleteNote = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setNotes(notes.filter(n => (n._id || n.id) !== id));
        } catch (err) { console.error("Delete Error:", err); }
    };

    const startEdit = (note) => {
        setEditingNote(note);
        setNewNoteContent(note.content);
        setNoteCategory(note.category);
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <RefreshCw className="animate-spin text-blue-500" size={40} />
            <p className="text-gray-500 font-medium">Syncing data...</p>
        </div>
    );

    return (
        <div className="space-y-8 p-2 md:p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Employee Dashboard</h1>
                    <p className="text-gray-500 mt-1 font-medium">Internal recruitment pipeline overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-white border-gray-200">
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                    <div className="text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Employers" value={stats.employersAdded} icon={<Building2 />} gradient="from-indigo-500 to-blue-600" onClick={() => onNavigate('employer')} />
                <StatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase />} gradient="from-purple-500 to-indigo-600" onClick={() => onNavigate('job-demand')} />
                <StatCard title="Workers" value={stats.workersInProcess} icon={<UserCircle />} gradient="from-emerald-500 to-teal-600" onClick={() => onNavigate('worker')} />
                <StatCard title="Urgent" value={stats.tasksNeedingAttention} icon={<AlertCircle />} gradient="from-orange-500 to-red-600" />
                <StatCard title="Sub-Agents" value={stats.activeSubAgents} icon={<Users />} gradient="from-cyan-500 to-blue-600" onClick={() => onNavigate('subagent')} />
            </div>

            {/* Operation Notes Section */}
            <Card className="border border-gray-200 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100 py-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg"><FileText size={20} className="text-blue-600" /></div>
                        <CardTitle className="text-lg">Internal Operation Notes</CardTitle>
                    </div>
                    <Button 
                        onClick={() => isAddingNote ? resetNoteForm() : setIsAddingNote(true)} 
                        variant={isAddingNote ? "outline" : "default"}
                        className={!isAddingNote ? "bg-blue-600 hover:bg-blue-700 shadow-sm" : ""}
                        size="sm"
                    >
                        {isAddingNote ? <X size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
                        {isAddingNote ? 'Cancel' : 'New Note'}
                    </Button>
                </CardHeader>

                <CardContent className="pt-6">
                    {isAddingNote && (
                        <div className="mb-6 p-5 bg-blue-50/30 rounded-xl border border-blue-100 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <select 
                                    value={noteCategory} 
                                    onChange={e => setNoteCategory(e.target.value)} 
                                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                >
                                    {noteCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                                <div className="md:col-span-3">
                                    <CustomTextarea 
                                        value={newNoteContent} 
                                        onChange={e => setNewNoteContent(e.target.value)} 
                                        placeholder="Note details..." 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={resetNoteForm} size="sm">Discard</Button>
                                <Button onClick={handleSaveNote} className="bg-blue-600 text-white hover:bg-blue-700" size="sm">
                                    {editingNote ? 'Update Changes' : 'Post Note'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {notes.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto text-gray-200 mb-2" size={48} />
                                <p className="text-gray-400 italic">No operational notes yet.</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div key={note._id || note.id} className="relative group p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                    {/* Action Buttons: Absolute Positioned for UI stability */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEdit(note)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteNote(note._id || note.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="pr-16 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${getCategoryColor(note.category)} border-none capitalize text-[10px] px-2 py-0`}>
                                                {note.category}
                                            </Badge>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed break-words">{note.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-gray-200 overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 p-6">
                        <QuickActionButton title="Add Employer" desc="New company" icon={<Building2 />} onClick={() => onNavigate('employer?action=add')} />
                        <QuickActionButton title="Create Demand" desc="Job opening" icon={<Briefcase />} onClick={() => onNavigate('job-demand?action=add')} />
                        <QuickActionButton title="Workers List" desc="View status" icon={<UserCircle />} onClick={() => onNavigate('worker')} />
                        <QuickActionButton title="Manage Agents" desc="Sub-agent list" icon={<Users />} onClick={() => onNavigate('subagent')} />
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-gray-200 overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <ActivityItem icon={<Check className="text-emerald-600" />} title="Visa Approved" subtitle="Worker: Ram Bahadur (Dubai Project)" bg="bg-emerald-50" />
                        <ActivityItem icon={<Clock className="text-amber-600" />} title="Follow-up Required" subtitle="Interview scheduled for 10am tomorrow" bg="bg-amber-50" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function QuickActionButton({ title, desc, icon, onClick }) {
    return (
        <button 
            type="button"
            onClick={onClick} 
            className="group h-24 flex flex-col items-center justify-center bg-white hover:bg-blue-600 text-gray-900 hover:text-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300"
        >
            <div className="mb-2 text-blue-600 group-hover:text-white transition-colors transform group-hover:scale-110 duration-300">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div className="font-bold text-sm">{title}</div>
            <div className="text-[10px] opacity-60 group-hover:opacity-90 uppercase tracking-tighter">{desc}</div>
        </button>
    );
}

function ActivityItem({ icon, title, subtitle, bg }) {
    return (
        <div className={`flex items-start gap-4 p-4 ${bg} rounded-xl border border-black/5 shadow-sm`}>
            <div className="mt-1 bg-white p-1.5 rounded-lg shadow-sm shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-600 truncate">{subtitle}</p>
            </div>
        </div>
    );
}