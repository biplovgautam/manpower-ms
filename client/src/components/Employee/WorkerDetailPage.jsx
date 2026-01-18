import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  UserCheck
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function WorkerDetailsPage({ workerId, onNavigate }) {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null);

  const fetchWorker = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/workers/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorker(res.data.data);
    } catch (err) {
      console.error("Error fetching worker details", err);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (workerId) fetchWorker();
  }, [workerId, fetchWorker]);

  const updateStage = async (stageId, newStatus) => {
    setIsUpdating(stageId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:5000/api/workers/${worker._id}/stage/${stageId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setWorker(res.data.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert("Failed to update status: " + errorMsg);
    } finally {
      setIsUpdating(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50/50">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading worker dossier...</p>
      </div>
    </div>
  );

  if (!worker) return <div className="p-20 text-center text-slate-500">Worker profile not found.</div>;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'deployed': return 'bg-emerald-500 text-white';
      case 'rejected': return 'bg-rose-500 text-white';
      case 'processing': return 'bg-blue-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const completedCount = worker.stageTimeline.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / worker.stageTimeline.length) * 100);

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* TOP NAVIGATION & ACTIONS */}
      <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-4 z-10">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
            onClick={() => onNavigate('list')}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
              <Badge className={`${getStatusColor(worker.status)} border-none px-3 py-1 text-[10px] uppercase tracking-wider`}>
                {worker.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-medium">
              <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {worker.passportNumber}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {worker.country}</span>
              <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" /> {worker.subAgentId?.name || 'Direct'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => onNavigate('edit', worker)}>
            Edit Profile
          </Button>
          <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg">
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* SIDEBAR: PROGRESS & DETAILS */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-none shadow-md ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-1" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Pipeline Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-3">
                <span className="text-4xl font-black text-indigo-600">{progressPercent}%</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {completedCount} / 11 STAGES
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" /> Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Employer</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{worker.employerId?.employerName || 'TBD'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Job Role</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{worker.jobDemandId?.jobTitle || 'N/A'}</p>
                </div>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-xs text-slate-500">Contact Number</span>
                <span className="text-sm font-mono font-medium">{worker.phoneNumber || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MAIN: 11 STAGE TIMELINE */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-none shadow-md ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4 px-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-800">Operational Timeline</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50">
                STRICT COMPLIANCE MODE
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {worker.stageTimeline.map((item, index) => {
                  const isLast = index === worker.stageTimeline.length - 1;
                  const isCompleted = item.status === 'completed';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item._id}
                      className={`group p-5 flex items-center justify-between transition-all border-b border-slate-100 last:border-0 hover:bg-slate-50/80 ${isRejected ? 'bg-rose-50/30' : ''}`}
                    >
                      <div className="flex items-center gap-5">
                        {/* Status Circle */}
                        <div className="relative">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' :
                              isRejected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300'
                            }`}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isRejected ? <AlertCircle className="h-5 w-5" /> : index + 1}
                          </div>
                          {!isLast && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-100 group-hover:bg-slate-200" />}
                        </div>

                        <div>
                          <p className={`text-sm font-bold capitalize ${isCompleted ? 'text-slate-900' : 'text-slate-600'}`}>
                            {item.stage.replace(/-/g, ' ')}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3" /> {item.date ? new Date(item.date).toLocaleDateString('en-GB') : 'PENDING'}
                            </span>
                            {item.notes && (
                              <Badge variant="secondary" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-100">Has Notes</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {isUpdating === item._id && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                        <select
                          disabled={isUpdating}
                          value={item.status}
                          onChange={(e) => updateStage(item._id, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-3 py-1.5 border shadow-sm outline-none cursor-pointer transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                            }`}
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Complete Stage</option>
                          <option value="rejected">Reject / Block</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}