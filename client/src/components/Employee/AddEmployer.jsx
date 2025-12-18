"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input, Textarea } from '../ui/Input'; 
import { Button } from '../ui/Button';
import { ArrowLeft, AlertCircle, Save } from 'lucide-react';

export function AddEmployerPage({ onNavigate, onSave, initialData = null, isEdit = false }) {
  // Initialize form with existing data if isEdit is true, otherwise empty
  const [formData, setFormData] = useState({
    employerName: initialData?.employerName || '',
    country: initialData?.country || '',
    contact: initialData?.contact || '',
    address: initialData?.address || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'active', // Default to active for new employers
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If initialData changes (e.g., selecting a different employer to edit), update form
  useEffect(() => {
    if (initialData) {
      setFormData({
        employerName: initialData.employerName || '',
        country: initialData.country || '',
        contact: initialData.contact || '',
        address: initialData.address || '',
        notes: initialData.notes || '',
        status: initialData.status || 'active',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (error) setError(null);

    // Validation for Contact Field
    if (field === 'contact') {
      const phoneRegex = /^[0-9+\-() ]*$/;
      if (value !== '' && !phoneRegex.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
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
            {isEdit ? "Edit Employer" : "Add New Employer"}
          </h1>
          <p className="text-gray-500">
            {isEdit ? `Updating information for ${formData.employerName}` : "Register a new company to the directory"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-gray-50">
          <CardTitle>Employer Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Employer Name" 
                placeholder="e.g. Al-Futtaim Group"
                value={formData.employerName} 
                onChange={(e) => handleChange('employerName', e.target.value)} 
                required 
              />
              <Input 
                label="Country" 
                placeholder="e.g. United Arab Emirates"
                value={formData.country} 
                onChange={(e) => handleChange('country', e.target.value)} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Contact Details" 
                placeholder="e.g. +971 50 123 4567"
                value={formData.contact} 
                onChange={(e) => handleChange('contact', e.target.value)} 
                required 
              />
              {/* Only show Status dropdown if editing */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <Textarea 
              label="Address" 
              placeholder="Street name, Building, City..."
              value={formData.address} 
              onChange={(e) => handleChange('address', e.target.value)} 
              required 
            />

            <Textarea 
              label="Internal Notes" 
              placeholder="Any additional details..."
              value={formData.notes} 
              onChange={(e) => handleChange('notes', e.target.value)} 
            />

            <div className="flex gap-3 pt-4 border-t border-gray-50">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-11"
              >
                {loading ? "Saving..." : (isEdit ? "Update Employer" : "Save Employer")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onNavigate('list')} 
                className="flex-1 h-11"
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