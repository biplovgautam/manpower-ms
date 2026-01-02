"use client";

import { Briefcase, Building2, Loader2, RefreshCw, Search, TrendingUp, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeesListPage({ employees = [], onAddEmployee, isLoading, onSelect, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Calculations based on backend workersManaged field
    const totalEmployees = employees.length;
    const totalEmployers = employees.reduce((acc, curr) => acc + (curr.employersAdded || 0), 0);
    const totalDemands = employees.reduce((acc, curr) => acc + (curr.jobDemandsCreated || 0), 0);
    const totalWorkersManaged = employees.reduce((acc, curr) => acc + (curr.workersManaged || 0), 0);

    const filteredEmployees = employees.filter(
        (employee) =>
            (employee.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employees</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage team accounts and view real-time performance</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        className="rounded-xl px-4 py-6 border-gray-200 hover:bg-gray-50"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button
                        onClick={onAddEmployee}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        <UserPlus size={18} className="mr-2" /> Add New Staff
                    </Button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Staff" value={totalEmployees} icon={<Users />} color="blue" />
                <MetricCard label="Total Employers" value={totalEmployers} icon={<Building2 />} color="purple" />
                <MetricCard label="Job Demands" value={totalDemands} icon={<Briefcase />} color="green" />
                <MetricCard label="Workers Managed" value={totalWorkersManaged} icon={<TrendingUp />} color="yellow" />
            </div>

            {/* Employee Table Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Employee Directory
                            {!isLoading && <span className="ml-2 text-sm font-normal text-gray-400">({filteredEmployees.length} staff)</span>}
                        </CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="px-6 py-4 font-bold text-gray-700">Staff Member</TableHead>
                                <TableHead className="font-bold text-gray-700">Email Address</TableHead>
                                <TableHead className="text-center font-bold text-gray-700">Employers</TableHead>
                                <TableHead className="text-center font-bold text-gray-700">Demands</TableHead>
                                <TableHead className="text-center font-bold text-gray-700">Workers Managed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
                                        <p className="text-gray-400 font-medium">Loading employee data...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <TableRow
                                        key={employee._id}
                                        onClick={() => onSelect(employee)}
                                        className="cursor-pointer hover:bg-blue-50/30 transition-colors group border-b border-gray-50 last:border-0"
                                    >
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                                    {employee.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {employee.fullName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 font-medium">{employee.email}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2.5rem] py-1 font-bold text-blue-700 bg-blue-50 rounded-lg">
                                                {employee.employersAdded || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2.5rem] py-1 font-bold text-purple-700 bg-purple-50 rounded-lg">
                                                {employee.jobDemandsCreated || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {/* Logic: Highlight green if they are actively managing workers */}
                                            <span className={`inline-flex items-center justify-center min-w-[3rem] py-1 px-2 font-black rounded-lg transition-colors ${(employee.workersManaged || 0) > 0
                                                    ? "text-green-700 bg-green-100 shadow-sm"
                                                    : "text-gray-400 bg-gray-50"
                                                }`}>
                                                {employee.workersManaged || 0}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-gray-500">
                                        <Search className="mx-auto text-gray-200 mb-2" size={48} />
                                        <p className="font-medium">No staff members found.</p>
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

function MetricCard({ label, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100",
        purple: "bg-purple-50 text-purple-600 shadow-purple-100",
        green: "bg-green-50 text-green-600 shadow-green-100",
        yellow: "bg-yellow-50 text-yellow-600 shadow-yellow-100"
    };
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${colors[color]}`}>
                    {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
                </div>
            </CardContent>
        </Card>
    );
}