import {
  ArrowUpRight,
  Briefcase,
  Clock,
  Plus,
  Search,
  Users
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
} from '../ui/table';

export function JobDemandListPage({
  jobDemands = [],
  onNavigate,
  onSelectJobDemand,
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

  const filteredJobDemands = jobDemands.filter((jd) => {
    const jobTitle = jd.jobTitle || '';
    const employerName = jd.employerId?.employerName || jd.employerName || '';
    return (
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalWorkers = filteredJobDemands.reduce((acc, curr) => acc + (curr.requiredWorkers || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Job Demands</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Monitor and manage active recruitment requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onNavigate('/employee/create-job-demand')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 px-6"
          >
            <Plus size={20} className="mr-2" />
            Create Demand
          </Button>
        </div>
      </div>

      {/* 2. Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Demands</p>
              <p className="text-2xl font-bold text-gray-900">{filteredJobDemands.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-xl text-white">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Total Positions</p>
              <p className="text-2xl font-bold text-gray-900">{totalWorkers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-600 rounded-xl text-white">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Closing Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredJobDemands.filter(jd => jd.status === 'open').length} Active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Data Table */}
      <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
        <CardHeader className="bg-white border-b px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-gray-800">
              Demand Inventory
            </CardTitle>
            <div className="relative w-full sm:w-96 group">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search job titles, companies..."
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
                  <TableHead className="w-[300px] py-4 pl-6 text-xs uppercase font-bold text-gray-500">Employer & Job</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-gray-500 text-center">Quota</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-gray-500">Deadline</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase font-bold text-gray-500">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobDemands.map((jd) => (
                  <TableRow
                    key={jd._id}
                    className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50"
                    onClick={() => onSelectJobDemand(jd)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {jd.jobTitle}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                          {jd.employerId?.employerName || jd.employerName || 'Unknown Employer'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center bg-gray-100 text-gray-700 h-8 w-12 rounded-lg font-bold text-sm">
                        {jd.requiredWorkers}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(jd.status)}
                        className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border-none"
                      >
                        {jd.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600 font-medium">
                        <CalendarIcon date={jd.deadline} />
                      </div>
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
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredJobDemands.length === 0 && (
            <div className="py-20 text-center bg-gray-50/50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-300 mb-4">
                <Search size={32} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">No matches found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                We couldn't find any job demands matching your current search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Mini-Component for Dates
function CalendarIcon({ date }) {
  if (!date) return <span className="text-gray-300">—</span>;
  const d = new Date(date);
  return (
    <span className="flex flex-col">
      <span className="text-gray-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      <span className="text-[10px] text-gray-400 uppercase">{d.getFullYear()}</span>
    </span>
  );
}