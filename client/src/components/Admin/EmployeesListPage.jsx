"use client";

import { Briefcase, Building2, Search, TrendingUp, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeesListPage({ employees = [], onAddEmployee, isLoading, onSelect }) {
    const [searchTerm, setSearchTerm] = useState('');

    // --- AGGREGATE STATS ---
    const totalEmployees = employees.length;
    const totalEmployers = employees.reduce((acc, curr) => acc + (curr.employersAdded || 0), 0);
    const totalDemands = employees.reduce((acc, curr) => acc + (curr.jobDemandsCreated || 0), 0);
    const totalWorkersManaged = employees.reduce((acc, curr) => acc + (curr.workersManaged || 0), 0);

    const filteredEmployees = employees.filter(
        (employee) =>
            employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-600 mt-2">Manage employee accounts and track performance</p>
                </div>
                <Button onClick={onAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <UserPlus size={18} className="mr-2" /> Add New Staff
                </Button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard label="Total Staff" value={totalEmployees} icon={<Users />} color="blue" />
                <MetricCard label="Total Employers" value={totalEmployers} icon={<Building2 />} color="purple" />
                <MetricCard label="Job Demands" value={totalDemands} icon={<Briefcase />} color="green" />
                <MetricCard label="Workers Managed" value={totalWorkersManaged} icon={<TrendingUp />} color="yellow" />
            </div>

            {/* Table */}
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
                                className="pl-10 bg-gray-50 border-none rounded-lg"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="px-6 py-4">Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-center">Employers</TableHead>
                                <TableHead className="text-center">Demands</TableHead>
                                <TableHead className="text-center">Workers Managed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredEmployees.map((employee) => (
                                <TableRow
                                    key={employee._id}
                                    // CRITICAL FIX: Use the onSelect prop passed from the parent
                                    onClick={() => onSelect(employee)}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors group"
                                >
                                    <TableCell className="font-bold text-gray-900 px-6 py-4 group-hover:text-blue-600">
                                        {employee.fullName}
                                    </TableCell>
                                    <TableCell className="text-gray-600">{employee.email}</TableCell>
                                    <TableCell className="text-center font-bold text-blue-600">{employee.employersAdded || 0}</TableCell>
                                    <TableCell className="text-center font-bold text-purple-600">{employee.jobDemandsCreated || 0}</TableCell>
                                    <TableCell className="text-center font-bold text-green-600">{employee.workersManaged || 0}</TableCell>
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
    const colors = { blue: "bg-blue-50 text-blue-600", purple: "bg-purple-50 text-purple-600", green: "bg-green-50 text-green-600", yellow: "bg-yellow-50 text-yellow-600" };
    return (
        <Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-6">
            <div><p className="text-sm font-medium text-gray-600">{label}</p><p className="text-3xl font-bold text-gray-900 mt-2">{value}</p></div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>{React.cloneElement(icon, { size: 24 })}</div>
        </CardContent></Card>
    );
}