"use client";
import { 
    ArrowLeft, 
    Clock, 
    Download, 
    FileText, 
    ShieldCheck, 
    Timer, 
    Users, 
    ExternalLink,
    DollarSign,
    Calendar,
    Loader2 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { apiUrl } from '@/lib/api';

export function AdminJobDemandDetailsPage({ jobDemand: initialData, onNavigate }) {
    const [jobDemand, setJobDemand] = useState(initialData);
    const [loading, setLoading] = useState(false);

    // Helper to extract ID regardless of whether it's a string or MongoDB $oid object
    const getNormalizedId = (data) => data?._id?.$oid || data?._id;

    useEffect(() => {
        const fetchFullDetails = async () => {
            const id = getNormalizedId(initialData);
            if (!id || id === "undefined") return;
            
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                
                // Pointing to absolute Backend URL + Adding Auth Headers
                const response = await fetch(apiUrl(`/api/job-demands/${id}`), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    setJobDemand(result.data);
                } else {
                    console.error("API Error:", result.error);
                }
            } catch (err) { 
                console.error("Fetch Network Error:", err); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchFullDetails();
    }, [initialData?._id]);

    // Loading State
    if (loading && !jobDemand?.workers) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-gray-500 font-medium font-mono text-xs uppercase tracking-widest">Synchronizing Demand Data...</p>
            </div>
        );
    }

    if (!jobDemand) return (
        <div className="p-8 text-center text-gray-500">Demand data not available.</div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* 1. Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onNavigate('list')} 
                        className="h-10 w-10 p-0 rounded-xl border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-100 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{jobDemand.jobTitle}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                                {jobDemand.employerId?.employerName || jobDemand.employerName || 'Direct Client'}
                            </p>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs font-medium text-gray-400 font-mono tracking-tighter">
                                REF: {getNormalizedId(jobDemand)?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Fulfillment Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Required', val: jobDemand.requiredWorkers, icon: Users, bg: 'bg-blue-50', text: 'text-blue-600' },
                            { label: 'Assigned', val: jobDemand.workers?.length || 0, icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                            { label: 'Remaining', val: Math.max(0, (jobDemand.requiredWorkers || 0) - (jobDemand.workers?.length || 0)), icon: Timer, bg: 'bg-orange-50', text: 'text-orange-600' }
                        ].map((item, i) => (
                            <Card key={i} className="border-none shadow-sm bg-white ring-1 ring-gray-100">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`p-2.5 rounded-lg ${item.bg} ${item.text}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 leading-none">{item.val}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{item.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Description */}
                    <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-gray-50 px-6 py-4">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="text-gray-400" size={16}/> Job Requirements & Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Skills & Expertise</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {jobDemand.skills?.map((s, i) => (
                                        <Badge key={i} className="bg-gray-100 text-gray-600 border-none px-2.5 py-0.5 font-bold text-[10px] uppercase">
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap italic border-l-2 border-blue-50 pl-4">
                                {jobDemand.description || 'No detailed description provided.'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Workers Table - THIS SHOWS YOUR ASSIGNED CANDIDATES */}
                    <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="px-6 py-4 border-b border-gray-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-gray-800">Linked Candidates</CardTitle>
                            <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] px-2 font-bold">
                                {jobDemand.workers?.length || 0} Assigned
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6 py-3 text-[10px] uppercase font-bold text-gray-400">Worker Name</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-gray-400">Current Stage</TableHead>
                                        <TableHead className="text-right pr-6 text-[10px] uppercase font-bold text-gray-400">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobDemand.workers?.length > 0 ? jobDemand.workers.map((w) => (
                                        <TableRow key={w._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                                            <TableCell className="pl-6 py-3">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {w.name || w.fullName || "Unnamed Worker"}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                    {w.passportNumber || 'No Passport Info'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] uppercase border-gray-200 text-gray-500 font-bold px-2 py-0">
                                                    {w.currentStage?.replace(/-/g, ' ') || 'Evaluation'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className={`h-2 w-2 rounded-full inline-block ${w.status === 'deployed' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-gray-400 text-sm italic">
                                                No candidates currently assigned to this demand.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-2xl bg-white">
                        <CardHeader className="px-6 py-4 border-b border-gray-50">
                            <CardTitle className="text-sm font-bold text-gray-800">Contract Terms</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-3">
                                {[
                                    { label: 'Employer', val: jobDemand.employerId?.employerName || 'Direct', icon: ExternalLink, color: 'text-gray-400' },
                                    { label: 'Salary', val: jobDemand.salary || 'N/A', icon: DollarSign, color: 'text-blue-600' },
                                    { label: 'Duration', val: jobDemand.tenure || 'N/A', icon: Clock, color: 'text-gray-400' },
                                    { label: 'Deadline', val: jobDemand.deadline ? new Date(jobDemand.deadline).toLocaleDateString() : 'N/A', icon: Calendar, color: 'text-gray-400' }
                                ].map((meta, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium">{meta.label}</span>
                                        <span className={`font-bold flex items-center gap-1.5 ${meta.color === 'text-blue-600' ? 'text-blue-600 font-mono tracking-tighter' : 'text-gray-900'}`}>
                                            {meta.val} {meta.label === 'Employer' && <meta.icon size={12}/>}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {jobDemand.documents?.length > 0 && (
                                <div className="pt-6 border-t border-gray-50">
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Supporting Files</h5>
                                    <div className="space-y-2">
                                        {jobDemand.documents.map((doc, i) => (
                                            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 transition-all group">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                    <span className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]">{doc.name}</span>
                                                </div>
                                                <Download size={14} className="text-gray-300 group-hover:text-blue-600" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}