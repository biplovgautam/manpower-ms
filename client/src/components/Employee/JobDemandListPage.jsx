"use client";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Pencil,
  Plus,
  Search,
  Trash2,
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
  TableRow,
} from '../ui/table';

export function JobDemandListPage({
  jobDemands = [],
  onNavigate,
  onSelectJobDemand,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'success';
      case 'pending':
      case 'in-progress': return 'warning';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const filtered = useMemo(() => {
    return jobDemands.filter((jd) => {
      const jobTitle = jd.jobTitle || '';
      const employerName = jd.employerId?.employerName || jd.employerName || '';
      return (
        jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [jobDemands, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 antialiased">

      {/* 1. Header - Matches Employer Page exactly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Job Demands</h1>
          <p className="text-sm text-slate-500 mt-1">
            Central directory of all recruitment requirements and hiring quotas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigate('create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Create Demand
          </Button>
        </div>
      </div>

      {/* 2. Integrated Search Bar */}
      <div className="relative max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <Input
          placeholder="Search by job title or employer..."
          className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. Main Data Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="py-4 pl-6 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Job Profile</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Quota</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Deadline</TableHead>
                  <TableHead className="text-right pr-6 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((jd) => (
                    <TableRow
                      key={jd._id}
                      onClick={() => onSelectJobDemand(jd)}
                      className="group hover:bg-indigo-50/30 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {jd.jobTitle}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5 font-medium">
                              {jd.employerId?.employerName || jd.employerName}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          {jd.requiredWorkers}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getStatusVariant(jd.status)}
                          className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tighter border-none"
                        >
                          {jd.status || 'Open'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {jd.deadline ? new Date(jd.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-4 items-center">
                          {/* Edit Icon */}
                          <button
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="Edit Demand"
                            onClick={() => onNavigate('edit', jd)}
                          >
                            <Pencil size={18} />
                          </button>

                          {/* Delete Icon */}
                          <button
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Delete Demand"
                            onClick={() => onDelete(jd._id)}
                          >
                            <Trash2 size={18} />
                          </button>

                          {/* Detail Arrow */}
                          <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                            <ArrowUpRight size={18} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                          <Search size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-900 font-semibold text-lg">No demands found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-1 text-sm">
                          Try adjusting your search or create a new job demand.
                        </p>
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