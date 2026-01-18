"use client";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Plus,
  Search,
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
  onNavigate
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
    <div className="max-w-7xl mx-auto p-8 space-y-8 antialiased">

      {/* 1. Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Job Demands
          </h1>
          <p className="text-slate-500 font-medium italic">
            Manage hiring quotas and recruitment pipelines.
          </p>
        </div>
       <Button
  onClick={() => onNavigate('create')}
  className="flex items-center justify-center h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 active:scale-95"
>
  <Plus size={18} className="mr-2 stroke-[2.5px]" />
  <span>Create New Demand</span>
</Button>
      </div>

      {/* 2. Refined Search */}
      <div className="relative max-w-md group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        </div>
        <Input
          placeholder="Filter by title or company..."
          className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all border-none ring-1 ring-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. Minimalist Data Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white rounded-3xl ring-1 ring-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/40">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="py-5 pl-8 text-[12px] uppercase font-bold text-slate-400 tracking-[0.1em]">Position & Client</TableHead>
                  <TableHead className="text-[12px] uppercase font-bold text-slate-400 tracking-[0.1em] text-center">Openings</TableHead>
                  <TableHead className="text-[12px] uppercase font-bold text-slate-400 tracking-[0.1em]">Status</TableHead>
                  <TableHead className="text-[12px] uppercase font-bold text-slate-400 tracking-[0.1em]">Deadline</TableHead>
                  <TableHead className="text-right pr-8 text-[12px] uppercase font-bold text-slate-400 tracking-[0.1em]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((jd) => (
                    <TableRow
                      key={jd._id}
                      onClick={() => onNavigate('details', jd)}
                      className="group hover:bg-slate-50/80 cursor-pointer transition-all border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <Briefcase size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                              {jd.jobTitle}
                            </p>
                            <p className="text-sm text-slate-400 font-semibold uppercase tracking-tight">
                              {jd.employerId?.employerName || jd.employerName}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="text-lg font-black text-slate-700">
                          {jd.requiredWorkers}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getStatusVariant(jd.status)}
                          className="rounded-lg px-3 py-1 text-[11px] font-bold uppercase border-none ring-1 ring-inset shadow-sm"
                        >
                          {jd.status || 'Open'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-300" />
                          {jd.deadline ? new Date(jd.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-8">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <ArrowUpRight size={20} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search size={40} className="text-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-slate-900 font-bold text-xl">No results match your search</h3>
                          <p className="text-slate-400 text-sm italic">Try a different keyword or create a new entry.</p>
                        </div>
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

