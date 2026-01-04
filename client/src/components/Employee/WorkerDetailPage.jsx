import React from 'react';
// 1. Double check these file names (case-sensitivity matters in Next.js)
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table'; 
import { 
  Download, Mail, Phone, MapPin, 
  FileText, Check, Clock, ArrowLeft, Briefcase, ShieldCheck 
} from 'lucide-react';

export function WorkerDetailsPage({ worker, onNavigate, onUpdateWorkerStage }) {
  // Guard clause: If worker data hasn't loaded yet, show a loader instead of crashing
  if (!worker) {
    return <div className="p-20 text-center font-medium text-gray-500">Loading worker profile...</div>;
  }

  // --- DATA MAPPING ---
  const workerDocuments = (worker.documents || []).map((doc, index) => ({
    id: doc._id || index,
    name: doc.category || 'Other Document',
    uploadedAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A',
    status: doc.status || 'pending'
  }));

  const processingStages = worker.stageTimeline || [];
  const completedStages = processingStages.filter(s => s.status === 'completed').length;
  const totalStages = processingStages.length;
  const approvedDocs = workerDocuments.filter(d => d.status === 'approved' || d.status === 'completed').length;

  // --- HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => onNavigate('list')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{worker.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><FileText size={14} /> {worker.passportNumber}</span>
              <span className="flex items-center gap-1"><Mail size={14} /> {worker.email || 'No Email'}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => onNavigate('edit')}>Edit Profile</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Contact & Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 text-blue-500" size={16} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Email Address</p>
                <p className="text-sm font-medium">{worker.email || 'Not Provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 text-blue-500" size={16} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Phone Number</p>
                <p className="text-sm font-medium">{worker.contact}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 text-blue-500" size={16} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Address</p>
                <p className="text-sm font-medium">{worker.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Deployment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-1 text-gray-400" size={16} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Employer</p>
                <p className="text-sm font-bold text-blue-700">{worker.employerId?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Job Title</p>
                <p className="text-sm font-medium">{worker.jobTitle || 'General'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Agent</p>
                <p className="text-sm font-medium">{worker.subAgentId?.name || 'Direct'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents Checklist */}
        <Card className="bg-slate-50 border-dashed border-2">
          <CardHeader><CardTitle className="text-lg">Required Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-gray-600">Verification Progress</span>
                 <span className="text-xs font-bold text-green-600">{approvedDocs} Verified</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {['Passport', 'Medical', 'Police Report', 'Insurance'].map(docName => {
                   const isDone = workerDocuments.some(d => d.name.includes(docName) && d.status === 'approved');
                   return (
                     <Badge key={docName} variant={isDone ? "default" : "outline"} className={isDone ? "bg-green-600" : "bg-white"}>
                       {isDone && <Check size={10} className="mr-1" />} {docName}
                     </Badge>
                   );
                 })}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader className="border-b"><CardTitle className="text-md">Processing Timeline</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processingStages.map((stage) => (
                  <TableRow key={stage._id}>
                    <TableCell className="font-medium text-sm">{stage.stage}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(stage.status)}>{stage.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {stage.status !== 'completed' ? (
                        <select 
                          className="text-xs border rounded p-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                          value={stage.status}
                          onChange={(e) => onUpdateWorkerStage(worker._id, stage._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <Check size={16} className="text-green-600 ml-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card>
          <CardHeader className="border-b"><CardTitle className="text-md">Document Repository</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <p className="font-bold text-xs">{doc.name}</p>
                      <p className="text-[10px] text-gray-400">{doc.uploadedAt}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{doc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}