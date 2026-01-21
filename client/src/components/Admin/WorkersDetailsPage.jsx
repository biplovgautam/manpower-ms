"use client";

import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    FileText,
    Mail,
    MapPin,
    Navigation,
    Phone,
    PlaneTakeoff,
    ShieldCheck,
    User,
    UserCheck
} from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const formatAuditDate = (dateString) => {
    if (!dateString) return { date: "—", time: "" };
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
};

export function WorkerDetailsPage({ worker, onBack }) {
    if (!worker) return null;

    const workerName = worker.name || "Unknown Worker";
    const employerName = worker.employerId?.employerName || worker.employerId?.companyName || worker.employerId?.name || "Direct Selection";
    const subAgentName = worker.subAgentId?.name || "Self-Sourced";
    const jobTitle = worker.jobDemandId?.jobTitle || "General Role";

    const totalStages = 11;
    const destination = worker.employerId?.country || "Processing...";
    const origin = worker.country || "Nepal";
    const docs = worker.documents || [];

    const timeline = worker.stageTimeline || [];
    const completedStages = timeline.filter(t => t.status === 'completed').length;
    const progressPercentage = Math.round((completedStages / totalStages) * 100);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6 text-slate-900 font-sans">

            {/* HEADER & BACK BUTTON */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-200 group">
                    <ArrowLeft size={20} className="text-slate-500 group-hover:text-slate-900" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Worker Profile</h1>
            </div>

            {/* TOP SECTION: PERSONAL INFORMATION SUMMARY */}
            <div className="grid grid-cols-12 gap-6">
                <Card className="col-span-12 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <User size={40} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-black tracking-tight">{workerName}</h2>
                                    <Badge className="bg-emerald-400/20 text-emerald-400 border-emerald-400/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                        {worker.status}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><FileText size={14} /> Passport: {worker.passportNumber}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {origin}</span>
                                    <span className="flex items-center gap-1 text-emerald-400"><Clock size={14} /> {progressPercentage}% Processed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black opacity-50 uppercase mb-1">Current Phase</p>
                                <p className="text-sm font-bold text-emerald-400 capitalize">{worker.currentStage?.replace(/-/g, ' ') || 'Initiating'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                        <ContactItem icon={<Mail />} label="Email Address" value={worker.email} />
                        <ContactItem icon={<Phone />} label="Phone Number" value={worker.contact} />
                        <ContactItem icon={<Calendar />} label="Date of Birth" value={worker.dob ? new Date(worker.dob).toLocaleDateString() : null} />
                        <ContactItem icon={<MapPin />} label="Permanent Address" value={worker.address} />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-12 gap-6">

                {/* LEFT COLUMN: PROFESSIONAL INFO & DOCUMENTS (SWAPPED) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Origin/Destination Card */}
                    <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-700 text-white overflow-hidden relative min-h-[140px] flex items-center">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <PlaneTakeoff size={80} />
                        </div>
                        <CardContent className="p-8 relative z-10 w-full">
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-2xl font-black">{origin}</p>
                                    <p className="text-[9px] uppercase opacity-50 font-bold">Origin</p>
                                </div>
                                <div className="flex-grow flex flex-col items-center px-4">
                                    <div className="w-full border-t-2 border-dashed border-white/30 relative">
                                        <Navigation size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 rotate-90 text-emerald-300" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-300">{destination}</p>
                                    <p className="text-[9px] uppercase opacity-50 font-bold">Destination</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employer and Agent Stack */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Employer</p>
                                <p className="text-md font-black text-slate-900 leading-tight">{employerName}</p>
                                <p className="text-[11px] font-bold text-blue-500 uppercase">{jobTitle}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                            <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sub-Agent</p>
                                <p className="text-md font-black text-slate-900 leading-tight">{subAgentName}</p>
                                <p className="text-[11px] font-bold text-purple-500 uppercase">Recruitment Partner</p>
                            </div>
                        </div>
                    </div>

                    {/* Documents Repository (Simplified for Sidebar) */}
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <ShieldCheck size={18} className="text-slate-400" /> Documents
                            </h3>
                            <Badge className="bg-slate-200 text-slate-700 border-none text-[10px] font-black">{docs.length}</Badge>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {docs.length > 0 ? docs.map((doc, i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate">{doc.name || "Untitled"}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.category || 'Other'}</p>
                                    </div>
                                    {doc.path && (
                                        <a href={`http://localhost:5000/${doc.path}`} target="_blank" rel="noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase">No files</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: TIMELINE (SWAPPED) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} /> Stage Transition Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-0 relative">
                                {timeline.map((s, i) => {
                                    const { date, time } = formatAuditDate(s.date);
                                    const isDone = s.status === 'completed';
                                    const isCurrent = worker.currentStage === s.stage;

                                    return (
                                        <div key={i} className="flex gap-6 group">
                                            {/* TIMESTAMP COLUMN */}
                                            <div className="w-28 pt-1 text-right shrink-0">
                                                <p className={`text-[11px] font-black transition-colors ${isDone ? 'text-slate-900' : 'text-slate-300'}`}>
                                                    {date}
                                                </p>
                                                <p className={`text-[10px] font-bold ${isDone ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                    {time}
                                                </p>
                                            </div>

                                            {/* PROGRESS LINE */}
                                            <div className="flex flex-col items-center">
                                                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                    isCurrent ? 'bg-indigo-600 border-indigo-600 text-white scale-110 z-10 shadow-lg shadow-indigo-200' :
                                                        'bg-white border-slate-200 text-slate-200'
                                                    }`}>
                                                    {isDone ? <CheckCircle2 size={16} strokeWidth={3} /> : <Circle size={6} fill="currentColor" />}
                                                </div>
                                                {i !== timeline.length - 1 && (
                                                    <div className={`w-[2px] h-16 transition-colors ${isDone ? 'bg-emerald-100' : 'bg-slate-50'}`} />
                                                )}
                                            </div>

                                            {/* STAGE DETAILS */}
                                            <div className="pb-10">
                                                <p className={`text-sm font-black uppercase tracking-wider leading-none mb-2 ${isCurrent ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                    {s.stage.replace(/-/g, ' ')}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border transition-all ${isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                        }`}>
                                                        {s.status}
                                                    </span>
                                                    {isDone && <p className="text-[10px] font-bold text-slate-400 italic">Transition Verified</p>}
                                                </div>
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

function ContactItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl shrink-0">
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 truncate">{value || "—"}</p>
            </div>
        </div>
    );
}