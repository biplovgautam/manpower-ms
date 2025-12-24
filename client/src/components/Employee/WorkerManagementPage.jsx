"use client";
import { Edit2, Plus, Search, Trash2, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function WorkerManagementPage({ workers = [], onNavigate, onSelectWorker, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return workers.filter(w =>
      (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.passportNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workers, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Workers</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage and track worker registrations.</p>
        </div>
        <Button onClick={() => onNavigate('add')} className="bg-blue-600 text-white shadow-lg px-6">
          <Plus size={20} className="mr-2" /> Add Worker
        </Button>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <div className="bg-white border-b px-6 py-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name or passport..."
              className="pl-10 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4 pl-6 text-xs font-bold text-gray-500 uppercase">Worker Details</TableHead>
                <TableHead className="text-xs font-bold text-gray-500 uppercase">Passport</TableHead>
                <TableHead className="text-xs font-bold text-gray-500 uppercase">Contact</TableHead>
                <TableHead className="text-xs font-bold text-gray-500 uppercase">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-gray-500 uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((worker) => (
                <TableRow key={worker._id} className="group hover:bg-blue-50/30 border-b last:border-0">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User size={18} />
                      </div>
                      <div className="font-bold text-gray-900">{worker.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{worker.passportNumber}</TableCell>
                  <TableCell className="text-sm text-gray-700">{worker.contact}</TableCell>
                  <TableCell>
                    <Badge variant={worker.status === 'deployed' ? 'success' : 'secondary'}>
                      {(worker.status || 'Pending').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => onSelectWorker(worker)} className="text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={() => onDelete(worker._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}