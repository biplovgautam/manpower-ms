'use client';

import axios from 'axios';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  Clock,
  Edit,
  FileText, Plus,
  Trash2,
  UserCircle,
  Users,
  X
} from 'lucide-react';
import { useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

// ---------------- Mock Data (Keeping UI Pretty) ----------------
const mockAdminStats = {
  totalEmployers: 28,
  totalEmployees: 12,
  totalWorkers: 189,
  workersInProcessing: 35,
  workersDeployed: 120,
  workersRejected: 34,
  workersPending: 10,
  activeJobDemands: 15,
  pendingJobs: 9,
  upcomingDeadlines: 6
};

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export function AdminDashboard({ onNavigate = () => { } }) {
  // --- States for Notes (From your original file) ---
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // --- NEW: States for "Add Employee" Backend Logic ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  // --- Backend Function: Register Employee ---
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Calling your existing backend route
      const response = await axios.post(
        'http://localhost:5000/api/auth/add-employee',
        employeeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Success: ${response.data.msg}`);
      setIsModalOpen(false); // Close modal
      setEmployeeData({ fullName: '', email: '', password: '' }); // Reset form
    } catch (error) {
      alert(error.response?.data?.msg || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  // --- Notes Logic (Existing) ---
  const addNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      content: newNote,
      updatedAt: new Date().toISOString(),
      category: 'general'
    };
    setNotes([note, ...notes]);
    setNewNote('');
  };

  const removeNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    setNotes(notes.map(n => n.id === editingId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
  };

  // --- Stats Cards Mapping ---
  const statsCards = [
    { label: 'Total Employers', value: mockAdminStats.totalEmployers, icon: <Building2 className="text-blue-600" /> },
    { label: 'Total Employees', value: mockAdminStats.totalEmployees, icon: <Users className="text-indigo-600" /> },
    { label: 'Total Workers', value: mockAdminStats.totalWorkers, icon: <UserCircle className="text-emerald-600" /> },
    { label: 'Active Demands', value: mockAdminStats.activeJobDemands, icon: <Briefcase className="text-amber-600" /> },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">

      {/* ---------------- Header Section ---------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here is what is happening today.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 flex items-center gap-2 px-6 py-6 rounded-xl transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold text-lg">Add Employee</span>
        </Button>
      </div>

      {/* ---------------- Stat Grid ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => (
          <Card key={idx} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="p-4 bg-gray-50 rounded-2xl">{card.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------------- ADD EMPLOYEE MODAL ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Register New Staff</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                <Input
                  placeholder="John Doe"
                  className="rounded-xl h-12"
                  value={employeeData.fullName}
                  onChange={(e) => setEmployeeData({ ...employeeData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  className="rounded-xl h-12"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl h-12"
                  value={employeeData.password}
                  onChange={(e) => setEmployeeData({ ...employeeData, password: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  {loading ? 'Creating...' : 'Register User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Charts & Notes (Keeping your original UI) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workers Distribution Chart */}
        <Card className="shadow-lg border-none rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-indigo-600" />
              Workers Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Deployed', value: mockAdminStats.workersDeployed },
                    { name: 'Processing', value: mockAdminStats.workersInProcessing },
                    { name: 'Rejected', value: mockAdminStats.workersRejected },
                    { name: 'Pending', value: mockAdminStats.workersPending }
                  ]}
                  innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value"
                >
                  {COLORS.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="shadow-lg border-none rounded-2xl flex flex-col">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type a new update..."
                className="rounded-xl bg-gray-50 border-none h-12"
              />
              <Button onClick={addNote} className="bg-indigo-600 rounded-xl h-12 px-6">Add</Button>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {notes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No notes yet</div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                    {editingId === note.id ? (
                      <div className="flex gap-2">
                        <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1" />
                        <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(note)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => removeNote(note.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Bottom Stats ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <Clock className="text-amber-500 h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{mockAdminStats.upcomingDeadlines}</p>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">Upcoming Deadlines</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <AlertCircle className="text-red-500 h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{mockAdminStats.workersRejected}</p>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">Total Rejections</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <Check className="text-green-500 h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{mockAdminStats.workersDeployed}</p>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">Successful Deployments</p>
          </div>
        </div>
      </div>
    </div>
  );
}