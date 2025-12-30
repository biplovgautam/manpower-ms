"use client";

import {
    ArrowLeft,
    Briefcase,
    Building2,
    Search,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
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

export function EmployeesListPage({ employees = [], onAddEmployee, isLoading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // --- AGGREGATE STATS FOR THE CARDS ---
    const totalEmployees = employees.length;
    const totalEmployers = employees.reduce((acc, curr) => acc + (curr.employersAdded || 0), 0);
    const totalDemands = employees.reduce((acc, curr) => acc + (curr.jobDemandsCreated || 0), 0);
    const totalWorkersManaged = employees.reduce((acc, curr) => acc + (curr.workersManaged || 0), 0);

    const filteredEmployees = employees.filter(
        (employee) =>
            employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
        setView('detail');
    };

    // --- DETAIL VIEW ---
    if (view === 'detail' && selectedEmployee) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white shadow-sm border"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {selectedEmployee.fullName}
                        </h1>
                        <p className="text-gray-600">
                            Employee profile and performance metrics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard
                        label="Employers Added"
                        value={selectedEmployee.employersAdded || 0}
                        icon={<Building2 />}
                        color="blue"
                    />
                    <MetricCard
                        label="Job Demands"
                        value={selectedEmployee.jobDemandsCreated || 0}
                        icon={<Briefcase />}
                        color="purple"
                    />
                    <MetricCard
                        label="Workers Managed"
                        value={selectedEmployee.workersManaged || 0}
                        icon={<Users />}
                        color="green"
                    />
                    <MetricCard
                        label="Success Rate"
                        value="87%"
                        icon={<TrendingUp />}
                        color="yellow"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="Full Name" value={selectedEmployee.fullName} />
                            <InfoRow label="Email Address" value={selectedEmployee.email} />
                            <InfoRow label="Contact Number" value={selectedEmployee.contactNumber || 'N/A'} />
                            <InfoRow label="Address" value={selectedEmployee.address || 'N/A'} />
                            <InfoRow label="Join Date" value={new Date(selectedEmployee.joinDate).toLocaleDateString()} />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Performance Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <PerformanceBox label="Workers Successfully Placed" value="74" color="green" />
                            <PerformanceBox label="Active Placements" value="11" color="blue" />
                            <PerformanceBox label="Average Processing Time" value="45 days" color="purple" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-600 mt-2">
                        Manage employee accounts and track operational performance
                    </p>
                </div>
                <Button
                    onClick={onAddEmployee}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                    <UserPlus size={18} className="mr-2" /> Add New Staff
                </Button>
            </div>

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard label="Total Staff" value={totalEmployees} icon={<Users />} color="blue" />
                <MetricCard label="Total Employers" value={totalEmployers} icon={<Building2 />} color="purple" />
                <MetricCard label="Job Demands" value={totalDemands} icon={<Briefcase />} color="green" />
                <MetricCard label="Workers Managed" value={totalWorkersManaged} icon={<TrendingUp />} color="yellow" />
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">All Employees ({filteredEmployees.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold px-6 py-4">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Contact</TableHead>
                                <TableHead className="font-semibold text-center">Employers</TableHead>
                                <TableHead className="font-semibold text-center">Demands</TableHead>
                                <TableHead className="font-semibold text-center">Workers Managed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">Loading...</TableCell></TableRow>
                            ) : filteredEmployees.map((employee) => (
                                <TableRow
                                    key={employee._id}
                                    onClick={() => handleSelectEmployee(employee)}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors group"
                                >
                                    <TableCell className="font-bold text-gray-900 px-6 py-4 group-hover:text-blue-600">
                                        {employee.fullName}
                                    </TableCell>
                                    <TableCell className="text-gray-600">{employee.email}</TableCell>
                                    <TableCell className="text-gray-600">{employee.contactNumber || 'N/A'}</TableCell>
                                    <TableCell className="text-center font-bold text-blue-600">
                                        {employee.employersAdded || 0}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-purple-600">
                                        {employee.jobDemandsCreated || 0}
                                    </TableCell>
                                    {/* FIX: Ensuring Workers Managed is visible and bold */}
                                    <TableCell className="text-center font-bold text-green-600 bg-green-50/30">
                                        {employee.workersManaged ?? 0}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function MetricCard({ label, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600"
    };
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
            </CardContent>
        </Card>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function PerformanceBox({ label, value, color }) {
    const colors = {
        green: "bg-green-50 text-green-700",
        blue: "bg-blue-50 text-blue-700",
        purple: "bg-purple-50 text-purple-700"
    };
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl ${colors[color]}`}>
            <div>
                <p className="text-sm opacity-80">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
        </div>
    );
}