"use client";
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Plus, User, FileText, ArrowUpRight } from 'lucide-react';

export function WorkerManagementPage({ 
  workers = [], 
  onNavigate, 
  onSelectWorker 
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter workers based on Search Input (Name or Passport)
  const filteredWorkers = workers.filter(worker => 
    worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'deployed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Deployed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
          <p className="text-gray-500 text-sm">Manage and track worker processing status</p>
        </div>
        <Button 
          onClick={() => onNavigate('add')} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={18} />
          Add New Worker
        </Button>
      </div>

      {/* Statistics Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase">Total Workers</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <User size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase">In Processing</p>
                <p className="text-2xl font-bold">
                  {workers.filter(w => w.status === 'processing').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                <FileText size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase">Deployed</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.status === 'deployed' || w.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <Check size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Section */}
      <Card className="overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-white border-b px-6 py-4">
          <div className="flex items-center bg-gray-50 px-3 py-2 rounded-md border w-full max-w-md">
            <Search className="text-gray-400 mr-2" size={18} />
            <input 
              type="text"
              placeholder="Search by name or passport..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[250px]">Worker Name</TableHead>
                  <TableHead>Passport No.</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <TableRow 
                      key={worker._id} 
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                      onClick={() => onSelectWorker(worker)}
                    >
                      <TableCell>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {worker.name}
                        </div>
                        <div className="text-xs text-gray-500">{worker.contact}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {worker.passportNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {worker.employerId?.name || (
                          <span className="text-gray-400 italic">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(worker.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 group-hover:bg-blue-100"
                        >
                          View Details
                          <ArrowUpRight size={14} className="ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                      No workers found.
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

// Sub-component for icons
const Check = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);