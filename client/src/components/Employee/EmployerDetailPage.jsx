"use client";
import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ArrowLeft, Building2, Calendar, Edit, Mail, MapPin, Phone, Trash2, Users } from 'lucide-react';

export function EmployerDetailsPage({ employer, onNavigate, onDelete }) {
  // Handle empty state
  if (!employer) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => onNavigate('list')}>
          <ArrowLeft className="mr-2" size={18} /> Back to List
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Employer data not found or still loading.
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === 'active') return 'success';
    if (s === 'pending') return 'warning';
    return 'default';
  };

  // Mock data for the table and statistics
  const mockStats = {
    totalJobDemands: 12,
    activeWorkers: 45,
    lastActivity: '2 days ago'
  };

  const recentJobDemands = [
    { id: 'jd1', title: 'Construction Worker', vacancies: 20, status: 'open', date: '2023-10-15' },
    { id: 'jd6', title: 'Security Guard', vacancies: 25, status: 'open', date: '2023-11-02' },
    { id: 'jd2', title: 'Factory Operator', vacancies: 15, status: 'closed', date: '2023-08-20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onNavigate('list')}
            className="rounded-full h-10 w-10"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employer.employerName}</h1>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Badge variant={getStatusVariant(employer.status || 'active')}>
                {employer.status || 'Active'}
              </Badge>
              <span>•</span>
              <span className="text-sm">Added on {new Date(employer.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => onNavigate('edit')} // This triggers the edit form
          >
            <Edit size={16} /> Edit Details
          </Button>
          <Button 
            variant="ghost" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
            onClick={() => onDelete(employer._id)}
          >
            <Trash2 size={16} /> Delete
          </Button>
          <Button className="bg-blue-600 text-white">Create Job Demand</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="text-blue-500" size={20} />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Country</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-lg font-medium">{employer.country}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Number</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-lg font-mono">{employer.contact}</span>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Official Address</p>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin size={16} className="text-gray-400 mt-1" />
                    <span className="text-lg">{employer.address}</span>
                  </div>
                </div>

                {employer.notes && (
                  <div className="space-y-1 md:col-span-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Internal Notes</p>
                    <p className="text-amber-800 text-sm italic mt-1">"{employer.notes}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Demands Table */}
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg">Recent Job Demands</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="pl-6">Job Title</TableHead>
                    <TableHead>Vacancies</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobDemands.map((jd) => (
                    <TableRow key={jd.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium pl-6">{jd.title}</TableCell>
                      <TableCell>{jd.vacancies}</TableCell>
                      <TableCell>
                        <Badge variant={jd.status === 'open' ? 'success' : 'default'}>
                          {jd.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 pr-6">
                        {new Date(jd.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Stats & Activity */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users size={24} />
                  </div>
                  <span className="text-white/60 text-sm">Real-time stats</span>
                </div>
                <div>
                  <p className="text-4xl font-bold">{mockStats.activeWorkers}</p>
                  <p className="text-blue-100 text-sm mt-1">Active Workers Placed</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="text-center">
                    <p className="font-bold text-lg">{mockStats.totalJobDemands}</p>
                    <p className="text-xs text-blue-200 uppercase">Demands</p>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10"></div>
                  <div className="text-center">
                    <p className="font-bold text-lg">98%</p>
                    <p className="text-xs text-blue-200 uppercase">Retention</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                Latest Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">New Job Demand Created</p>
                    <p className="text-xs text-gray-500">Construction Worker (20 vacancies)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Worker Allocation</p>
                    <p className="text-xs text-gray-500">5 workers assigned to Security Guard role</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}