import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'; 
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../ui/table'; 
import { 
  Download, FileText, Check, Clock, ArrowLeft, ExternalLink, CheckCircle2
} from 'lucide-react';

export function WorkerDetailsPage({ worker, onNavigate, onUpdateWorkerStage }) {
  // Local state to allow instant UI updates when changing status
  const [localTimeline, setLocalTimeline] = useState([]);

  // Sync local state when the worker prop changes from the parent/database
  useEffect(() => {
    if (worker?.stageTimeline) {
      setLocalTimeline(worker.stageTimeline);
    }
  }, [worker]);

  if (!worker) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => onNavigate('list')} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Workers
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">Worker profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- DATA MAPPING ---
  const workerDocuments = (worker.documents || []).map((doc, index) => ({
    id: doc._id || index,
    name: doc.name || 'Untitled Document',
    category: doc.category || 'other',
    uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A',
    status: doc.status || 'pending',
    path: doc.path 
  }));

  const totalStages = localTimeline.length || 0;
  const completedStages = localTimeline.filter(s => s.status === 'completed').length;
  const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // INTERNAL HANDLER: Updates UI immediately, then calls parent function
  const handleStatusChange = async (stageId, newStatus) => {
    // 1. Update UI locally so it feels fast
    const updatedTimeline = localTimeline.map(stage => 
      stage._id === stageId ? { ...stage, status: newStatus } : stage
    );
    setLocalTimeline(updatedTimeline);

    // 2. Call the parent prop to update the database
    if (onUpdateWorkerStage) {
      try {
        await onUpdateWorkerStage(worker._id, stageId, newStatus);
      } catch (error) {
        console.error("Failed to update status in database:", error);
        // Optional: Revert local state if database update fails
        setLocalTimeline(worker.stageTimeline);
        alert("Failed to save changes to server.");
      }
    }
  };

  const handleDownload = (doc) => {
    if (!doc.path) return alert("No file path found");
    const baseUrl = 'http://localhost:5000';
    const cleanPath = doc.path.replace(/\\/g, '/');
    const url = cleanPath.startsWith('http') ? cleanPath : `${baseUrl}/${cleanPath}`; 
    window.open(url, '_blank');
  };

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'success';
    if (s === 'processing' || s === 'in-progress') return 'warning';
    if (s === 'rejected') return 'destructive';
    return 'default';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => onNavigate('list')} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Workers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{worker.name}</h1>
            <p className="text-gray-600 mt-1">Worker Profile & Progress</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => onNavigate('edit', worker)}>Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="text-lg font-semibold truncate">{worker.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-lg font-mono font-semibold">{worker.contact}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Passport Number</p>
                <p className="text-lg font-mono font-semibold">{worker.passportNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Status</p>
                <div className="mt-1">
                  <Badge variant={progressPercentage === 100 ? 'success' : 'warning'}>
                    {progressPercentage === 100 ? 'Fully Processed' : 'In Progress'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process Overview Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Process Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-3xl font-bold text-blue-600">{progressPercentage}%</p>
                <p className="text-sm font-medium text-blue-700 mt-1">Overall Progress</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <p className="text-3xl font-bold text-green-600">{completedStages}/{totalStages}</p>
                <p className="text-sm font-medium text-green-700 mt-1">Stages Completed</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
                 {['Passport', 'Medical', 'Police', 'Insurance'].map(label => {
                   const isUploaded = workerDocuments.some(d => d.name.toLowerCase().includes(label.toLowerCase()) || d.category.toLowerCase().includes(label.toLowerCase()));
                   return (
                     <Badge 
                       key={label} 
                       variant={isUploaded ? "success" : "outline"} 
                       className="text-[10px]"
                     >
                       {isUploaded && <Check size={10} className="mr-1" />} {label}
                     </Badge>
                   );
                 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Processing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTimeline.map((stage) => (
                  <TableRow key={stage._id}>
                    <TableCell className="font-medium capitalize">
                      {stage.stage ? stage.stage.replace(/-/g, ' ') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(stage.status)}>
                        {(stage.status || 'pending').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <select 
                        className="text-xs border rounded-md p-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={stage.status}
                        onChange={(e) => handleStatusChange(stage._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerDocuments.length > 0 ? (
                  workerDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <p className="font-semibold text-sm">{doc.name}</p>
                        <p className="text-[10px] text-gray-400">{doc.uploadedAt}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{doc.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleDownload(doc)} title="Download">
                            <Download size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500" onClick={() => handleDownload(doc)} title="View External">
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-4">No documents uploaded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}