"use client";

import {
    ArrowLeft,
    Edit3,
    FileQuestion,
    Globe, Loader2, Mail, Phone,
    Save,
    Trash2,
    Users, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function SubAgentDetailsPage({ subAgent, onBack, onUpdate, onDelete }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: subAgent?.name || subAgent?.fullName || "",
        contact: subAgent?.contact || "",
        email: subAgent?.email || "",
        country: subAgent?.country || ""
    });

    useEffect(() => {
        if (subAgent?._id) {
            fetchAgentWorkers();
            setEditData({
                name: subAgent.name || subAgent.fullName,
                contact: subAgent.contact,
                email: subAgent.email,
                country: subAgent.country
            });
        }
    }, [subAgent]);

    const fetchAgentWorkers = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/sub-agents/${subAgent._id}/workers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setWorkers(result.data || []);
        } catch (err) {
            console.error("Error fetching workers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const success = await onUpdate(subAgent._id, editData);
        if (success) setIsEditing(false);
    };

    if (!subAgent) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileQuestion size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Agent not found</h3>
                <Button onClick={onBack} variant="link" className="text-blue-600">Return to list</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Back Navigation */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Agent List
            </button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                <div className="space-y-1">
                    {isEditing ? (
                        <input
                            className="text-3xl font-extrabold text-gray-900 border-b-2 border-blue-600 outline-none bg-blue-50/50 px-2 rounded-t-md w-full max-w-md"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                    ) : (
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {subAgent.name || subAgent.fullName}
                        </h1>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                        <Globe size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">Partner Agent &bull; {subAgent.country}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 h-10 border-gray-300"
                            >
                                <X size={18} />
                                <span>Cancel</span>
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
                            >
                                <Save size={18} />
                                <span>Save Changes</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 h-10 border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <Edit3 size={18} />
                                <span>Edit Profile</span>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => onDelete(subAgent._id)}
                                className="flex items-center gap-2 px-4 h-10 bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95"
                            >
                                <Trash2 size={18} />
                                <span>Delete Agent</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {/* Stats */}
                    <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance</p>
                        </div>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Workers</span>
                                <span className="font-bold text-gray-900">{workers.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Deployed</span>
                                <span className="font-bold text-green-600">{workers.filter(w => ['active', 'deployed'].includes(w.status)).length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="border-none shadow-sm ring-1 ring-gray-200">
                        <CardHeader className="py-4 border-b bg-gray-50/50">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase">Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-bold uppercase">Phone</label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Phone size={14} className="text-gray-400" />
                                    {isEditing ? (
                                        <input className="w-full border rounded px-2 py-1" value={editData.contact} onChange={e => setEditData({ ...editData, contact: e.target.value })} />
                                    ) : <span>{subAgent.contact}</span>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-bold uppercase">Email</label>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 truncate">
                                    <Mail size={14} />
                                    {isEditing ? (
                                        <input className="w-full border rounded px-2 py-1 text-black" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                                    ) : <span>{subAgent.email || 'N/A'}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Section */}
                <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[400px]">
                    <CardHeader className="border-b bg-white flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase">Worker Registry</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                <p className="text-sm text-gray-400">Fetching records...</p>
                            </div>
                        ) : workers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Users size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-gray-900 font-semibold italic">"It's quiet in here..."</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-[250px]">
                                    This agent hasn't referred any workers to the system yet.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-bold">Name</TableHead>
                                        <TableHead className="font-bold">Passport</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="font-bold text-right">Registered</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workers.map((w) => (
                                        <TableRow key={w._id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-bold text-blue-900">{w.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{w.passportNumber}</TableCell>
                                            <TableCell>
                                                <Badge className={w.status === 'active' || w.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                                    {w.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-gray-400 text-xs">
                                                {new Date(w.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}