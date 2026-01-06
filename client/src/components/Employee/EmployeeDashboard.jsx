import {
    AlertCircle, Briefcase, Building2, Check, Clock, 
    FileText, Trash2, UserCircle, Users, Plus, Edit, X
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/dashboard';

function StatCard({ title, value, icon, onClick, gradient = 'from-blue-500 to-blue-600' }) {
    return (
        <Card 
            onClick={onClick} 
            className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-3">{value}</p>
                </div>
                <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-2xl transform hover:scale-110 transition-all duration-300`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

const CustomTextarea = React.forwardRef(({ className, ...props }, ref) => (
    <textarea
        ref={ref}
        className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] shadow-sm ${className || ''}`}
        {...props}
    />
));

export function EmployeeDashboard({ onNavigate = () => { } }) {
    const [stats, setStats] = useState({ employersAdded: 0, activeJobDemands: 0, workersInProcess: 0, tasksNeedingAttention: 0, activeSubAgents: 0 });
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNote, setEditingNote] = useState(null); // Added for Edit logic
    const [newNoteContent, setNewNoteContent] = useState('');
    const [noteCategory, setNoteCategory] = useState('general');

    const noteCategories = [
        { value: 'general', label: 'General', color: 'gray' },
        { value: 'employer', label: 'Employer', color: 'indigo' },
        { value: 'worker', label: 'Worker', color: 'emerald' },
        { value: 'job-demand', label: 'Job Demand', color: 'purple' },
        { value: 'reminder', label: 'Reminder', color: 'orange' }
    ];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setStats(res.data.data.stats);
                setNotes(res.data.data.notes);
            }
        } catch (err) { console.error("Dashboard Load Error:", err); } 
        finally { setLoading(false); }
    };

    const handleSaveNote = async () => {
        if (!newNoteContent.trim()) return;
        const token = localStorage.getItem('token');
        try {
            if (editingNote) {
                // EDIT LOGIC
                const res = await axios.patch(`${API_BASE}/notes/${editingNote._id}`, {
                    content: newNoteContent,
                    category: noteCategory
                }, { headers: { Authorization: `Bearer ${token}` } });
                setNotes(notes.map(n => n._id === editingNote._id ? res.data.data : n));
            } else {
                // ADD LOGIC
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

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employee Dashboard</h1>
                    <p className="text-lg text-gray-600 mt-2">Manage recruitment operations and track your progress</p>
                </div>
                <div className="hidden md:block text-sm text-gray-500 bg-white px-5 py-3 rounded-xl border shadow-sm">
                    Server Time: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard title="Employers" value={stats.employersAdded} icon={<Building2 size={28} />} gradient="from-indigo-500 to-purple-600" onClick={() => onNavigate('/dashboard/employee/employer')} />
                <StatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase size={28} />} gradient="from-purple-500 to-pink-600" onClick={() => onNavigate('/dashboard/employee/job-demand')} />
                <StatCard title="Processing" value={stats.workersInProcess} icon={<UserCircle size={28} />} gradient="from-emerald-500 to-teal-600" onClick={() => onNavigate('/dashboard/employee/worker')} />
                <StatCard title="Urgent Tasks" value={stats.tasksNeedingAttention} icon={<AlertCircle size={28} />} gradient="from-orange-500 to-red-600" />
                <StatCard title="Sub-Agents" value={stats.activeSubAgents} icon={<Users size={28} />} gradient="from-cyan-500 to-blue-600" onClick={() => onNavigate('/dashboard/employee/subagent')} />
            </div>

            {/* Operation Notes Card with Add/Edit/Delete */}
            <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-indigo-600" />
                        <CardTitle className="text-xl font-bold">Operation Notes</CardTitle>
                    </div>
                    <Button onClick={() => isAddingNote ? resetNoteForm() : setIsAddingNote(true)} variant={isAddingNote ? "outline" : "primary"}>
                        {isAddingNote ? 'Close' : 'Add Note'}
                    </Button>
                </CardHeader>

                <CardContent className="pt-6">
                    {isAddingNote && (
                        <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900">
                                    {noteCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                                <div className="md:col-span-3">
                                    <CustomTextarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Describe the update or task..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={resetNoteForm}>Cancel</Button>
                                <Button onClick={handleSaveNote}>{editingNote ? 'Update Note' : 'Save Update'}</Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        {notes.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">No notes found.</div>
                        ) : (
                            notes.map(note => (
                                <div key={note._id || note.id} className="p-5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className={getCategoryColor(note.category)}>{note.category}</Badge>
                                                <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-800">{note.content}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" className="text-gray-400 hover:text-indigo-600" onClick={() => startEdit(note)}><Edit size={18} /></Button>
                                            <Button variant="ghost" className="text-red-500" onClick={() => deleteNote(note._id || note.id)}><Trash2 size={18} /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* RESTORED QUICK ACTIONS SECTION */}
                <Card className="shadow-xl border-2">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button size="lg" onClick={() => onNavigate('/dashboard/employee/employer?action=add')} className="h-28 text-left justify-start bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                                <Building2 className="h-7 w-7 mr-4 text-white shrink-0" />
                                <div>
                                    <div className="font-bold text-lg">Add Employer</div>
                                    <div className="text-sm opacity-80 font-normal">Register new company</div>
                                </div>
                            </Button>
                            <Button size="lg" onClick={() => onNavigate('/dashboard/employee/job-demand?action=add')} className="h-28 text-left justify-start bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                                <Briefcase className="h-7 w-7 mr-4 text-white shrink-0" />
                                <div>
                                    <div className="font-bold text-lg">Create Demand</div>
                                    <div className="text-sm opacity-80 font-normal">New job opening</div>
                                </div>
                            </Button>
                            <Button size="lg" onClick={() => onNavigate('/dashboard/employee/worker')} className="h-28 text-left justify-start bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                                <UserCircle className="h-7 w-7 mr-4 text-white shrink-0" />
                                <div>
                                    <div className="font-bold text-lg">Manage Workers</div>
                                    <div className="text-sm opacity-80 font-normal">Track progress</div>
                                </div>
                            </Button>
                            <Button size="lg" onClick={() => onNavigate('/dashboard/employee/subagent')} className="h-28 text-left justify-start bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                                <Users className="h-7 w-7 mr-4 text-white shrink-0" />
                                <div>
                                    <div className="font-bold text-lg">Sub-Agents</div>
                                    <div className="text-sm opacity-80 font-normal">View & assign</div>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* RESTORED RECENT ACTIVITY SECTION */}
                <Card className="shadow-lg border-none">
                    <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <Check className="text-emerald-600 mt-1" />
                            <div>
                                <p className="font-semibold text-emerald-900">Visa Approved</p>
                                <p className="text-sm text-emerald-700">Worker: Ram Bahadur (Dubai Project)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <Clock className="text-amber-600 mt-1" />
                            <div>
                                <p className="font-semibold text-amber-900">Follow-up Required</p>
                                <p className="text-sm text-amber-700">Interview scheduled for 10am tomorrow</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}