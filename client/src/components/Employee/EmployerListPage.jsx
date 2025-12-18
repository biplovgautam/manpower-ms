"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
// FIX: Add curly braces here
import { Input } from '../ui/Input'; 
import { Button } from '../ui/Button';
// FIX: Add curly braces here
import { Badge } from '../ui/Badge';
import { Search, Plus } from 'lucide-react';

export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployers = employers.filter(emp => 
    (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Employers</h1>
        <Button onClick={() => onNavigate('add')}><Plus size={18} className="mr-2" />Add Employer</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Employers ({filteredEmployers.length})</CardTitle>
            <div className="relative"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <Input className="pl-10" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployers.map((emp) => (
                <TableRow key={emp._id} onClick={() => onSelectEmployer(emp)} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{emp.employerName}</TableCell>
                  <TableCell>{emp.country}</TableCell>
                  <TableCell>{emp.contact}</TableCell>
                  <TableCell><Badge variant={emp.status === 'active' ? 'success' : 'default'}>{emp.status || 'Active'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}