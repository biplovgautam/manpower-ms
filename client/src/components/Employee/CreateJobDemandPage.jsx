"use client";
import { ArrowLeft, FileText, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';

export function CreateJobDemandPage({ employers = [], onNavigate, onSave, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    employerName: '',
    jobTitle: '',
    requiredWorkers: '',
    description: '',
    salary: '',
    tenure: '',
    skills: '',
    deadline: '',
    status: 'open',
    documents: [],
  });

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        employerName: initialData.employerId?.employerName || initialData.employerName || '',
        jobTitle: initialData.jobTitle || '',
        requiredWorkers: initialData.requiredWorkers || '',
        description: initialData.description || '',
        salary: initialData.salary || '',
        tenure: initialData.tenure || '',
        skills: Array.isArray(initialData.skills) ? initialData.skills.join(', ') : initialData.skills || '',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
        status: initialData.status || 'open',
        documents: initialData.documents || [],
      });
    } else if (employers.length > 0 && !formData.employerName) {
      setFormData(prev => ({ ...prev, employerName: employers[0].employerName }));
    }
  }, [initialData, employers]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    // In production, upload to S3 here and return the URL
    const newDocs = files.map(file => ({
      name: file.name,
      url: "#", // Replace with real URL after upload
      fileType: file.type
    }));
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      requiredWorkers: parseInt(formData.requiredWorkers, 10),
      skills: formData.skills.split(',').map((s) => s.trim()).filter(s => s !== ''),
    };
    onSave(submissionData);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Job Demand' : 'Create Job Demand'}</h1>
          <p className="text-gray-600">Enter requirements for {formData.employerName || 'the employer'}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Employer"
                options={employers.map((emp) => ({ value: emp.employerName, label: emp.employerName }))}
                value={formData.employerName}
                onChange={(e) => handleChange('employerName', e.target.value)}
                required
              />
              <Select
                label="Demand Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              />
            </div>
            <Input label="Job Title" placeholder="e.g. Electrical Engineer" value={formData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} required />
          </CardContent>

          <CardHeader><CardTitle className="pt-4">Contract & Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Required Workers" type="number" value={formData.requiredWorkers} onChange={(e) => handleChange('requiredWorkers', e.target.value)} required />
              <Input label="Salary Details" placeholder="e.g. 2500 QR + Food" value={formData.salary} onChange={(e) => handleChange('salary', e.target.value)} required />
              <Input label="Contract Tenure" placeholder="e.g. 2 Years" value={formData.tenure} onChange={(e) => handleChange('tenure', e.target.value)} required />
            </div>
            <Textarea label="Job Description" rows={3} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} required />
            <Input label="Required Skills (Comma separated)" value={formData.skills} onChange={(e) => handleChange('skills', e.target.value)} required />
            <Input label="Submission Deadline" type="date" value={formData.deadline} onChange={(e) => handleChange('deadline', e.target.value)} required />
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader><CardTitle>Documentation</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="text-gray-400 mb-2" size={32} />
                <span className="text-blue-600 font-medium">Click to upload documents</span>
                <span className="text-gray-500 text-sm">Demand Letter, POA, or Agreement</span>
              </label>
            </div>

            {formData.documents.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="text-gray-400 shrink-0" />
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-lg">
            {isEditing ? 'Update Job Demand' : 'Create Job Demand'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onNavigate('list')} className="flex-1 h-12 text-lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}