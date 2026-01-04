"use client";

import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    User,
    UserCheck
} from 'lucide-react';

import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';

export function WorkerDetailsPage({ worker, onBack }) {
    if (!worker) return null;

    const docs = Array.isArray(worker.documents) ? worker.documents : [];
    const timeline = Array.isArray(worker.stageTimeline) ? worker.stageTimeline : [];
    const approvedDocs = docs.filter(d => d.status?.toLowerCase() === 'approved').length;

    const formatDate = (dateString) => {
        if (!dateString) return "Not Set";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-6 lg:p-10 space-y-6 text-slate-700 font-sans animate-in fade-in duration-500">

            {/* --- HEADER --- */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-100">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{worker.name}</h1>
                        <p className="text-lg text-slate-500 font-medium capitalize">
                            {worker.country} • Passport: <span className="text-slate-900 font-bold">{worker.passportNumber}</span>
                        </p>
                    </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-6 py-2 text-sm font-black uppercase tracking-widest rounded-xl">
                    {worker.status || 'Active'}
                </Badge>
            </div>

            <div className="grid grid-cols-12 gap-6">

                {/* --- LEFT SIDE: THE PEOPLE (Worker & Agent) --- */}
                <div className="col-span-12 lg:col-span-5 space-y-6">

                    {/* Personal Information */}
                    <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900 py-4 px-6">
                            <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-[0.2em] flex items-center gap-3">
                                <User size={18} /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 bg-white">
                            <BigInfoItem label="Email Address" value={worker.email} icon={<Mail size={18} />} />
                            <BigInfoItem label="Phone / Contact" value={worker.contact} icon={<Phone size={18} />} />
                            <BigInfoItem label="Current Address" value={worker.address} icon={<MapPin size={18} />} />
                            <BigInfoItem label="Date of Birth" value={formatDate(worker.dob)} icon={<Calendar size={18} />} />
                        </CardContent>
                    </Card>

                    {/* SUB AGENT CARD - Highlighted for visibility */}
                    <Card className="border-2 border-indigo-100 shadow-md rounded-2xl overflow-hidden bg-indigo-50/30">
                        <CardHeader className="bg-indigo-600 py-4 px-6">
                            <CardTitle className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <UserCheck size={18} /> Sub-Agent Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                    {(worker.subAgentId?.name || "D")[0]}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Assigned Sub-Agent</p>
                                    <p className="text-xl font-extrabold text-indigo-700">
                                        {worker.subAgentId?.name || "Direct / No Agent"}
                                    </p>
                                    <p className="text-sm text-slate-500 font-medium">Internal Partner</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT SIDE: THE JOB & PROGRESS --- */}
                <div className="col-span-12 lg:col-span-7 space-y-6">

                    {/* Job Details */}
                    <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white border-b border-slate-100 py-4 px-6">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Briefcase size={18} /> Employment Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 bg-white grid grid-cols-2 gap-8">
                            <BigInfoItem label="Employer" value={worker.employerId?.name || worker.employerId?.employerName} valueClass="text-blue-600 font-black text-lg" />
                            <BigInfoItem label="Trade / Job" value={worker.jobDemandId?.title || worker.jobDemandId?.jobTitle} valueClass="text-lg font-bold" />
                            <BigInfoItem label="Current Stage" value={worker.currentStage?.replace(/-/g, ' ')} valueClass="capitalize text-indigo-600 font-bold text-lg" />
                            <BigInfoItem label="Approved Docs" value={`${approvedDocs} / ${docs.length}`} valueClass="text-emerald-600 font-bold text-lg" />
                        </CardContent>
                    </Card>

                    {/* Timeline & Documents - Side by Side to reduce scroll */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-md rounded-2xl overflow-hidden h-[350px] flex flex-col">
                            <CardHeader className="py-4 px-6 border-b border-slate-50 bg-white">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 overflow-y-auto flex-grow bg-white">
                                {timeline.map((s, i) => (
                                    <TimelineItem key={i} title={s.stage?.replace(/-/g, ' ')} status={s.status} isLast={i === timeline.length - 1} isCurrent={worker.currentStage === s.stage} />
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md rounded-2xl overflow-hidden h-[350px] flex flex-col">
                            <CardHeader className="py-4 px-6 border-b border-slate-50 bg-white">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Internal Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow bg-slate-50/30 overflow-y-auto italic text-slate-600 text-base leading-relaxed">
                                {worker.notes || "No case notes recorded for this worker."}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Compact Document Table */}
                    <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto bg-white">
                            <Table>
                                <TableHeader className="bg-slate-900 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="text-white font-bold text-xs uppercase px-6 h-12">Document</TableHead>
                                        <TableHead className="text-white font-bold text-xs uppercase h-12 text-center">Status</TableHead>
                                        <TableHead className="text-white font-bold text-xs uppercase h-12 text-right px-6">View</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {docs.map((doc, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50 border-slate-50">
                                            <TableCell className="px-6 py-4">
                                                <p className="text-base font-bold text-slate-800 leading-none">{doc.category}</p>
                                                <p className="text-xs text-slate-400 mt-1 uppercase font-medium">{doc.name}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`px-3 py-1 text-[10px] font-bold uppercase ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {doc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                {doc.path && (
                                                    <a href={`http://localhost:5000/${doc.path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-10 w-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                        <ExternalLink size={18} />
                                                    </a>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

{/* --- REFINED LARGE COMPONENTS --- */ }

function BigInfoItem({ label, value, icon, valueClass = "text-slate-900 font-bold" }) {
    return (
        <div className="flex items-start gap-4">
            {icon && <div className="mt-1 text-slate-300">{icon}</div>}
            <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{label}</p>
                <p className={`text-base tracking-tight ${valueClass}`}>{value || "—"}</p>
            </div>
        </div>
    );
}

function TimelineItem({ title, status, isLast, isCurrent }) {
    const isDone = status === 'completed';
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center 
                    ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200'}`}>
                    {isDone ? <CheckCircle2 size={12} strokeWidth={3} /> : isCurrent ? <Clock size={12} strokeWidth={3} /> : <Circle size={8} className="text-slate-200" />}
                </div>
                {!isLast && <div className="w-[2px] h-8 bg-slate-100" />}
            </div>
            <div className="pb-6">
                <p className={`text-sm font-extrabold uppercase tracking-wide ${isCurrent ? 'text-indigo-600' : 'text-slate-800'}`}>{title}</p>
                <p className="text-xs font-bold text-slate-400 capitalize">{status.replace(/-/g, ' ')}</p>
            </div>
        </div>
    );
}