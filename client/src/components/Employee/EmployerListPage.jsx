"use client";

import {
    ArrowUpRight,
    Building2,
    Globe,
    Phone,
    Plus,
    Search,
    Briefcase,
    Users,
    Mail
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

/**
 * EmployerListPage Component
 * @param {Array} employers - Array of employer objects from backend
 * @param {Function} onNavigate - Navigation handler (e.g., to 'add' view)
 * @param {Function} onSelectEmployer - Handler for clicking a row (details view)
 */
export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter logic for Search Bar
    const filtered = useMemo(() => {
        return employers.filter(emp =>
            (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employers, searchTerm]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Employers</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage your hiring partners, job demands, and placement stats.
                    </p>
                </div>
              <Button
  onClick={() => onNavigate('add')}
  className="flex items-center justify-center h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-200 transition-all hover:brightness-110 active:scale-95"
>
  <Plus size={20} className="mr-2 stroke-[3px]" />
  Add Employer
</Button>
            </div>

            {/* --- TABLE CARD --- */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                {/* Search and Stats Bar */}
                <div className="bg-white border-b px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full group">
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
                    <div className="text-sm font-medium text-gray-500">
                        Total Employers: <span className="text-blue-600 font-bold">{filtered.length}</span>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[280px] py-4 pl-6 text-xs uppercase font-bold text-gray-500">Employer</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Contact Details</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Region</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 text-center">Demands</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500 text-center">Hires</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((employer) => (
                                        <TableRow
                                            key={employer._id || employer.id}
                                            className="group hover:bg-blue-50/40 cursor-pointer transition-all border-b border-gray-50 last:border-0"
                                            onClick={() => onSelectEmployer(employer)}
                                        >
                                            {/* Profile Column */}
                                            <TableCell className="py-5 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {employer.employerName}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Contact Details Column */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center text-sm font-medium text-gray-700">
                                                        <Phone size={14} className="mr-2 text-blue-500/70" />
                                                        {employer.contact || 'N/A'}
                                                    </div>
                                                    {employer.email && (
                                                        <div className="flex items-center text-xs text-gray-400">
                                                            <Mail size={12} className="mr-2" />
                                                            {employer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Region Column */}
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Globe size={14} className="text-gray-400" />
                                                    {employer.country}
                                                </div>
                                            </TableCell>

                                            {/* Job Demands Column (Backend Virtual) */}
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                                                    <Briefcase size={14} />
                                                    <span className="font-mono font-bold">
                                                        {/* totalJobDemands comes from the populated virtual */}
                                                        {employer.totalJobDemands || 0}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Total Hires Column (Backend Virtual) */}
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                                                    <Users size={14} />
                                                    <span className="font-mono font-bold">
                                                        {/* totalHires comes from the populated virtual */}
                                                        {employer.totalHires || 0}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Status Badge */}
                                            <TableCell>
                                                <Badge
                                                    variant={employer.status === 'active' || !employer.status ? 'success' : 'secondary'}
                                                    className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border-none"
                                                >
                                                    {(employer.status || 'Active').toUpperCase()}
                                                </Badge>
                                            </TableCell>

                                            {/* Action Arrow */}
                                            <TableCell className="pr-6 text-right">
                                                <div className="inline-flex text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300">
                                                    <ArrowUpRight size={20} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    /* Empty State */
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-20 text-center bg-gray-50/50">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-300 mb-4">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No partners found</h3>
                                            <p className="text-gray-500">Try adjusting your search or add a new employer.</p>
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