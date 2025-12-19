"use client";
import {
    ArrowUpRight,
    Building2,
    Edit2,
    Filter,
    Globe,
    MapPin,
    Phone,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../ui/Card';
import { Input } from '../ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/Table';

export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer, onDelete }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = employers.filter(emp =>
        (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Enhanced Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employers</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Central directory of all registered hiring partners and organizations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex border-gray-200">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>
                    <Button
                        onClick={() => onNavigate('add')}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 px-6"
                    >
                        <Plus size={20} className="mr-2" /> Add Employer
                    </Button>
                </div>
            </div>

            {/* 2. Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                <CardHeader className="bg-white border-b px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Partner Inventory
                        </CardTitle>
                        <div className="relative w-full sm:w-96 group">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                size={18}
                            />
                            <Input
                                placeholder="Search by name or country..."
                                className="pl-10 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[350px] py-4 pl-6 text-xs uppercase font-bold text-gray-500">Employer Profile</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Operational Region</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Primary Contact</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="text-right pr-6 text-xs uppercase font-bold text-gray-500">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((employer) => (
                                        <TableRow
                                            key={employer._id}
                                            onClick={() => onSelectEmployer(employer)}
                                            className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {employer.employerName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <MapPin size={12} className="mr-1" /> {employer.address || 'Headquarters'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-gray-600 font-medium">
                                                    <Globe size={14} className="mr-2 text-gray-400" />
                                                    {employer.country}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Phone size={14} className="mr-2 text-blue-500" />
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
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:bg-blue-100 rounded-full h-9 w-9 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectEmployer(employer);
                                                            onNavigate('edit');
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 rounded-full h-9 w-9 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(employer._id);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                    <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-all text-gray-300">
                                                        <ArrowUpRight size={18} />
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
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm">
                                                Try adjusting your search or filters to find the employer you are looking for.
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