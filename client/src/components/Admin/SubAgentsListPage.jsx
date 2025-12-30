"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Plus } from 'lucide-react';

export function SubAgentListPage({ subAgents, onSelectSubAgent, onAddAgent, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredSubAgents = subAgents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sub Agents</h1>
          <p className="text-gray-600 mt-2">Manage and monitor sub-agent performance</p>
        </div>
        <button 
          onClick={onAddAgent}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Add Sub Agent
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sub Agents ({filteredSubAgents.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search sub agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                <TableHead>Total Workers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading agents...</TableCell></TableRow>
              ) : filteredSubAgents.map((agent) => (
                <TableRow
                  key={agent._id}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  onClick={() => onSelectSubAgent(agent)}
                >
                  <TableCell className="font-medium text-blue-600">{agent.name}</TableCell>
                  <TableCell>{agent.country}</TableCell>
                  <TableCell className="font-mono text-sm">{agent.contact}</TableCell>
                  <TableCell className="font-semibold text-center">
                    {agent.totalWorkersBrought || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(agent.status)}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredSubAgents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    No sub agents found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}