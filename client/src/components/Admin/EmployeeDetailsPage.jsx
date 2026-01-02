"use client";
import {
    ArrowLeft, Briefcase, Building2,
    Loader2,
    TrendingUp,
    Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeeDetailsPage({ employee, onBack }) {
    const [data, setData] = useState({ employers: [], jobs: [], workers: [] });
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllData = useCallback(async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            setIsLoading(true);
            const [empRes, jobRes, workerRes] = await Promise.all([
                fetch('http://localhost:5000/api/employers', { headers }),
                fetch('http://localhost:5000/api/job-demands', { headers }),
                fetch(`http://localhost:5000/api/workers?createdBy=${employee._id}`, { headers })
            ]);

            const empsJson = await empRes.json();
            const jobsJson = await jobRes.json();
            const workersJson = await workerRes.json();

            const filterByCreator = (jsonResponse, listKey) => {
                const list = jsonResponse.data || jsonResponse[listKey] || [];
                return list.filter(item => {
                    const creatorId = item.createdBy?._id || item.createdBy || item.assignedTo?._id || item.assignedTo;
                    return String(creatorId) === String(employee._id);
                });
            };

            setData({
                employers: filterByCreator(empsJson, 'employers'),
                jobs: filterByCreator(jobsJson, 'jobDemands'),
                workers: workersJson.data || []
            });
        } catch (err) {
            console.error("DATA FETCH ERROR:", err);
        } finally {
            setIsLoading(false);
        }
    }, [employee._id]);

    useEffect(() => {
        if (employee?._id) fetchAllData();
    }, [fetchAllData, employee._id]);

    // Calculate dynamic success rate based on workers status
    const calculateSuccessRate = () => {
        if (data.workers.length === 0) return "0%";
        const placed = data.workers.filter(w =>
            w.status?.toLowerCase() === 'placed' || w.status?.toLowerCase() === 'active'
        ).length;
        return `${Math.round((placed / data.workers.length) * 100)}%`;
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-gray-500 font-medium tracking-tight">Loading employee data...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Page Title & Back Button */}
            <div className="flex flex-col gap-1">
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium group w-fit">
                    <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to directory
                </button>
                <h1 className="text-2xl font-bold text-slate-900">{employee.fullName || "Unnamed Employee"}</h1>
                <p className="text-xs text-slate-500">Employee profile and performance</p>
            </div>

            {/* Top Stat Cards - All Dynamic */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Employers Added" value={data.employers.length} icon={<Building2 size={20} />} color="blue" />
                <StatCard label="Job Demands" value={data.jobs.length} icon={<Briefcase size={20} />} color="purple" />
                <StatCard label="Workers Managed" value={data.workers.length} icon={<Users size={20} />} color="green" />
                <StatCard label="Success Rate" value={calculateSuccessRate()} icon={<TrendingUp size={20} />} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information - Using actual employee props */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-700">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        <InfoBox label="Full Name" value={employee.fullName} />
                        <InfoBox label="Email Address" value={employee.email} />
                        <InfoBox label="Contact Number" value={employee.contactNumber || "—"} />
                        <InfoBox label="Address" value={employee.address || "—"} />
                        <InfoBox label="Role / Designation" value={employee.role || "Employee"} />
                        <InfoBox label="Join Date" value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : "—"} />
                    </CardContent>
                </Card>

                {/* Performance Summary - Calculated from state */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-700">Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <PerformanceRow
                            label="Workers Placed"
                            value={data.workers.filter(w => w.status?.toLowerCase() === 'placed').length}
                            color="text-green-600"
                            bgColor="bg-green-50/50"
                        />
                        <PerformanceRow
                            label="Pending Applications"
                            value={data.workers.filter(w => w.status?.toLowerCase() === 'pending').length}
                            color="text-blue-600"
                            bgColor="bg-blue-50/50"
                        />
                        <PerformanceRow
                            label="Total Created Records"
                            value={data.employers.length + data.jobs.length + data.workers.length}
                            color="text-purple-600"
                            bgColor="bg-purple-50/50"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Employers Added Table */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Employers Added by This Employee</h3>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500">Employer Name</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500">Country</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-right">Added On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.employers.length > 0 ? data.employers.map(emp => (
                            <TableRow key={emp._id} className="hover:bg-slate-50/50">
                                <TableCell className="text-sm font-medium text-slate-700">{emp.employerName}</TableCell>
                                <TableCell className="text-sm text-slate-600">{emp.country || "—"}</TableCell>
                                <TableCell className="text-sm text-slate-500 text-right">{new Date(emp.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No employers found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Recent Job Demands Created */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Job Demands Created</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {data.jobs.length > 0 ? data.jobs.map(job => (
                        <div key={job._id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${job.status === 'open' ? 'bg-green-500' :
                                    job.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400'
                                }`} />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {job.jobTitle} - <span className="text-slate-500 font-normal">{job.employerId?.employerName || 'Direct Demand'}</span>
                                </p>
                                <div className="flex gap-4 mt-1">
                                    <p className="text-[11px] text-slate-500">
                                        Required: <span className="font-bold text-slate-700">{job.requiredWorkers || job.noOfWorkers || 0}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Status: <span className="font-bold capitalize text-slate-700">{job.status || "—"}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400 italic">
                                        Created {new Date(job.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-400 text-sm">No job demands found</div>
                    )}
                </div>
            </Card>

            {/* Workers Managed Table */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Managed Workers Portfolio</h3>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500">Worker Name</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500">Passport</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500">Status</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-right">Added Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.workers.length > 0 ? data.workers.map(worker => (
                            <TableRow key={worker._id} className="hover:bg-slate-50/50">
                                <TableCell className="text-sm font-bold text-slate-800">{worker.name || worker.fullName}</TableCell>
                                <TableCell className="text-xs font-mono text-slate-500 uppercase tracking-tighter">{worker.passportNumber || "—"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${worker.status?.toLowerCase() === 'placed' || worker.status?.toLowerCase() === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {worker.status || "Pending"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-slate-500 text-right">{new Date(worker.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No managed workers found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

// Re-usable UI Helpers
function StatCard({ label, value, icon, color }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50",
        purple: "text-purple-600 bg-purple-50",
        green: "text-green-600 bg-green-50",
        yellow: "text-amber-600 bg-amber-50"
    };
    return (
        <Card className="border border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
                    <p className="text-2xl font-black text-slate-800 leading-none mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
            </CardContent>
        </Card>
    );
}

function InfoBox({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{value || "—"}</p>
        </div>
    );
}

function PerformanceRow({ label, value, color, bgColor }) {
    return (
        <div className={`p-4 rounded-xl ${bgColor} flex flex-col`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
            <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
        </div>
    );
}