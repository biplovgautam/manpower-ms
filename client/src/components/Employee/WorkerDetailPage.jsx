"use client";
import axios from 'axios';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Fingerprint,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { apiUrl } from '@/lib/api';

/**
 * UTILS & CONSTANTS
 */
const getFlagEmoji = (countryName) => {
  if (!countryName || countryName === "Not Assigned") return "🌍";
  const countryMap = {
    "saudi arabia": "🇸🇦", "uae": "🇦🇪", "qatar": "🇶🇦",
    "kuwait": "🇰🇼", "malaysia": "🇲🇾", "romania": "🇷🇴",
    "croatia": "🇭🇷", "poland": "🇵🇱", "japan": "🇯🇵",
    "nepal": "🇳🇵", "india": "🇮🇳", "portugal": "🇵🇹"
  };
  return countryMap[countryName.toLowerCase()] || "🌍";
};

const SCHEMA_STAGES = [
  'document-collection', 'document-verification', 'interview',
  'medical-examination', 'police-clearance', 'training',
  'visa-application', 'visa-approval', 'ticket-booking',
  'pre-departure-orientation', 'deployed'
];

/**
 * MAIN COMPONENT
 */
export function WorkerDetailsPage({ worker: initialWorker, workerId, onNavigate }) {
  const [worker, setWorker] = useState(initialWorker || null);
  const [loading, setLoading] = useState(true);
  const [localTimeline, setLocalTimeline] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkerData = useCallback(async () => {
    const id = workerId || initialWorker?._id;
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(apiUrl(`/api/workers/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setWorker(res.data.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [workerId, initialWorker]);

  useEffect(() => { fetchWorkerData(); }, [fetchWorkerData]);

  useEffect(() => {
    if (worker?.stageTimeline) {
      const synced = SCHEMA_STAGES.map(stageKey => {
        const existing = worker.stageTimeline.find(s => s.stage === stageKey);
        return existing || { stage: stageKey, status: 'pending', _id: stageKey };
      });
      setLocalTimeline(synced);
    }
  }, [worker]);

  const handleStatusChange = async (stageIdentifier, newStatus) => {
    setIsUpdating(true);
    
    // Optimistic UI Update
    const originalTimeline = [...localTimeline];
    setLocalTimeline(prev => 
      prev.map(item => 
        (item._id === stageIdentifier || item.stage === stageIdentifier) 
          ? { ...item, status: newStatus } 
          : item
      )
    );

    try {
      const token = localStorage.getItem('token');
      
      // We only need this call now because the Backend handles the global status sync
      await axios.patch(
        apiUrl(`/api/workers/${worker._id}/stage/${stageIdentifier}`),
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh data to get the backend-calculated global status (e.g., 'deployed' or 'processing')
      await fetchWorkerData();
    } catch (err) {
      alert('Update failed');
      setLocalTimeline(originalTimeline); 
      fetchWorkerData();
    } finally { setIsUpdating(false); }
  };

  const handleDeleteWorker = async () => {
    if (!window.confirm("Are you sure you want to delete this worker? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(apiUrl(`/api/workers/${worker._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      onNavigate('list');
    } catch (err) {
      alert('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !worker) return (
    <div className="h-[80vh] flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="text-slate-600 font-semibold mt-6">Syncing Worker Profile...</p>
    </div>
  );

  const displayCountry = worker.employerId?.country || "Nepal";
  const firstRejectedIndex = localTimeline.findIndex(item => item.status === 'rejected');
  const progress = Math.round((localTimeline.filter(s => s.status === 'completed').length / SCHEMA_STAGES.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="container mx-auto py-10 max-w-7xl space-y-8 px-4 animate-in fade-in duration-700">

        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('list')}
              className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{worker.name}</h1>
                <StatusBadge status={worker.status} />
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-wider">
                <Fingerprint className="h-4 w-4 text-indigo-500" /> ID: {worker._id.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-2 border-r border-slate-100 text-center hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Country</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getFlagEmoji(displayCountry)}</span>
                <span className="text-lg font-black text-slate-900">{displayCountry}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Button onClick={() => onNavigate('edit', worker)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 h-12">
                Update Details
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDeleteWorker} 
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border-none h-12 w-12 rounded-xl p-0 transition-all active:scale-90"
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-50 pb-4 bg-slate-50/30">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-600 uppercase tracking-tight">
                  <User className="h-4 w-4" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <InfoRow icon={<ShieldCheck size={16} />} label="Passport No" value={worker.passportNumber} isCopyable />
                <InfoRow icon={<Fingerprint size={16} />} label="Citizenship No" value={worker.citizenshipNumber || "N/A"} isCopyable />
                <InfoRow icon={<Calendar size={16} />} label="Date of Birth" value={worker.dob ? new Date(worker.dob).toLocaleDateString() : 'N/A'} />
                <InfoRow icon={<Phone size={16} />} label="Contact" value={worker.phoneNumber || worker.contact || "N/A"} />
                <InfoRow icon={<Mail size={16} />} label="Email" value={worker.email || "No Email"} />
                <InfoRow icon={<MapPin size={16} />} label="Address" value={worker.address || "N/A"} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] bg-[#0F172A] text-white overflow-hidden">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Employer Assignment</p>
                    <h3 className="text-xl text-white font-bold leading-tight">
                        {worker.employerId?.companyName || worker.employerId?.name || (
                            <span className="text-slate-500 italic flex items-center gap-2">
                                <AlertCircle size={18} /> Pending
                            </span>
                        )}
                    </h3>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Briefcase className="text-indigo-400 h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[11px]">Assigned Role</span>
                    <span className="font-bold text-indigo-300 bg-indigo-500/20 px-4 py-1.5 rounded-xl text-xs">
                      {worker.jobDemandId?.jobTitle || 'General Worker'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Pipeline Progress</span>
                      <span className="font-black text-white text-sm">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-200 overflow-hidden">
              <CardHeader className="px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <Clock className="text-indigo-500" /> Operational Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-none">
                      <TableHead className="pl-8 text-[10px] uppercase font-black text-slate-500">Step</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Status</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] uppercase font-black text-slate-500">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localTimeline.map((item, idx) => (
                      <TableRow key={item._id} className="hover:bg-slate-50 transition-colors border-slate-100">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 w-4">{idx + 1}</span>
                            <span className="font-bold text-slate-800 capitalize text-sm">{item.stage.replace(/-/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase border-none ${
                               item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                               item.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                               item.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <select
                            disabled={isUpdating || (firstRejectedIndex !== -1 && idx > firstRejectedIndex)}
                            value={item.status}
                            onChange={(e) => handleStatusChange(item._id || item.stage, e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-200 overflow-hidden">
              <CardHeader className="px-8 py-5 border-b border-slate-100">
                <CardTitle className="text-[12px] font-black text-slate-500 flex items-center gap-3 uppercase tracking-[0.1em]">
                  <FileText className="h-4 w-4 text-slate-400" /> Document Repository
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {worker.documents?.length > 0 ? (
                      worker.documents.map((doc, index) => (
                        <TableRow key={index} className="border-slate-100 hover:bg-slate-50">
                          <TableCell className="pl-8">
                            <p className="font-bold text-sm text-slate-900">{doc.name || 'Document'}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">{doc.category || 'General'}</p>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="sm" onClick={() => window.open(doc.url || doc.path, '_blank')} className="text-indigo-600 font-bold hover:bg-indigo-50">
                              View <Eye className="ml-2 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                        <TableRow>
                            <TableCell className="py-10 text-center text-slate-400 italic text-sm">No documents uploaded</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, isCopyable }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-sm font-bold text-slate-800 ${isCopyable ? 'text-indigo-600 cursor-pointer' : ''}`}>
        {value || "N/A"}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const variants = {
    deployed: "bg-emerald-600 text-white ring-4 ring-emerald-100/50",
    rejected: "bg-rose-600 text-white ring-4 ring-rose-100/50",
    processing: "bg-indigo-600 text-white ring-4 ring-indigo-100/50",
    pending: "bg-slate-200 text-slate-700 ring-4 ring-slate-100/50"
  };
  return (
    <Badge className={`${variants[s] || variants.pending} border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex gap-2 items-center shadow-md`}>
      {s === 'deployed' && <CheckCircle2 className="h-3 w-3" />}
      {status || 'PENDING'}
    </Badge>
  );
}