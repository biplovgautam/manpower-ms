"use client";

import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    IdCard,
    Mail,
    MapPin,
    Phone,
    User
} from 'lucide-react';

// Standard UI component imports - ensure these files exist in your project
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
    // Safety check to prevent crashes if worker data hasn't loaded yet
    if (!worker) return null;

    // Data normalization for arrays coming from backend
    const docs = Array.isArray(worker.documents) ? worker.documents : [];
    const timeline = Array.isArray(worker.stageTimeline) ? worker.stageTimeline : [];
    const approvedDocs = docs.filter(d => d.status?.toLowerCase() === 'approved').length;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Top Navigation & Title Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white rounded-full border border-slate-200 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
                        <p className="text-xs text-slate-500 font-medium">Worker Profile • {worker.passportNumber || "N/A"}</p>
                    </div>
                </div>
                <Badge className="bg-blue-600 text-white border-none px-4 py-1 text-xs font-bold uppercase">
                    {worker.status || 'PROCESSING'}
                </Badge>
            </div>

            {/* Top Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Personal Information */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <ProfileItem icon={<Mail size={14} />} label="Email" value={worker.email} />
                        <ProfileItem icon={<Phone size={14} />} label="Contact" value={worker.contact} />
                        <ProfileItem icon={<Calendar size={14} />} label="Date of Birth" value={formatDate(worker.dob)} />
                        <ProfileItem icon={<MapPin size={14} />} label="Address" value={worker.address} />
                        <ProfileItem icon={<IdCard size={14} />} label="Passport" value={worker.passportNumber} />
                    </CardContent>
                </Card>

                {/* 2. Assignment Details - UPDATED FOR BACKEND NAMES */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assignment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Shows Employer Name from populated object */}
                            <ProfileItem
                                icon={<Building2 size={14} />}
                                label="Employer"
                                value={worker.employerId?.name || "Unassigned"}
                            />
                            {/* Shows Job Title from populated object */}
                            <ProfileItem
                                icon={<Briefcase size={14} />}
                                label="Job Demand"
                                value={worker.jobDemandId?.title || "N/A"}
                            />
                            {/* Formats stage name (e.g. document-collection) */}
                            <ProfileItem
                                icon={<Clock size={14} />}
                                label="Current Stage"
                                value={worker.currentStage?.replace(/-/g, ' ')}
                                color="text-blue-600"
                            />
                            <ProfileItem
                                icon={<CheckCircle2 size={14} />}
                                label="Visa Status"
                                value={worker.status || "Pending"}
                                color="text-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Progress Overview Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatusTile label="Active Stage" value="Active" color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
                    <StatusTile label="Documents" value={docs.length} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
                    <StatusTile label="Approved" value={`${approvedDocs}/${docs.length}`} color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
                    <StatusTile label="Added On" value={formatDate(worker.createdAt)} color="text-slate-600" bg="bg-slate-50" border="border-slate-100" />
                </div>
            </div>

            {/* Middle Section: Timeline & Admin Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Processing Timeline */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Processing Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {timeline.length > 0 ? timeline.map((s, i) => (
                                <TimelineItem
                                    key={i}
                                    title={s.name || s.title}
                                    date={formatDate(s.date)}
                                    status={s.status}
                                    desc={s.description}
                                    isLast={i === timeline.length - 1}
                                />
                            )) : (
                                <div className="text-center py-4 text-slate-400 text-xs italic">No timeline history recorded.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Management Info */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Management Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <ProfileItem icon={<User size={14} />} label="Managed By" value={worker.createdBy?.name || "System Admin"} />
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Entry</p>
                                <p className="text-sm font-semibold text-slate-900">{formatDate(worker.createdAt)}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Admin Notes</p>
                            <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100 min-h-[120px]">
                                {worker.notes || "No administrative notes provided for this worker profile."}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Worker Documents Table */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Worker Documents</CardTitle>
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">
                        {approvedDocs}/{docs.length} Approved
                    </span>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold px-6">Document Type</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold">File Name</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-right px-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length > 0 ? docs.map((doc, i) => (
                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 font-bold text-slate-700 text-xs flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        {doc.name}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs italic">{doc.fileName || "file_not_named.pdf"}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-[9px] px-2 py-0 border-none ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {doc.status?.toUpperCase() || 'PENDING'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <a href={doc.fileUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                                            <ExternalLink size={14} />
                                        </a>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-sm italic">
                                        No documents uploaded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Helper Components ---

function ProfileItem({ icon, label, value, color = "text-slate-700" }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 tracking-tight">
                {icon} {label}
            </p>
            <p className={`text-sm font-bold truncate capitalize ${color}`}>{value || 'Contact via phone'}</p>
        </div>
    );
}

function StatusTile({ label, value, color, bg, border }) {
    return (
        <div className={`${bg} ${border} border rounded-xl p-5 flex flex-col items-center justify-center space-y-1 shadow-sm`}>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{label}</p>
        </div>
    );
}

function TimelineItem({ title, date, status, desc, isLast }) {
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';

    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white z-10 
                    ${isCompleted ? 'border-emerald-500' : isCurrent ? 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-slate-200'}`}>
                    {isCompleted ? <CheckCircle2 className="text-emerald-500" size={12} /> :
                        isCurrent ? <Clock className="text-blue-500" size={12} /> :
                            <Circle className="text-slate-200" size={12} />}
                </div>
                {!isLast && <div className="w-px h-full bg-slate-100 -mt-1" />}
            </div>
            <div className="pb-6">
                <div className="flex items-center gap-3">
                    <p className={`text-xs font-bold uppercase tracking-tight ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{date}</span>
                </div>
                {desc && <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{desc}</p>}
                {isCurrent && <p className="text-[10px] text-blue-500 font-bold mt-1 italic">Current Processing Step</p>}
            </div>
        </div>
    );
}