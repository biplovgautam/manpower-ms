import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'; 
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../ui/table'; 
import { 
  Download, Mail, Phone, MapPin, 
  FileText, Check, Clock, ArrowLeft, Briefcase, ExternalLink
} from 'lucide-react';

export function WorkerDetailsPage({ worker, onNavigate, onUpdateWorkerStage }) {
  
  if (!worker) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Loading worker profile...</p>
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

  const processingStages = worker.stageTimeline || [];
  
  // Progress Logic: Count 'completed' stages for the progress bar
  const totalStages = processingStages.length || 1;
  const completedStages = processingStages.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedStages / totalStages) * 100;

  // --- HANDLERS ---
  const handleDownload = (doc) => {
    if (!doc.path) return alert("No file path found");
    // Ensure this matches your backend static assets folder
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${doc.path.replace(/\\/g, '/')}`; 
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed': case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('list')}>
            <ArrowLeft size={18} className="mr-2" /> Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{worker.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1.5"><FileText size={14} /> {worker.passportNumber}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} /> {worker.email || 'No email provided'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => onNavigate('edit', worker)}>Edit Profile</Button>
           <Button size="sm">Generate Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Details */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 text-blue-600" size={16} />
              <div>
                <p className="text-sm font-semibold truncate">{worker.email || 'Not Available'}</p>
                <p className="text-xs text-gray-400">Primary Email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 text-blue-600" size={16} />
              <div>
                <p className="text-sm font-semibold">{worker.contact}</p>
                <p className="text-xs text-gray-400">Phone Number</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 text-blue-600" size={16} />
              <div>
                <p className="text-sm font-semibold">{worker.address}, {worker.country || 'Nepal'}</p>
                <p className="text-xs text-gray-400">Residential Address</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment - Populated from Controller */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Employment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 text-gray-500" size={16} />
              <div className="w-full">
                <p className="text-xs text-gray-400">Assigned Employer</p>
                <p className="text-sm font-bold text-blue-800">
                  {worker.employerId?.employerName || worker.employerId?.name || 'Unassigned'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-400">Job Role</p>
                <p className="text-sm font-medium">{worker.jobDemandId?.jobTitle || 'General Worker'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Recruitment Agent</p>
                <p className="text-sm font-medium">{worker.subAgentId?.name || 'Direct Entry'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Progress */}
        <Card className="bg-slate-50 border-dashed shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Process Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between items-end mb-1">
                 <span className="text-xs font-bold text-blue-700">{Math.round(progressPercentage)}% Complete</span>
                 <span className="text-[10px] text-gray-400">{completedStages}/{totalStages} Stages</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                   style={{ width: `${progressPercentage}%` }}
                 ></div>
               </div>
               <div className="flex flex-wrap gap-2">
                 {['Passport', 'Medical', 'Police', 'Insurance'].map(label => {
                   const isUploaded = workerDocuments.some(d => d.name.toLowerCase().includes(label.toLowerCase()));
                   return (
                     <Badge 
                       key={label} 
                       variant={isUploaded ? "default" : "outline"} 
                       className={`${isUploaded ? "bg-green-600" : "bg-white text-gray-400"} text-[10px]`}
                     >
                       {isUploaded && <Check size={10} className="mr-1" />} {label}
                     </Badge>
                   );
                 })}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Section */}
        <Card className="shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Processing Timeline
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="pl-6">Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processingStages.length > 0 ? processingStages.map((stage) => (
                  <TableRow key={stage._id}>
                    <TableCell className="font-medium text-sm pl-6 capitalize">
                      {stage.stage.replace(/-/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(stage.status)} border px-2 py-0`}>
                        {stage.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <select 
                        className="text-xs border rounded-md p-1.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={stage.status}
                        onChange={(e) => onUpdateWorkerStage(worker._id, stage._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-400">No stages found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Documents Repository */}
        <Card className="shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> Document Repository
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="pl-6">Document Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerDocuments.length > 0 ? workerDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="pl-6">
                      <p className="font-semibold text-sm">{doc.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{doc.uploadedAt}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] capitalize">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                          onClick={() => handleDownload(doc)}
                          title="Download File"
                        >
                          <Download size={14} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-gray-500" 
                          onClick={() => handleDownload(doc)} // "View" uses same download link for simplicity
                          title="View Online"
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-400">No documents available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}