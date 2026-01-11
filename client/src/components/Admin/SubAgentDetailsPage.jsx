"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/Badge';
import { Users, Phone, MapPin, Calendar, Trash2 } from 'lucide-react';

export function SubAgentDetailsPage({ agent, workers = [], onDelete, onStatusChange }) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{agent.name}</h2>
          <div className="flex gap-4 mt-2 text-gray-600">
            <span className="flex items-center gap-1"><MapPin size={16}/> {agent.country}</span>
            <span className="flex items-center gap-1"><Phone size={16}/> {agent.contact}</span>
            <span className="flex items-center gap-1"><Calendar size={16}/> Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-3">
            <select 
                value={agent.status}
                onChange={(e) => onStatusChange(agent._id, e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
            </select>
            <button 
                onClick={() => onDelete(agent._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Agent"
            >
                <Trash2 size={20} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Workers</p>
                <h3 className="text-2xl font-bold">{workers.length}</h3>
              </div>
              <Users className="text-blue-200" size={40} />
            </div>
          </CardContent>
        </Card>
        {/* Add more stats cards here if needed */}
      </div>

      {/* Workers List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workers Brought by {agent.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker Name</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Job Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    No workers have been registered under this agent yet.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow key={worker._id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell className="font-mono text-sm">{worker.passportNumber}</TableCell>
                    <TableCell>{worker.category}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{worker.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(worker.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}