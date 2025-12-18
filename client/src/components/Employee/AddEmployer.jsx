"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input, Textarea } from '../ui/Input'; // Ensure Textarea is exported in Input.jsx
import { Button } from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

export function AddEmployerPage({ onNavigate, onSave }) {
  const [formData, setFormData] = useState({
    employerName: '',
    country: '',
    contact: '',
    address: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => onNavigate('list')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Employer</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Employer Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Employer Name" 
              value={formData.employerName} 
              onChange={(e) => handleChange('employerName', e.target.value)} 
              required 
            />
            <Input 
              label="Country" 
              value={formData.country} 
              onChange={(e) => handleChange('country', e.target.value)} 
              required 
            />
            <Input 
              label="Contact Details" 
              value={formData.contact} 
              onChange={(e) => handleChange('contact', e.target.value)} 
              required 
            />
            <Textarea 
              label="Address" 
              value={formData.address} 
              onChange={(e) => handleChange('address', e.target.value)} 
              required 
            />
            <Textarea 
              label="Internal Notes" 
              value={formData.notes} 
              onChange={(e) => handleChange('notes', e.target.value)} 
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600 text-white">Save Employer</Button>
              <Button type="button" variant="outline" onClick={() => onNavigate('list')} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}