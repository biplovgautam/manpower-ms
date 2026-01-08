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

/**
 * Reusable Stat Card Component
 */
function StatCard({ title, value, icon, onClick, gradient = 'from-blue-500 to-blue-600' }) {
    return (
        <Card 
            onClick={onClick} 
            className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg`}>
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
        { value: 'general', label: 'General', color: 'gray' },
        { value: 'employer', label: 'Employer', color: 'indigo' },
        { value: 'worker', label: 'Worker', color: 'emerald' },
        { value: 'job-demand', label: 'Job Demand', color: 'purple' },
        { value: 'reminder', label: 'Reminder', color: 'orange' }
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
        <div className="space-y-8 p-2 md:p-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Employee Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your recruitment pipeline and tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-white">
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                    <div className="text-xs font-mono text-gray-400 bg-white px-4 py-2 rounded-lg border">
                        {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard 
                    title="Employers" 
                    value={stats.employersAdded} 
                    icon={<Building2 />} 
                    gradient="from-indigo-500 to-blue-600" 
                    onClick={() => onNavigate('employer')} 
                />
                <StatCard 
                    title="Job Demands" 
                    value={stats.activeJobDemands} 
                    icon={<Briefcase />} 
                    gradient="from-purple-500 to-indigo-600" 
                    onClick={() => onNavigate('job-demand')} 
                />
                <StatCard 
                    title="Workers" 
                    value={stats.workersInProcess} 
                    icon={<UserCircle />} 
                    gradient="from-emerald-500 to-teal-600" 
                    onClick={() => onNavigate('worker')} 
                />
                <StatCard 
                    title="Urgent" 
                    value={stats.tasksNeedingAttention} 
                    icon={<AlertCircle />} 
                    gradient="from-orange-500 to-red-600" 
                />
                <StatCard 
                    title="Sub-Agents" 
                    value={stats.activeSubAgents} 
                    icon={<Users />} 
                    gradient="from-cyan-500 to-blue-600" 
                    onClick={() => onNavigate('subagent')} 
                />
            </div>

            {/* Operation Notes Section */}
            <Card className="border-none shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        <CardTitle>Internal Operation Notes</CardTitle>
                    </div>
                    <Button 
                        onClick={() => isAddingNote ? resetNoteForm() : setIsAddingNote(true)} 
                        variant={isAddingNote ? "outline" : "default"}
                        className={!isAddingNote ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        {isAddingNote ? <X size={18} /> : <Plus size={18} className="mr-1" />}
                        {isAddingNote ? 'Cancel' : 'New Note'}
                    </Button>
                </CardHeader>

                <CardContent className="pt-6">
                    {isAddingNote && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <select 
                                    value={noteCategory} 
                                    onChange={e => setNoteCategory(e.target.value)} 
                                    className="px-4 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {noteCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                                <div className="md:col-span-3">
                                    <CustomTextarea 
                                        value={newNoteContent} 
                                        onChange={e => setNewNoteContent(e.target.value)} 
                                        placeholder="Type your note here..." 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={resetNoteForm}>Discard</Button>
                                <Button onClick={handleSaveNote} className="bg-blue-600 text-white hover:bg-blue-700">
                                    {editingNote ? 'Update Changes' : 'Post Note'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {notes.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 italic">No operational notes yet.</div>
                        ) : (
                            notes.map(note => (
                                <div key={note._id || note.id} className="group p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${getCategoryColor(note.category)} border-none capitalize`}>
                                                    {note.category}
                                                </Badge>
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">
                                                    {new Date(note.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed">{note.content}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => startEdit(note)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => deleteNote(note._id || note.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-xl border-none ring-1 ring-gray-100">
                    <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <QuickActionButton 
                            title="Add Employer" 
                            desc="New company" 
                            icon={<Building2 />} 
                            onClick={() => onNavigate('employer?action=add')} 
                        />
                        <QuickActionButton 
                            title="Create Demand" 
                            desc="Job opening" 
                            icon={<Briefcase />} 
                            onClick={() => onNavigate('job-demand?action=add')} 
                        />
                        <QuickActionButton 
                            title="Workers List" 
                            desc="View status" 
                            icon={<UserCircle />} 
                            onClick={() => onNavigate('worker')} 
                        />
                        <QuickActionButton 
                            title="Manage Agents" 
                            desc="Sub-agent list" 
                            icon={<Users />} 
                            onClick={() => onNavigate('subagent')} 
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-xl border-none ring-1 ring-gray-100">
                    <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <ActivityItem 
                            icon={<Check className="text-emerald-600" />} 
                            title="Visa Approved" 
                            subtitle="Worker: Ram Bahadur (Dubai Project)" 
                            bg="bg-emerald-50" 
                        />
                        <ActivityItem 
                            icon={<Clock className="text-amber-600" />} 
                            title="Follow-up Required" 
                            subtitle="Interview scheduled for 10am tomorrow" 
                            bg="bg-amber-50" 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function QuickActionButton({ title, desc, icon, onClick }) {
    return (
        <Button 
            onClick={onClick} 
            className="h-24 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-600 text-gray-900 hover:text-white border border-gray-100 shadow-sm transition-all"
        >
            <div className="mb-2">{React.cloneElement(icon, { size: 20 })}</div>
            <div className="font-bold">{title}</div>
            <div className="text-[10px] opacity-70 uppercase tracking-tighter">{desc}</div>
        </Button>
    );
}

function ActivityItem({ icon, title, subtitle, bg }) {
    return (
        <div className={`flex items-start gap-4 p-4 ${bg} rounded-xl border border-white shadow-sm`}>
            <div className="mt-1">{icon}</div>
            <div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-600">{subtitle}</p>
            </div>
        </div>
    );
}