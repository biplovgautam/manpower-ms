"use client";

import { Loader2, RefreshCw, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeesListPage({ employees = [], onAddEmployee, isLoading, onSelect, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(
        (employee) =>
            (employee.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.contactNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
                        {!isLoading && (
                            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                {employees.length} Total
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1 font-medium">Create and manage internal staff accounts and permissions.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        className="rounded-xl px-4 py-6 border-gray-200 hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : "text-gray-600"} />
                    </Button>

                    <Button
                        onClick={onAddEmployee}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-blue-200/50 border-0 transition-all active:scale-95 flex items-center gap-2 font-semibold"
                    >
                        <div className="bg-white/20 p-1 rounded-lg">
                            <UserPlus size={18} />
                        </div>
                        Add New Staff
                    </Button>
                </div>
            </div>

            {/* Focused Table Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
                <CardHeader className="border-b border-gray-50 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search by name, email or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all py-5"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest text-gray-400">Staff Member</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400">Login Email</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400">Phone</TableHead>
                                <TableHead className="text-center font-bold text-[11px] uppercase tracking-widest text-gray-400">Employers</TableHead>
                                <TableHead className="text-center font-bold text-[11px] uppercase tracking-widest text-gray-400">Demands</TableHead>
                                <TableHead className="text-center font-bold text-[11px] uppercase tracking-widest text-gray-400">Workers</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
                                        <p className="text-gray-400 font-medium tracking-tight">Syncing staff directory...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <TableRow
                                        key={employee._id}
                                        onClick={() => onSelect(employee)}
                                        className="cursor-pointer hover:bg-blue-50/20 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                                    {employee.fullName?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900">{employee.fullName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 font-medium">
                                            {employee.email || <span className="text-gray-300 italic">No Email Provided</span>}
                                        </TableCell>
                                        <TableCell className="text-gray-600 font-semibold">{employee.contactNumber}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-gray-700">{employee.employersAdded || 0}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-gray-700">{employee.jobDemandsCreated || 0}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[2.2rem] py-1 px-2 font-bold rounded-lg text-xs ${(employee.workersManaged || 0) > 0
                                                    ? "text-emerald-600 bg-emerald-50"
                                                    : "text-gray-400 bg-gray-50"
                                                }`}>
                                                {employee.workersManaged || 0}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="text-gray-300" size={32} />
                                        </div>
                                        <p className="text-gray-500 font-semibold">No results found</p>
                                        <p className="text-gray-400 text-sm">Try searching for a different name or phone number.</p>
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