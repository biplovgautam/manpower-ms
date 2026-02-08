"use client";
import {
    ArrowUpRight,
    Briefcase,
    Clock,
    Filter,
    LayoutDashboard,
    Search,
    Target,
    Users,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../ui/Card';
import { Input } from '../ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

export function AdminJobDemandListPage({ jobDemands = [], onNavigate, isLoading }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = useMemo(() => {
        return jobDemands.filter((jd) => {
            const jobTitle = jd.jobTitle || '';
            const employer = jd.employerId?.employerName || jd.employerName || '';
            return jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   employer.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [jobDemands, searchTerm]);

    // Stats calculation
    const activeCount = jobDemands.filter(j => j.status?.toLowerCase() === 'open').length;
    const totalRequired = jobDemands.reduce((acc, curr) => acc + (Number(curr.requiredWorkers) || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Job Demands</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Global Demand Oversight & Fulfillment Tracking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex border-gray-200">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>
                </div>
            </div>

            {/* 2. Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Demands</p>
                            <p className="text-2xl font-bold text-gray-900">{jobDemands.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Active Jobs</p>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-600 rounded-xl text-white">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Goal Openings</p>
                            <p className="text-2xl font-bold text-gray-900">{totalRequired}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                <CardHeader className="bg-white border-b px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Demand Inventory
                        </CardTitle>
                        <div className="relative w-full sm:w-96 group">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Search by title or employer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="py-4 pl-6 text-xs uppercase font-bold text-gray-500">Position & Client</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 text-center">Fulfillment</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Deadline</TableHead>
                                    <TableHead className="text-right pr-6 text-xs uppercase font-bold text-gray-500">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center text-gray-400">Loading demands...</TableCell>
                                    </TableRow>
                                ) : filtered.length > 0 ? (
                                    filtered.map((jd) => {
                                        const assigned = jd.workers?.length || 0;
                                        const required = jd.requiredWorkers || 0;
                                        const percent = required > 0 ? (assigned / required) * 100 : 0;
                                        
                                        // Specific Status Logic
                                        const isFull = assigned >= required && required > 0;
                                        const isExpired = jd.deadline && new Date(jd.deadline) < new Date();

                                        return (
                                            <TableRow
                                                key={jd._id}
                                                className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50"
                                                onClick={() => onNavigate('details', jd)}
                                            >
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isFull ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                            {isFull ? <CheckCircle size={18} /> : <Briefcase size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {jd.jobTitle}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 uppercase">
                                                                {jd.employerId?.employerName || jd.employerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                                        <span className={`text-[11px] font-bold ${isFull ? 'text-emerald-600' : 'text-gray-700'}`}>
                                                            {assigned} / {required} {isFull && " (FULL)"}
                                                        </span>
                                                        <div className="h-1 w-20 bg-gray-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all ${isFull ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                                                                style={{ width: `${Math.min(percent, 100)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge
                                                            variant={jd.status?.toLowerCase() === 'open' ? 'success' : 'secondary'}
                                                            className="rounded-md px-2.5 py-0.5 text-[10px] font-bold border-none w-fit"
                                                        >
                                                            {(jd.status || 'Draft').toUpperCase()}
                                                        </Badge>
                                                        {isExpired && (
                                                            <span className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                                                                <AlertTriangle size={10} /> EXPIRED
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-xs font-medium ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className={isExpired ? 'text-red-400' : 'text-gray-400'} />
                                                        {jd.deadline ? new Date(jd.deadline).toLocaleDateString() : '---'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-all text-blue-600 hover:bg-blue-100 rounded-full"
                                                    >
                                                        <ArrowUpRight size={18} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No records found</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm">
                                                Adjust your search or check your demand inventory.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}