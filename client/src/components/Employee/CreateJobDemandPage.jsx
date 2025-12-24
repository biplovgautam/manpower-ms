"use client";
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export function CreateJobDemandPage({
  employers = [],
  onNavigate,
  onSave,
  initialData = null,
  isEditing = false
}) {
  const [formData, setFormData] = useState({
    employerName: '',
    jobTitle: '',
    requiredWorkers: '',
    description: '',
    salary: '',
    skills: '',
    deadline: '',
    status: 'open', // Default status
    documents: [],
  });

  // Status options for the dropdown
  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
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
        skills: Array.isArray(initialData.skills) ? initialData.skills.join(', ') : initialData.skills || '',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
        status: initialData.status || 'open',
        documents: [],
      });
    } else if (employers.length > 0 && !formData.employerName) {
      setFormData(prev => ({ ...prev, employerName: employers[0].employerName }));
    }
  }, [initialData, employers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      requiredWorkers: parseInt(formData.requiredWorkers, 10),
      skills: formData.skills.split(',').map((s) => s.trim()).filter(s => s !== ''),
    };
    onSave(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Job Demand' : 'Create Job Demand'}
          </h1>
          <p className="text-gray-600">Fill in the details for the recruitment requirement.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Employer"
                options={employers.map((emp) => ({
                  value: emp.employerName,
                  label: emp.employerName,
                }))}
                value={formData.employerName}
                onChange={(e) => handleChange('employerName', e.target.value)}
                required
              />

              {/* Added Status Field */}
              <Select
                label="Demand Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              />
            </div>

            <Input
              label="Job Title"
              placeholder="e.g. Electrical Engineer"
              value={formData.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Required Workers"
                type="number"
                value={formData.requiredWorkers}
                onChange={(e) => handleChange('requiredWorkers', e.target.value)}
                required
              />
              <Input
                label="Salary"
                placeholder="e.g. 2500 QR + Food"
                value={formData.salary}
                onChange={(e) => handleChange('salary', e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Job Description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />

            <Input
              label="Required Skills (Comma separated)"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
              required
            />

            <Input
              label="Submission Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              required
            />

            <div className="flex gap-3 pt-6">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Update Job Demand' : 'Create Job Demand'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('list')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}