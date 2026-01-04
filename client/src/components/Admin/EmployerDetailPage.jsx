"use client";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    ClipboardList,
    Globe,
    MapPin,
    Phone,
    UserCircle,
    Users
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployerDetailPage({ employer, onBack }) {
    if (!employer) return null;

    const renderValue = (val) => {
        if (!val) return 'N/A';
        if (typeof val === 'object') {
            return val.fullName || val.name || val.label || JSON.stringify(val);
        }
        return val;
    };

    const getStatusVariant = (status) => {
        const s = typeof status === 'object' ? status.label : status;
        switch (s?.toLowerCase()) {
            case 'active':
            case 'open': return 'success';
            case 'inactive':
            case 'closed': return 'secondary';
            case 'pending':
            case 'on-hold': return 'warning';
            default: return 'success';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors w-fit"
                >
                    <ArrowLeft size={16} className="mr-2" /> Back to Inventory
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            {renderValue(employer.employerName)}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 text-gray-500">
                            <span className="flex items-center text-sm">
                                <Globe size={14} className="mr-1.5" /> {renderValue(employer.country)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <Badge variant={getStatusVariant(employer.status)}>
                                {String(renderValue(employer.status)).toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    icon={<Briefcase size={24} />}
                    label="Active Demands"
                    value={employer.demands?.length || 0}
                    bgColor="bg-blue-600"
                />
                <MetricCard
                    icon={<Users size={24} />}
                    label="Total Hires"
                    value={employer.workers?.length || 0}
                    bgColor="bg-emerald-600"
                />
                <MetricCard
                    icon={<Building2 size={24} />}
                    label="Employer ID"
                    value={employer._id?.substring(0, 8).toUpperCase() || 'N/A'}
                    bgColor="bg-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <InfoItem icon={<Phone size={16} />} label="Phone" value={renderValue(employer.contact)} />
                            <InfoItem icon={<MapPin size={16} />} label="Address" value={renderValue(employer.address)} />
                            <InfoItem
                                icon={<Calendar size={16} />}
                                label="System Entry"
                                value={employer.createdAt ? new Date(employer.createdAt).toLocaleDateString() : 'N/A'}
                            />
                            <InfoItem
                                icon={<UserCircle size={16} />}
                                label="Created By (Employee)"
                                value={renderValue(employer.createdBy)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Data Column: Demands and Workers */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Job Demands Table */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="border-b bg-white flex flex-row items-center gap-2">
                            <ClipboardList size={20} className="text-blue-600" />
                            <CardTitle className="text-lg font-bold">Specific Job Demands</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6">Job Title</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Salary</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employer.demands?.length > 0 ? (
                                        employer.demands.map((demand) => (
                                            <TableRow key={demand._id}>
                                                <TableCell className="pl-6 font-medium text-gray-900">{demand.jobTitle}</TableCell>
                                                {/* FIX: Changed .quantity to .requiredWorkers */}
                                                <TableCell>{demand.requiredWorkers || 0}</TableCell>
                                                <TableCell className="text-sm">{demand.salary || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(demand.status)} className="capitalize">
                                                        {demand.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-6 text-center text-gray-400">No job demands found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Hired Workers Table */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="border-b bg-white flex flex-row items-center gap-2">
                            <Users size={20} className="text-emerald-600" />
                            <CardTitle className="text-lg font-bold">Worker Hires</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6">Worker Name</TableHead>
                                        <TableHead>Passport</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Hired Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employer.workers?.length > 0 ? (
                                        employer.workers.map((worker) => (
                                            <TableRow key={worker._id}>
                                                {/* FIX: Changed .fullName to .name */}
                                                <TableCell className="pl-6 font-medium text-gray-900">
                                                    {worker.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{worker.passportNumber || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {worker.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-6 text-center text-gray-400">No workers hired yet.</TableCell>
                                        </TableRow>
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

function MetricCard({ icon, label, value, bgColor }) {
    return (
        <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl text-white ${bgColor}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 text-blue-500">{icon}</div>
            <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{label}</p>
                <p className="text-sm text-gray-700 font-medium">{value}</p>
            </div>
        </div>
    );
}