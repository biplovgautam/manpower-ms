"use client";
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Building, Briefcase, Users, FileText } from 'lucide-react';
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

            const [emps, jobs, workers] = await Promise.all([empRes.json(), jobRes.json(), workerRes.json()]);

            const filterByCreator = (list) => list.filter(item => 
                (item.createdBy?._id || item.createdBy) === employee._id || item.createdBy === 'emp1'
            );

            setData({
                employers: filterByCreator(emps.data || []),
                jobs: filterByCreator(jobs.data || []),
                workers: filterByCreator(workers.data || [])
            });
        } catch (err) {
            console.error("Data fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [employee._id]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-gray-500">Loading comprehensive data...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg border transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
                        <p className="text-sm text-gray-500">Employee ID: {employee._id}</p>
                    </div>
                </div>
                <div className="flex gap-4 px-4 text-right">
                    <StatItem label="Employers" value={data.employers.length} />
                    <StatItem label="Job Demands" value={data.jobs.length} />
                    <StatItem label="Workers" value={data.workers.length} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 1. PERSONAL PROFILE DATA */}
                <Card className="h-fit">
                    <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-sm flex items-center gap-2"><FileText size={16}/> Personal Information</CardTitle></CardHeader>
                    <CardContent className="divide-y text-sm p-0">
                        <DataRow label="Full Name" value={employee.fullName} />
                        <DataRow label="Email" value={employee.email} icon={<Mail size={14}/>} />
                        <DataRow label="Contact" value={employee.contactNumber} icon={<Phone size={14}/>} />
                        <DataRow label="Address" value={employee.address} icon={<MapPin size={14}/>} />
                        <DataRow label="Join Date" value={new Date(employee.joinDate).toLocaleDateString()} icon={<Calendar size={14}/>} />
                    </CardContent>
                </Card>

                {/* 2. EMPLOYERS DATA */}
                <Card className="xl:col-span-2">
                    <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-sm flex items-center gap-2"><Building size={16}/> Acquired Employers</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Employer Name</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.employers.map(emp => (
                                    <TableRow key={emp._id}>
                                        <TableCell className="font-medium">{emp.employerName}</TableCell>
                                        <TableCell>{emp.country}</TableCell>
                                        <TableCell>{emp.contact}</TableCell>
                                        <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{emp.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 3. JOB DEMANDS DATA */}
                <Card className="xl:col-span-3">
                    <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-sm flex items-center gap-2"><Briefcase size={16}/> Job Demands Created</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Required Workers</TableHead>
                                    <TableHead>Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Skills</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.jobs.map(job => (
                                    <TableRow key={job._id}>
                                        <TableCell className="font-medium">{job.jobTitle}</TableCell>
                                        <TableCell>{job.requiredWorkers}</TableCell>
                                        <TableCell>{job.salary}</TableCell>
                                        <TableCell><span className="capitalize px-2 py-0.5 rounded border text-xs">{job.status}</span></TableCell>
                                        <TableCell>{new Date(job.deadline).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-xs">{job.skills?.join(', ') || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 4. WORKERS DATA */}
                <Card className="xl:col-span-3">
                    <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-sm flex items-center gap-2"><Users size={16}/> Managed Workers</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Worker Name</TableHead>
                                    <TableHead>Passport</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Added On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.workers.map(worker => (
                                    <TableRow key={worker._id}>
                                        <TableCell className="font-medium">{worker.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{worker.passportNumber}</TableCell>
                                        <TableCell>{worker.country}</TableCell>
                                        <TableCell className="capitalize">{worker.currentStage}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {worker.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(worker.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Internal Helper Components ---

function StatItem({ label, value }) {
    return (
        <div className="px-4 border-l last:border-r">
            <p className="text-[10px] uppercase text-gray-400 font-bold">{label}</p>
            <p className="text-xl font-bold text-blue-600">{value}</p>
        </div>
    );
}

function DataRow({ label, value, icon }) {
    return (
        <div className="p-4 flex justify-between items-center gap-4">
            <span className="text-gray-500 flex items-center gap-2">
                {icon} {label}:
            </span>
            <span className="font-semibold text-gray-900 text-right">{value || 'N/A'}</span>
        </div>
    );
}   