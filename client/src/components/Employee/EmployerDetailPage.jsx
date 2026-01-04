"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ArrowLeft, Building2, Edit, Trash2, Users, Briefcase, Loader2 } from 'lucide-react';

export function EmployerDetailsPage({ employer, onNavigate, onDelete, isLoading, onCreateDemand }) {
  if (!employer) return null;

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active' || s === 'open') return 'success';
    if (s === 'pending') return 'warning';
    return 'default';
  };

  const demands = employer.demands || [];
  const workers = employer.workers || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => onNavigate('list')} className="rounded-full h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{employer.employerName}</h1>
              {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Badge variant={getStatusVariant(employer.status)}>{employer.status || 'Active'}</Badge>
              <span>•</span>
              <span className="text-sm">Added {new Date(employer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => onNavigate('edit')}>
            <Edit size={16} /> Edit
          </Button>
          <Button variant="ghost" className="text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => onDelete(employer._id)}>
            <Trash2 size={16} /> Delete
          </Button>
          <Button className="bg-blue-600 text-white" onClick={onCreateDemand}>
            Create Job Demand
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-gray-50"><CardTitle className="text-lg flex items-center gap-2"><Building2 size={20} /> Company Information</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                <div><p className="text-xs font-semibold text-gray-400 uppercase">Country</p><p className="text-lg font-medium">{employer.country}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase">Contact</p><p className="text-lg font-mono">{employer.contact}</p></div>
                <div className="md:col-span-2"><p className="text-xs font-semibold text-gray-400 uppercase">Address</p><p className="text-lg">{employer.address}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between"><CardTitle className="text-lg">Job Demands</CardTitle><Badge variant="outline">{demands.length} Total</Badge></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-gray-50/50"><TableHead className="pl-6">Job Title</TableHead><TableHead>Required Workers</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {demands.length > 0 ? demands.map((jd) => (
                    <TableRow key={jd._id}>
                      <TableCell className="font-medium pl-6">{jd.jobTitle}</TableCell>
                      <TableCell>{jd.requiredWorkers || 0}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(jd.status)}>{jd.status}</Badge></TableCell>
                      <TableCell className="text-right pr-6 text-gray-500">{new Date(jd.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-400">{isLoading ? "Loading..." : "No job demands found."}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between"><div className="p-2 bg-white/20 rounded-lg"><Users size={24} /></div><span className="text-white/60 text-sm">Summary</span></div>
                <div><p className="text-4xl font-bold">{workers.length}</p><p className="text-blue-100 text-sm">Active Workers</p></div>
                <div className="pt-4 border-t border-white/10 flex justify-between">
                  <div><p className="font-bold text-lg">{demands.length}</p><p className="text-xs text-blue-200 uppercase">Demands</p></div>
                  <div><p className="font-bold text-lg">{demands.reduce((acc, curr) => acc + (Number(curr.requiredWorkers) || 0), 0)}</p><p className="text-xs text-blue-200 uppercase">Total Required</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase size={18}/> Recent Workers</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workers.length > 0 ? workers.slice(0, 5).map(w => (
                  <div key={w._id} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-sm font-medium">{w.fullName || w.name}</span>
                    <Badge variant="outline" className="text-[10px]">{w.status}</Badge>
                  </div>
                )) : <p className="text-sm text-gray-400 text-center">No workers found.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}