"use client";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    Loader2, Mail,
    MapPin,
    Phone,
    TrendingUp,
    User,
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
                fetch('http://localhost:5000/api/workers', { headers })
            ]);

            const empsJson = await empRes.json();
            const jobsJson = await jobRes.json();
            const workersJson = await workerRes.json();

            // Unified Filtering Logic for all three datasets
            const filterByCreator = (jsonResponse) => {
                const list = jsonResponse.data || jsonResponse.workers || jsonResponse.jobDemands || [];
                return list.filter(item => {
                    const creatorId = item.createdBy?._id || item.createdBy ||
                        item.assignedTo?._id || item.assignedTo;
                    return String(creatorId) === String(employee._id);
                });
            };

            setData({
                employers: filterByCreator(empsJson),
                jobs: filterByCreator(jobsJson),
                workers: filterByCreator(workersJson)
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

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-gray-500 font-medium">Fetching associated records...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-gray-100 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{employee.fullName}</h1>
                    <p className="text-slate-500">Employee Statistics & History</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Employers Added" value={data.employers.length} icon={<Building2 />} color="blue" />
                <StatCard label="Job Demands" value={data.jobs.length} icon={<Briefcase />} color="purple" />
                <StatCard label="Workers Managed" value={data.workers.length} icon={<Users />} color="green" />
                <StatCard label="Success Rate" value="87%" icon={<TrendingUp />} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sidebar: Personal Information */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User size={16} className="text-blue-600" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            <InfoItem label="Full Name" value={employee.fullName} icon={<User size={14} />} />
                            <InfoItem label="Email Address" value={employee.email} icon={<Mail size={14} />} />
                            <InfoItem label="Contact Number" value={employee.contactNumber || 'N/A'} icon={<Phone size={14} />} />
                            <InfoItem label="Address" value={employee.address || 'N/A'} icon={<MapPin size={14} />} />
                            <InfoItem label="Join Date" value={new Date(employee.joinDate).toLocaleDateString()} icon={<Calendar size={14} />} />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tables */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Job Demands Table */}
                    <Card className="border-none shadow-sm overflow-hidden border-l-4 border-l-purple-500">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-700">
                                <Briefcase size={18} /> Job Demands Created
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/30">
                                    <TableRow>
                                        <TableHead className="pl-6 font-bold">Job Title</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="text-right pr-6 font-bold">Created Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.jobs.length > 0 ? data.jobs.map((job) => (
                                        <TableRow key={job._id}>
                                            <TableCell className="pl-6 font-semibold text-slate-800">{job.jobTitle}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {job.status || 'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-slate-400 text-xs">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">No job demands found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Employers Table */}
                    <Card className="border-none shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-700">
                                <Building2 size={18} /> Employers Added
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/30">
                                    <TableRow>
                                        <TableHead className="pl-6 font-bold">Company Name</TableHead>
                                        <TableHead className="font-bold">Country</TableHead>
                                        <TableHead className="text-right pr-6 font-bold">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.employers.map((emp) => (
                                        <TableRow key={emp._id}>
                                            <TableCell className="pl-6 font-semibold">{emp.employerName}</TableCell>
                                            <TableCell>{emp.country}</TableCell>
                                            <TableCell className="text-right pr-6 text-slate-500 font-mono">{emp.contact}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.employers.length === 0 && (
                                        <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">No employers registered.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

// UI Helpers
function StatCard({ label, value, icon, color }) {
    const themes = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600"
    };
    return (
        <Card className="border-none shadow-sm transition-transform hover:scale-[1.02]">
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${themes[color]}`}>{icon}</div>
            </CardContent>
        </Card>
    );
}

function InfoItem({ label, value, icon }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-slate-100 rounded text-slate-500">{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
                <p className="text-sm font-bold text-slate-700 leading-tight">{value}</p>
            </div>
        </div>
    );
}