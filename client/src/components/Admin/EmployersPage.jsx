import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Search, ArrowLeft, Building2, Briefcase, Users } from 'lucide-react';

export function EmployersPage({
  employers = [],
  onSelectEmployer = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list');
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  // Updated to match your Backend Schema (employerName)
  const filteredEmployers = employers.filter(
    (employer) =>
      employer.employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmployer = (employer) => {
    setSelectedEmployer(employer);
    setView('detail');
    onSelectEmployer(employer);
  };

  if (view === 'detail' && selectedEmployer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedEmployer.employerName}
            </h1>
            <p className="text-gray-600 mt-2">Employer profile and details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Job Demands</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {selectedEmployer.totalJobDemands || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Briefcase size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hires</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {selectedEmployer.totalHires || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <Users size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="mt-2">
                  <Badge
                    variant={selectedEmployer.status === 'active' ? 'success' : 'default'}
                    className="text-base px-3 py-1"
                  >
                    {selectedEmployer.status || 'active'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <Building2 size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">{selectedEmployer.employerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-medium text-gray-900">{selectedEmployer.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Number</p>
                <p className="font-medium text-gray-900">{selectedEmployer.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{selectedEmployer.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Added On</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedEmployer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium text-gray-900">
                  {selectedEmployer.createdBy}
                </p>
              </div>
              {selectedEmployer.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium text-gray-900">{selectedEmployer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employers</h1>
          <p className="text-gray-600 mt-2">Manage all employer records</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Employers ({filteredEmployers.length})</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search employers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Job Demands</TableHead>
                <TableHead>Total Hires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployers.map((employer) => (
                <TableRow
                  key={employer._id} // Mongoose uses _id
                  onClick={() => handleSelectEmployer(employer)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{employer.employerName}</TableCell>
                  <TableCell>{employer.country}</TableCell>
                  <TableCell>{employer.contact}</TableCell>
                  <TableCell>{employer.totalJobDemands || 0}</TableCell>
                  <TableCell>{employer.totalHires || 0}</TableCell>
                  <TableCell>
                    <Badge variant={employer.status === 'active' ? 'success' : 'default'}>
                      {employer.status || 'active'}
                    </Badge>
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