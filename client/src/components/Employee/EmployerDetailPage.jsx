"use client";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Edit,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployerDetailsPage({ employer, onNavigate, onDelete, isLoading, onCreateDemand }) {
  if (!employer) return null;

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active' || s === 'open') return 'default';
    if (s === 'pending') return 'secondary';
    if (s === 'closed' || s === 'filled') return 'destructive';
    return 'outline';
  };

  const demands = employer.demands || [];
  const workers = employer.workers || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => onNavigate('list')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Directory
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Building2 size={40} />
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold text-gray-900">{employer.employerName}</h1>
                  {isLoading && <Loader2 className="animate-spin text-blue-600" size={24} />}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={getStatusVariant(employer.status)}>
                    {employer.status || 'Active'}
                  </Badge>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <ShieldCheck size={16} className="text-green-600" />
                    Verified Employer
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => onNavigate('edit')}
                className="px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
              >
                <Edit size={18} />
                Edit Profile
              </Button>
              <Button
                onClick={onCreateDemand}
                className="px-6 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Create Job Demand
              </Button>
            </div>
          </div>
        </div>

        {/* General Information */}
        <Card className="mb-10 border-0 shadow-lg rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-800">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoItem label="Company Name" value={employer.employerName} icon={<Building2 size={20} />} />
              <InfoItem label="Country" value={employer.country} icon={<Globe size={20} />} />
              <InfoItem label="Address" value={employer.address} icon={<MapPin size={20} />} />
              <InfoItem label="Contact" value={employer.contact} icon={<Phone size={20} />} isMono />
              <InfoItem label="Registered" value={new Date(employer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} icon={<Calendar size={20} />} />
            </div>
          </CardContent>
        </Card>

        {/* Job Demands & Workers - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Job Demands */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <Briefcase size={24} />
                  Job Demands
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {demands.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">Job Title</TableHead>
                    <TableHead className="font-medium text-gray-700">Required</TableHead>
                    <TableHead className="font-medium text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demands.length > 0 ? demands.map((jd) => (
                    <TableRow key={jd._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div>{jd.jobTitle}</div>
                        <div className="text-xs text-gray-500 mt-1">Ref: {jd._id.slice(-6)}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg text-blue-600">{jd.requiredWorkers || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(jd.status)} className="capitalize">
                          {jd.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {new Date(jd.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                        No job demands yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Workers */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <Users size={24} />
                  Current Workforce
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {workers.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {workers.length > 0 ? workers.slice(0, 10).map((w) => (
                  <div key={w._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {(w.fullName || w.name)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{w.fullName || w.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{w.status || 'active'}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                )) : (
                  <p className="text-center py-12 text-gray-500">No workers placed yet</p>
                )}
              </div>
              {workers.length > 10 && (
                <Button variant="ghost" className="w-full mt-4 font-medium">
                  View All Workers →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50/50 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Danger Zone</h3>
                  <p className="text-sm text-gray-600">Irreversible action</p>
                </div>
              </div>
              
              <div className="h-px bg-red-200 my-6" />
              <p className="text-gray-700 mb-8 leading-relaxed">
                Deleting this employer will permanently remove their profile, all job demands, and worker records. This cannot be undone.
              </p>
              <Button
                onClick={() => onDelete(employer._id)}
                variant="destructive"
                className="w-full rounded-xl font-medium inline-flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Employer Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon, isMono = false }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 p-2.5 rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`font-semibold text-gray-900 ${isMono ? 'font-mono text-lg' : ''}`}>
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  );
}