"use client";

import { ArrowLeft, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployeeDetailsPage({ employee, onBack }) {
    const [managedWorkers, setManagedWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployeeWorkers = async () => {
            try {
                const token = localStorage.getItem('token');
                // We filter the workers API by the employee's ID
                const response = await fetch(`http://localhost:5000/api/workers?createdBy=${employee._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setManagedWorkers(result.data);
                }
            } catch (error) {
                console.error("Error fetching employee workers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeWorkers();
    }, [employee._id]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Navigation */}
            <Button onClick={onBack} variant="ghost" className="hover:bg-slate-100 mb-2">
                <ArrowLeft size={18} className="mr-2" /> Back to Directory
            </Button>

            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {employee.fullName.charAt(0)}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{employee.fullName}</h2>
                    <p className="text-slate-500">{employee.email}</p>
                    <div className="flex gap-4 mt-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                            {employee.role.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                            Joined {new Date(employee.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Managed Workers List */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase size={20} className="text-blue-600" />
                        Workers Managed by {employee.fullName.split(' ')[0]}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Worker Name</TableHead>
                                <TableHead>Passport</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Added Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10">Loading workers...</TableCell></TableRow>
                            ) : managedWorkers.length > 0 ? (
                                managedWorkers.map(worker => (
                                    <TableRow key={worker._id}>
                                        <TableCell className="font-bold">{worker.fullName}</TableCell>
                                        <TableCell className="font-mono text-sm">{worker.passportNumber}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700">
                                                {worker.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {new Date(worker.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                                        No workers currently managed by this staff member.
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