"use client";
import axios from 'axios';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2, Clock, ExternalLink, FileText,
  Fingerprint,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const getFlagEmoji = (countryName) => {
  if (!countryName) return "🌍";
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

export function WorkerDetailsPage({ worker: initialWorker, workerId, onNavigate }) {
  const [worker, setWorker] = useState(initialWorker || null);
  const [loading, setLoading] = useState(true);
  const [localTimeline, setLocalTimeline] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchWorkerData = useCallback(async () => {
    const id = workerId || initialWorker?._id;
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/workers/${id}`, {
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
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:5000/api/workers/${worker._id}/stage/${stageIdentifier}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setWorker(res.data.data);
    } catch (err) {
      alert('Update failed');
      fetchWorkerData();
    } finally { setIsUpdating(false); }
  };

  if (loading || !worker) return (
    <div className="h-[80vh] flex flex-col items-center justify-center bg-slate-50/50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-semibold mt-6">Syncing Worker Profile...</p>
    </div>
  );

  // Logic: Strictly pull country from the employer object
  const deployedCountry = worker.employerId?.country || "Processing";
  const progress = Math.round((localTimeline.filter(s => s.status === 'completed').length / SCHEMA_STAGES.length) * 100);

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20">
      <div className="container mx-auto py-10 max-w-7xl space-y-8 px-4 animate-in fade-in duration-700">

        {/* TOP NAVIGATION & PRIMARY INFO */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('list')}
              className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{worker.name}</h1>
                <StatusBadge status={worker.status} />
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-wider">
                <Fingerprint className="h-4 w-4" /> ID: {worker._id.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-2 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Country</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getFlagEmoji(deployedCountry)}</span>
                <span className="text-lg font-black text-slate-800">{deployedCountry}</span>
              </div>
            </div>
            <div className="px-6">
              <Button onClick={() => onNavigate('edit', worker)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-indigo-100">
                Update Details
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT: PERSONAL & EMPLOYMENT INFO */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-600 uppercase tracking-tighter">
                  <User className="h-4 w-4" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <InfoRow icon={<ShieldCheck size={16} />} label="Passport No" value={worker.passportNumber} isCopyable />
                <InfoRow icon={<Calendar size={16} />} label="Joined Date" value={new Date(worker.createdAt).toLocaleDateString()} />
                <InfoRow icon={<Phone size={16} />} label="Phone Number" value={worker.phone || "Not Provided"} />
                <InfoRow icon={<Mail size={16} />} label="Email Address" value={worker.email || "No Email"} />
                <InfoRow icon={<MapPin size={16} />} label="Current Address" value={worker.address || "N/A"} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Employer</p>
                    <p className="text-xl font-bold">{worker.employerId?.employerName || 'Pending Assignment'}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl"><Briefcase className="text-indigo-400" /></div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Designation</span>
                    <span className="font-bold text-indigo-300">{worker.jobDemandId?.jobTitle || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Work Progress</span>
                    <span className="font-bold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE: PIPELINE */}
          <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-3">
                <Clock className="text-indigo-500" /> Operational Pipeline
              </CardTitle>
              <Badge variant="outline" className="rounded-lg font-black text-[10px] text-slate-400 px-3">
                11 TOTAL STAGES
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/40">
                  <TableRow className="border-none">
                    <TableHead className="pl-8 text-[10px] uppercase font-black text-slate-400">Step</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-slate-400">Current Status</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] uppercase font-black text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localTimeline.map((item, idx) => (
                    <TableRow key={item._id} className="hover:bg-indigo-50/20 transition-colors border-slate-50">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
                          <span className="font-bold text-slate-700 capitalize text-sm">{item.stage.replace(/-/g, ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <select
                          disabled={isUpdating}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
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
        </div>

        {/* BOTTOM: DOCUMENTS */}
        <div className="mt-8">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 px-2">
            <FileText className="text-indigo-500" /> Digital Dossier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(worker.documents || []).map(doc => (
              <div key={doc._id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="min-w-[40px] h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <FileText size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">{doc.name}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-lg hover:bg-slate-100" onClick={() => window.open(`http://localhost:5000/${doc.path}`, '_blank')}>
                  <ExternalLink size={14} />
                </Button>
              </div>
            ))}
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
        <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">{icon}</div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
      </div>
      <span className={`text-sm font-bold text-slate-700 ${isCopyable ? 'bg-slate-50 px-2 py-0.5 rounded border border-slate-100' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const variants = {
    deployed: "bg-emerald-500 text-white ring-4 ring-emerald-50",
    rejected: "bg-rose-500 text-white ring-4 ring-rose-50",
    processing: "bg-amber-500 text-white ring-4 ring-amber-50",
    pending: "bg-slate-200 text-slate-600 ring-4 ring-slate-50"
  };
  return (
    <Badge className={`${variants[s] || variants.pending} border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex gap-2 items-center shadow-lg`}>
      {s === 'deployed' && <CheckCircle2 className="h-3 w-3" />}
      {status || 'PENDING'}
    </Badge>
  );
}