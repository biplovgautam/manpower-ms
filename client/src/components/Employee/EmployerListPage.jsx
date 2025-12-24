"use client";
import {
    ArrowUpRight,
    Building2,
    Edit2,
    Globe,
    MapPin,
    Phone,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer, onDelete }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = useMemo(() => {
        return employers.filter(emp =>
            (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employers, searchTerm]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Header - Unified with Job Demand style */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employers</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage your global network of hiring partners.
                    </p>
                </div>
                <Button
                    onClick={() => onNavigate('add')}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 px-6"
                >
                    <Plus size={20} className="mr-2" />
                    Add Employer
                </Button>
            </div>

            {/* 2. Main Data Table Card */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                {/* Search Header Area */}
                <div className="bg-white border-b px-6 py-5">
                    <div className="relative max-w-md group">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                            size={18}
                        />
                        <Input
                            placeholder="Search partners or countries..."
                            className="pl-10 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[350px] py-4 pl-6 text-xs uppercase font-bold text-gray-500">Employer Profile</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Region</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Contact</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="text-right pr-6 text-xs uppercase font-bold text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((employer) => (
                                        <TableRow
                                            key={employer._id}
                                            className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50 last:border-0"
                                            onClick={() => onSelectEmployer(employer)}
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {employer.employerName}
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                                                            <MapPin size={12} className="mr-1" /> {employer.address || 'Global HQ'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Globe size={14} className="text-gray-400" />
                                                    {employer.country}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                                    <Phone size={14} className="text-blue-400" />
                                                    {employer.contact}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={employer.status === 'active' || !employer.status ? 'success' : 'secondary'}
                                                    className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border-none"
                                                >
                                                    {(employer.status || 'Active').toUpperCase()}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-4 items-center">
                                                    {/* Icon-only Edit */}
                                                    <button
                                                        onClick={() => {
                                                            onSelectEmployer(employer);
                                                            onNavigate('edit');
                                                        }}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    {/* Icon-only Delete */}
                                                    <button
                                                        onClick={() => onDelete(employer._id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>

                                                    {/* Detail Arrow */}
                                                    <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                                                        <ArrowUpRight size={20} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center bg-gray-50/50">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-300 mb-4">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No partners found</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                                Adjust your filters or add a new employer to get started.
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