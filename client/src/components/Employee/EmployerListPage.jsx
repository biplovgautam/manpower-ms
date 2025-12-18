"use client";
import React, { useState } from 'react';
import { 
  Building2, Globe, MapPin, Phone, Search, Plus, Edit2, Trash2 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer, onDelete }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = employers.filter(emp =>
        (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employers Management</h1>
                    <p className="text-gray-500">View and manage all registered hiring companies</p>
                </div>
                <Button 
                    onClick={() => onNavigate('add')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                    <Plus size={18} /> Add New Employer
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search by name or country..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-sm font-semibold text-gray-600 uppercase">
                                    <th className="py-4 px-4">Company Name</th>
                                    <th className="py-4 px-4">Location</th>
                                    <th className="py-4 px-4">Contact</th>
                                    <th className="py-4 px-4">Status</th>
                                    <th className="py-4 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.length > 0 ? (
                                    filtered.map((employer) => (
                                        <tr 
                                            key={employer._id} 
                                            onClick={() => onSelectEmployer(employer)}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 px-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                                                        <Building2 size={16} />
                                                    </div>
                                                    {employer.employerName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={14} /> {employer.country}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                {employer.contact}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant={employer.status === 'active' || !employer.status ? 'success' : 'default'}>
                                                    {employer.status || 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents row click
                                                            onSelectEmployer(employer);
                                                            onNavigate('edit');
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents row click
                                                            onDelete(employer._id);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-gray-500">
                                            No employers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}