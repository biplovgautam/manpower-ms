"use client";

import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function SubAgentListPage({ subAgents = [], onSelectSubAgent, isLoading }) {
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
      agent.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sub Agents</h1>
          <p className="text-gray-600 mt-2">Overview of registered agents and recruitment volume.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              Agent Directory <span className="text-sm font-normal text-gray-500 ml-2">({filteredSubAgents.length} agents)</span>
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Agent Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-center">Workers Brought</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      Loading agent data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSubAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    No agents found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubAgents.map((agent) => (
                  <TableRow
                    key={agent._id}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                    onClick={() => onSelectSubAgent(agent)}
                  >
                    <TableCell className="font-semibold text-blue-600">
                      {agent.name}
                    </TableCell>
                    <TableCell className="text-gray-600">{agent.country}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-900">
                          {/* The backend now provides totalWorkersBrought via aggregation */}
                          {agent.totalWorkersBrought || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(agent.status)} className="capitalize">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-blue-500 text-sm font-medium group-hover:underline">
                        View Details →
                      </span>
                    </TableCell>
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