"use client";

import {
    ArrowUpRight,
    Calendar,
    Clock,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    UserCircle,
    UserPlus,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeesListPage({ employees = [], onAddEmployee, onSelect, isLoading }) {
    const [search, setSearch] = useState('');

    const filtered = employees.filter(e =>
        e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    // Stats Calculation
    const totalEmployees = employees.length;
    const recentJoins = employees.filter(e => {
        const joinDate = new Date(e.joinDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joinDate > thirtyDaysAgo;
    }).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Team Management</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Monitor internal staff, roles, and operational access levels.
                    </p>
                </div>
                <Button
                    onClick={onAddEmployee}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 px-8 py-6 rounded-2xl transition-all active:scale-95 font-bold"
                >
                    <UserPlus size={20} className="mr-2" /> Add New Staff
                </Button>
            </div>

            {/* 2. Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Staff</p>
                            <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Active Status</p>
                            <p className="text-2xl font-bold text-gray-900">All Verified</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-600 rounded-xl text-white">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Recent Onboarding</p>
                            <p className="text-2xl font-bold text-gray-900">{recentJoins} New</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white rounded-[2rem]">
                <CardHeader className="bg-white border-b px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Employees
                        </CardTitle>
                        <div className="relative w-full sm:w-96 group">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 bg-gray-50 border-none h-12 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="pl-8 py-5 text-xs uppercase font-bold text-gray-500 tracking-widest">Employee Profile</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 tracking-widest">Contact Details</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 tracking-widest">Primary Location</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 tracking-widest">Join Date</TableHead>
                                    <TableHead className="text-right pr-8 text-xs uppercase font-bold text-gray-500 tracking-widest">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-gray-400 font-medium">Synchronizing Team Data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length > 0 ? (
                                    filtered.map((emp) => (
                                        <TableRow
                                            key={emp._id}
                                            onClick={() => onSelect(emp)}
                                            className="group hover:bg-blue-50/30 transition-all border-b border-gray-50 last:border-none cursor-pointer"
                                        >
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                        {emp.fullName?.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {emp.fullName}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 flex items-center mt-1">
                                                            <Mail size={12} className="mr-1.5" /> {emp.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm font-semibold text-gray-700">
                                                    <Phone size={14} className="mr-2 text-blue-500" />
                                                    {emp.contactNumber || 'No Contact'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-xs text-gray-500 max-w-[200px] truncate">
                                                    <MapPin size={14} className="mr-2 text-gray-300 shrink-0" />
                                                    {emp.address || 'Not Recorded'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    {formatDate(emp.joinDate)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-all text-blue-600 hover:bg-blue-100 rounded-xl"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents triggering the row's onClick twice
                                                        onSelect(emp);
                                                    }}
                                                >
                                                    <ArrowUpRight size={18} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-24 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-50 text-gray-200 mb-4">
                                                <UserCircle size={48} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-xl">No Staff Found</h3>
                                            <p className="text-gray-400 max-w-xs mx-auto mt-2">
                                                Try adjusting your search terms or add a new employee to the database.
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