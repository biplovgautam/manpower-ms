// src/components/Employee/WorkerDetailsPage.jsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
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
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Clock,
  Check,
} from 'lucide-react';

export function WorkerDetailsPage({ worker, onNavigate, onUpdateWorkerStage }) {
  const [localTimeline, setLocalTimeline] = useState([]);

  // Sync local state with prop when worker changes
  useEffect(() => {
    if (worker?.stageTimeline) {
      setLocalTimeline(worker.stageTimeline);
    }
  }, [worker]);

  if (!worker) {
    return (
      <div className="container py-10">
        <Button variant="outline" onClick={() => onNavigate('list')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workers
        </Button>

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Worker profile not found
          </CardContent>
        </Card>
      </div>
    );
  }

  // Documents preparation
  const documents = (worker.documents || []).map((doc, index) => ({
    id: doc._id || `doc-${index}`,
    name: doc.name || 'Untitled Document',
    category: doc.category || 'other',
    uploadedAt: doc.uploadedAt
      ? new Date(doc.uploadedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A',
    status: doc.status || 'pending',
    path: doc.path,
  }));

  const totalStages = localTimeline.length;
  const completedStages = localTimeline.filter(s => s.status === 'completed').length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const handleStatusChange = async (stageId, newStatus) => {
    // Optimistic update
    const updated = localTimeline.map(stage =>
      stage._id === stageId ? { ...stage, status: newStatus } : stage
    );
    setLocalTimeline(updated);

    // Try to save to backend
    try {
      await onUpdateWorkerStage?.(worker._id, stageId, newStatus);
    } catch (err) {
      console.error('Stage update failed:', err);
      // Revert optimistic update
      setLocalTimeline(worker.stageTimeline || []);
      alert('Failed to save stage update. Changes reverted.');
    }
  };

  const handleDownload = (doc) => {
    if (!doc.path) {
      alert('No file available for this document');
      return;
    }

    const base = 'http://localhost:5000';
    const path = doc.path.replace(/\\/g, '/');
    const url = path.startsWith('http') ? path : `${base}/${path}`;

    window.open(url, '_blank');
  };

  const getStatusVariant = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'completed' || s === 'approved') return 'success';
    if (s.includes('progress') || s === 'processing') return 'warning';
    if (s === 'rejected') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => onNavigate('list')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{worker.name || 'Worker'}</h1>
            <p className="text-muted-foreground">
              Passport: {worker.passportNumber || '—'}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => onNavigate('edit', worker)}>
          Edit Profile
        </Button>
      </div>

      {/* Info cards - 2 columns on lg */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{worker.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{worker.contact || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passport Number</p>
              <p className="font-mono font-medium">{worker.passportNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <Badge variant={progress === 100 ? 'success' : 'secondary'}>
                {progress}% Complete
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="p-6 bg-muted/40 rounded-lg">
                <p className="text-4xl font-bold">{progress}%</p>
                <p className="text-sm text-muted-foreground mt-1">Overall Progress</p>
              </div>
              <div className="p-6 bg-muted/40 rounded-lg">
                <p className="text-4xl font-bold">
                  {completedStages} / {totalStages || '?'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Stages Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content - Timeline + Documents */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Processing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40 text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTimeline.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      No stages configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  localTimeline.map((stage) => (
                    <TableRow key={stage._id}>
                      <TableCell className="font-medium capitalize">
                        {stage.stage?.replace(/-/g, ' ') || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(stage.status)}>
                          {(stage.status || 'pending').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <select
                          value={stage.status || 'pending'}
                          onChange={(e) => handleStatusChange(stage._id, e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      No documents uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{doc.uploadedAt}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}