"use client";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  FileText,
  MapPin,
  Plus,
  Search,
  User,
  UserCheck,
  X
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
  TableRow
} from '../ui/table';

export function WorkerManagementPage({
  workers = [],
  onNavigate,
  onSelectWorker
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker =>
      worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workers, searchTerm]);

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'deployed':
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  // Helper to format stage names (e.g., "visa-processing" to "Visa Processing")
  const formatStage = (stage) => {
    if (!stage) return 'Not Started';
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 antialiased">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Worker Management</h1>
          <p className="text-slate-500 font-medium italic">Track processing stages and deployment status for all recruits.</p>
        </div>
        <Button
          onClick={() => onNavigate('add')}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={20} className="mr-2 stroke-[3px] shrink-0" />
          <span className="font-semibold">Add New Worker</span>
        </Button>
      </div>

      {/* 2. Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Workers', value: workers.length, icon: User, color: 'indigo' },
          { label: 'In Processing', value: workers.filter(w => w.status === 'processing').length, icon: FileText, color: 'amber' },
          { label: 'Deployed', value: workers.filter(w => ['deployed', 'completed'].includes(w.status)).length, icon: CheckCircle2, color: 'emerald' }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden ring-1 ring-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-4 bg-${stat.color}-50 rounded-2xl text-${stat.color}-600`}>
                  <stat.icon size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="relative max-w-md group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        </div>
        <Input
          placeholder="Search name or passport..."
          className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all border-none ring-1 ring-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* 4. Worker Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white rounded-3xl ring-1 ring-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/40">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="py-5 pl-8 text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Worker Name</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Passport</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Status</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Current Stage</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Employer</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Sub-Agent</TableHead>
                  <TableHead className="text-right pr-8 text-[11px] uppercase font-bold text-slate-400 tracking-[0.1em]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <TableRow
                      key={worker._id}
                      className="group hover:bg-slate-50/80 cursor-pointer transition-all border-b border-slate-50 last:border-0"
                      onClick={() => onSelectWorker(worker)}
                    >
                      {/* Name Column */}
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{worker.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{worker.contact || 'No contact'}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Passport Column */}
                      <TableCell>
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {worker.passportNumber}
                        </span>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(worker.status)}
                          className="rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border-none ring-1 ring-inset"
                        >
                          {worker.status || 'Pending'}
                        </Badge>
                      </TableCell>

                      {/* Current Stage Column */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <MapPin size={14} className="text-indigo-400" />
                          {formatStage(worker.currentStage)}
                        </div>
                      </TableCell>

                      {/* Employer Column */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Briefcase size={14} className="text-slate-300" />
                          {worker.employerId?.employerName || worker.employerId?.name || <span className="text-slate-300 italic">Unassigned</span>}
                        </div>
                      </TableCell>

                      {/* Sub-Agent Column */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <UserCheck size={14} className="text-slate-300" />
                          {worker.subAgentId?.name || <span className="text-slate-300 italic">Direct</span>}
                        </div>
                      </TableCell>

                      {/* Action Column */}
                      <TableCell className="text-right pr-8">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <ArrowUpRight size={18} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Search size={48} className="text-slate-100" />
                        <h3 className="text-slate-900 font-bold">No workers found</h3>
                        <p className="text-slate-400 text-sm">Adjust your search filters to find what you're looking for.</p>
                      </div>
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
