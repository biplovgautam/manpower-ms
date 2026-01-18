"use client";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    DollarSign, // Added for Tenure
    Download,
    Edit3,
    FileText,
    Loader2,
    Timer,
    Trash2,
    Users,
    Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function JobDemandDetailsPage({ jobDemand: initialData, onNavigate, onDelete }) {
    const [jobDemand, setJobDemand] = useState(initialData);
    const [loading, setLoading] = useState(false);

    const getNormalizedId = (data) => data?._id?.$oid || data?._id;

    useEffect(() => {
        const fetchFullDetails = async () => {
            const id = getNormalizedId(initialData);
            if (!id || id === "undefined") return;

            setLoading(true);
            try {
                const response = await fetch(`/api/job-demands/${id}`);
                if (!response.ok) return;

                const result = await response.json();
                if (result.success) {
                    setJobDemand(result.data);
                }
            } catch (error) {
                console.error("Fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFullDetails();
    }, [initialData?._id]);

    if (!jobDemand) return null;

    const assignedWorkers = jobDemand.workers || [];
    const skills = jobDemand.skills || [];
    const documents = jobDemand.documents || []; // Accessing documents array

    const formatDate = (dateInput) => {
        if (!dateInput) return 'Not Specified';
        const date = dateInput.$date ? new Date(dateInput.$date) : new Date(dateInput);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'deployed':
            case 'completed': return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-700 hover:bg-red-100';
            default: return 'bg-amber-50 text-amber-700 hover:bg-amber-100';
        }
    };

    const handleDelete = () => {
        const id = getNormalizedId(jobDemand);
        if (window.confirm("Are you sure you want to delete this job demand?")) {
            onDelete(id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-16 px-6">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between mb-12">
                <button
                    onClick={() => onNavigate('list')}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <div className="p-2.5 rounded-xl border bg-card hover:bg-accent transition-all group-hover:border-primary/20">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">Back to Job Demands</span>
                </button>

                <div className="flex items-center gap-6">
                    {loading && (
                        <div className="flex items-center gap-2 text-primary">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm font-medium">Syncing...</span>
                        </div>
                    )}
                    <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/20">
                        REF: {getNormalizedId(jobDemand)?.slice(-8).toUpperCase()}
                    </Badge>

                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className="rounded-2xl shadow-lg h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 flex items-center gap-3"
                            onClick={() => onNavigate('edit', jobDemand)}
                            disabled={loading}
                        >
                            <Edit3 className="h-5 w-5" />
                            <span>Edit</span>
                        </Button>
                        <Button
                            size="lg"
                            className="rounded-2xl shadow-lg h-12 px-8 text-base font-semibold bg-red-600 text-white hover:bg-red-700 flex items-center gap-3"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="h-5 w-5" />
                            <span>Delete</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <Card className="border-0 shadow-xl ring-1 ring-black/5 overflow-hidden">
                        <CardHeader className="pb-8">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 rounded-3xl bg-primary/10 shadow-lg ring-1 ring-primary/20">
                                        <Briefcase className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{jobDemand.jobTitle}</h1>
                                        <p className="text-lg text-muted-foreground">
                                            Partnered with <span className="font-semibold text-foreground">{jobDemand.employerId?.employerName || 'Direct Client'}</span>
                                        </p>
                                    </div>
                                </div>
                                <Badge className="px-6 py-2 text-base font-semibold rounded-full" variant="default">
                                    {jobDemand.status?.toUpperCase() || 'OPEN'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mt-10">
                                <div className="group p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 ring-1 ring-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-primary/20"><DollarSign className="h-7 w-7 text-primary" /></div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Monthly Salary</p>
                                            <p className="text-2xl font-bold text-foreground mt-1">{jobDemand.salary || 'Competitive'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-indigo-600/10 ring-1 ring-indigo-500/20">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-indigo-500/20"><Users className="h-7 w-7 text-indigo-600" /></div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Positions</p>
                                            <p className="text-2xl font-bold text-foreground mt-1">{jobDemand.requiredWorkers || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        <CardContent className="pt-10 space-y-14">
                            {/* Skills Section */}
                            {skills.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Wrench className="h-5 w-5 text-primary" /> Required Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="px-4 py-2 text-sm font-medium rounded-xl bg-primary/5 text-primary border-primary/20">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description Section */}
                            {jobDemand.description && (
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        <FileText className="h-5 w-5 text-primary" /> Job Description
                                    </h3>
                                    <blockquote className="pl-6 border-l-4 border-primary/30 italic text-lg leading-relaxed text-foreground/90">
                                        "{jobDemand.description}"
                                    </blockquote>
                                </div>
                            )}

                            {/* NEW: Documents Section */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    <FileText className="h-5 w-5 text-primary" /> Documentation
                                </h3>
                                {documents.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {documents.map((doc, index) => (
                                            <a
                                                key={index}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 rounded-2xl border bg-card hover:bg-accent transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-medium text-sm truncate max-w-[150px]">{doc.name}</span>
                                                </div>
                                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No documents uploaded for this demand.</p>
                                )}
                            </div>

                            {/* Workers Table Section */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-semibold text-foreground">Assigned Candidates ({assignedWorkers.length})</h3>
                                {assignedWorkers.length > 0 ? (
                                    <div className="rounded-2xl border overflow-hidden shadow-sm ring-1 ring-black/5">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Candidate</TableHead>
                                                    <TableHead className="font-semibold">Current Stage</TableHead>
                                                    <TableHead className="text-right font-semibold">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assignedWorkers.map((worker) => (
                                                    <TableRow key={worker._id} className="hover:bg-primary/5 transition-colors">
                                                        <TableCell>
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary ring-2 ring-primary/20">
                                                                    {(worker.fullName || worker.name || 'W')[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-foreground">{worker.fullName || worker.name}</p>
                                                                    <p className="text-sm text-muted-foreground">Passport: {worker.passportNumber || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                                                                <span className="font-medium capitalize">{(worker.currentStage || 'evaluation').replace(/-/g, ' ')}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={`px-4 py-1.5 font-semibold rounded-lg ${getStatusVariant(worker.status)}`}>
                                                                {worker.status?.toUpperCase() || 'PENDING'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center border-2 border-dashed rounded-3xl">
                                        <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                        <p className="text-muted-foreground font-medium">No candidates assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-8">
                    <Card className="border-0 shadow-xl ring-1 ring-black/5 sticky top-8">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Job Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-6">
                                {/* NEW: Tenure Field */}
                                <div className="flex items-center justify-between group">
                                    <span className="flex items-center gap-3 text-muted-foreground font-medium">
                                        <Timer className="h-5 w-5 text-orange-500" />
                                        Contract Tenure
                                    </span>
                                    <span className="font-bold text-foreground bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 italic">
                                        {jobDemand.tenure || 'Not Specified'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3 text-muted-foreground font-medium">
                                        <Calendar className="h-5 w-5 text-primary" /> Deadline
                                    </span>
                                    <span className="font-semibold text-foreground">{formatDate(jobDemand.deadline)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3 text-muted-foreground font-medium">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Published
                                    </span>
                                    <span className="font-semibold text-foreground">{formatDate(jobDemand.createdAt)}</span>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Employer Info</p>
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 ring-1 ring-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Briefcase className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-foreground truncate">
                                                {jobDemand.employerId?.employerName || 'Direct Client'}
                                            </p>
                                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-tight">Verified Employer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}