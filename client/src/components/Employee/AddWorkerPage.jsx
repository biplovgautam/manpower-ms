"use client";
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export function AddWorkerPage({
  employers = [],
  jobDemands = [],
  subAgents = [],
  onNavigate,
  onSave, // Added to handle the actual save logic from parent
  initialData = null,
  isEdit = false
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    dob: initialData?.dob || '',
    passportNumber: initialData?.passportNumber || '',
    contact: initialData?.contact || '',
    address: initialData?.address || '',
    country: initialData?.country || 'Nepal',
    employerId: initialData?.employerId || employers[0]?._id || '',
    jobDemandId: initialData?.jobDemandId || jobDemands[0]?._id || '',
    subAgentId: initialData?.subAgentId || subAgents[0]?.id || '',
    status: initialData?.status || 'pending',
    currentStage: initialData?.currentStage || 'interview',
    notes: initialData?.notes || '',
    documents: [],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleChange('documents', Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If you are using the onSave prop from the parent (recommended)
      if (onSave) {
        await onSave(formData);
      } else {
        // Fallback to direct API call if onSave isn't passed
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (key !== 'documents') data.append(key, formData[key]);
        });
        formData.documents.forEach((file) => data.append('documents', file));

        const response = await fetch('http://localhost:5000/api/workers/add', {
          method: 'POST',
          body: data,
        });

        if (response.ok) {
          onNavigate('list');
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.message}`);
        }
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to save worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter job demands by selected employer
  const filteredJobDemands = formData.employerId
    ? jobDemands.filter((jd) => jd.employerId === formData.employerId)
    : jobDemands;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onNavigate('list')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Edit Worker" : "Add New Worker"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? `Updating information for ${formData.name}` : "Register a new worker for recruitment"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-50">
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter worker's full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                required
              />
              <Input
                label="Passport Number"
                placeholder="e.g., NP1234567"
                value={formData.passportNumber}
                onChange={(e) => handleChange('passportNumber', e.target.value)}
                required
              />
              <Input
                label="Contact Number"
                placeholder="e.g., +977-984..."
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                required
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                required
              />
            </div>
            <Textarea
              label="Address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Assignment Information */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-50">
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Assign to Employer"
                options={employers.map((emp) => ({
                  value: emp._id,
                  label: `${emp.employerName || emp.name} (${emp.country})`,
                }))}
                value={formData.employerId}
                onChange={(e) => {
                  const empId = e.target.value;
                  handleChange('employerId', empId);
                  const firstMatchingJob = jobDemands.find(jd => jd.employerId === empId);
                  if (firstMatchingJob) handleChange('jobDemandId', firstMatchingJob._id);
                }}
                required
              />
              <Select
                label="Assign to Job Demand"
                options={filteredJobDemands.map((jd) => ({
                  value: jd._id,
                  label: jd.title,
                }))}
                value={formData.jobDemandId}
                onChange={(e) => handleChange('jobDemandId', e.target.value)}
                required
              />
              <Select
                label="Assign to Sub-Agent"
                options={subAgents.map((sa) => ({
                  value: sa.id || sa._id,
                  label: sa.name,
                }))}
                value={formData.subAgentId}
                onChange={(e) => handleChange('subAgentId', e.target.value)}
              />
              <Select
                label="Initial Status"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'active', label: 'Active' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-50">
            <CardTitle>Documents & Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Upload Documents</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
              />
              {formData.documents.length > 0 && (
                <ul className="mt-2 text-sm text-gray-500">
                  {formData.documents.map((f, i) => <li key={i}>• {f.name}</li>)}
                </ul>
              )}
            </div>
            <Textarea
              label="Internal Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Worker' : 'Add Worker')}
          </Button>
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => onNavigate('list')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}