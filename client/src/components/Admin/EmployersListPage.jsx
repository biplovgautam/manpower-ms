"use client";
import {
    ArrowUpRight,
    Building2,
    Filter,
    Globe,
    MapPin,
    Phone,
    Search,
    ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
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
} from '../ui/Table';

export function EmployersListPage({ employers = [], onSelectEmployer, onNavigate }) {
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'secondary';
            case 'pending': return 'warning';
            default: return 'success';
        }
    };

    const filtered = employers.filter(emp =>
        emp.employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = employers.filter(e => e.status === 'active' || !e.status).length;
    const uniqueCountries = new Set(employers.map(e => e.country)).size;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Enhanced Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employers</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage global recruitment partners and client organizations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex border-gray-200">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>

                </div>
            </div>

            {/* 2. Quick Stats Overview (Mirroring Job Demand style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Entities</p>
                            <p className="text-2xl font-bold text-gray-900">{employers.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Active Partners</p>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-600 rounded-xl text-white">
                            <Globe size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Global Reach</p>
                            <p className="text-2xl font-bold text-gray-900">{uniqueCountries} Countries</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                <CardHeader className="bg-white border-b px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Employer Inventory
                        </CardTitle>
                        <div className="relative w-full sm:w-96 group">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Search by name or country..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[300px] py-4 pl-6 text-xs uppercase font-bold text-gray-500">Company Identity</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Location</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Contact</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="text-right pr-6 text-xs uppercase font-bold text-gray-500">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((emp) => (
                                        <TableRow
                                            key={emp._id}
                                            className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50"
                                            onClick={() => onSelectEmployer(emp)}
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        {emp.employerName?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {emp.employerName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <MapPin size={12} className="mr-1" /> {emp.address || 'Address not set'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-gray-600 font-medium">
                                                    <Globe size={14} className="mr-2 text-gray-400" />
                                                    {emp.country}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Phone size={14} className="mr-2 text-blue-500" />
                                                    {emp.contact}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStatusVariant(emp.status)}
                                                    className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border-none"
                                                >
                                                    {(emp.status || 'Active').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-all text-blue-600 hover:bg-blue-100 rounded-full"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No matches found</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm">
                                                We couldn't find any employers matching your current search.
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