import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, Download, Mail, Phone, MapPin, FileText, Check } from 'lucide-react';

export function WorkerDetailsPage({ worker, onNavigate, onUpdateWorkerStage }) {
  
  const workerDocuments = (worker.documents || []).map((doc, index) => ({
    id: doc._id || index,
    fileName: typeof doc === 'string' ? doc : doc.fileName,
    type: doc.type || 'Document'
  }));

  const processingStages = worker.stageTimeline || [];
  const completedStages = processingStages.filter(s => s.status === 'completed').length;

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => onNavigate('list')}>← Back</Button>
          <div>
            <h1 className="text-3xl font-bold">{worker.name}</h1>
            <p className="text-gray-500">Passport: {worker.passportNumber}</p>
          </div>
        </div>
        <Button onClick={() => onNavigate('edit')}>Edit Profile</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm"><Mail size={14}/> {worker.email || 'N/A'}</div>
            <div className="flex items-center gap-2 text-sm"><Phone size={14}/> {worker.contact}</div>
            <div className="flex items-center gap-2 text-sm"><MapPin size={14}/> {worker.address}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Employer:</strong> {worker.employerId?.name || 'Unassigned'}</p>
            <p><strong>Job:</strong> {worker.jobTitle || 'General'}</p>
            <p><strong>Agent:</strong> {worker.subAgentId?.name || 'Direct'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent className="text-center">
             <p className="text-3xl font-bold text-blue-600">
               {completedStages} / {processingStages.length}
             </p>
             <p className="text-xs uppercase text-gray-500">Stages Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processingStages.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.stage}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(s.status)}>{s.status.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status !== 'completed' && (
                      <Button size="sm" variant="ghost" onClick={() => onUpdateWorkerStage(worker._id, s._id, 'completed')}>
                        <Check size={16} className="text-green-600" />
                      </Button>
                    )}
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