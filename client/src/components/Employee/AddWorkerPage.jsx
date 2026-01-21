"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
  Upload,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input, Textarea } from "../ui/Input";
import { Select } from "../ui/Select";

export function AddWorkerPage({
  initialData = null,
  employers = [],
  jobDemands = [],
  subAgents = [],
  onNavigate,
  onSave,
}) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    passportNumber: "",
    contact: "",
    address: "",
    country: "Nepal",
    employerId: "",
    jobDemandId: "",
    subAgentId: "",
    status: "pending",
    notes: "",
  });

  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState({ file: null, category: "Passport", name: "" });

  // Document categories matching your backend expectations
  const documentCategories = [
    { value: "Passport", label: "Passport" },
    { value: "Birth Certificate", label: "Birth Certificate" },
    { value: "Citizenship Certificate", label: "Citizenship Certificate" },
    { value: "Medical Certificate", label: "Medical Certificate" },
    { value: "Police Clearance", label: "Police Clearance" },
    { value: "Educational Certificate", label: "Educational Certificate" },
    { value: "Passport Photos", label: "Passport Photos" },
    { value: "Other", label: "Other" }
  ];

  const requiredChecklist = [
    "Passport (with minimum 6 months validity)",
    "Birth Certificate",
    "Citizenship Certificate",
    "Medical Certificate",
    "Police Clearance Certificate",
    "Educational Certificates",
    "Passport Size Photos (2 copies)"
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
        passportNumber: initialData.passportNumber || "",
        contact: initialData.contact || "",
        address: initialData.address || "",
        country: initialData.country || "Nepal",
        employerId: initialData.employerId?._id || initialData.employerId || "",
        jobDemandId: initialData.jobDemandId?._id || initialData.jobDemandId || "",
        subAgentId: initialData.subAgentId?._id || initialData.subAgentId || "",
        status: initialData.status || "pending",
        notes: initialData.notes || "",
      });

      if (initialData.documents) {
        setDocuments(initialData.documents.map(doc => ({
          ...doc,
          isExisting: true
        })));
      }
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredJobDemands = jobDemands.filter(jd => {
    if (!formData.employerId) return false;
    const jdEmpId = jd.employerId?._id || jd.employerId;
    return String(jdEmpId) === String(formData.employerId);
  });

  const handleAddDocument = () => {
    if (currentDoc.file && currentDoc.name) {
      const newDoc = {
        file: currentDoc.file,
        category: currentDoc.category,
        name: currentDoc.name,
        fileName: currentDoc.file.name,
        fileSize: (currentDoc.file.size / 1024).toFixed(2) + " KB",
        isExisting: false
      };

      setDocuments([...documents, newDoc]);
      // Reset only the file-specific parts of currentDoc state
      setCurrentDoc({ file: null, category: "Passport", name: "" });

      const fileInput = document.getElementById('worker-file-input');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleRemoveDocument = (index) => {
    setDocuments(documents.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // documents here contains only the ones not removed via handleRemoveDocument
    onSave({ ...formData, documents });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 px-4">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={onNavigate} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isEditMode ? "Edit Worker Profile" : "Register New Worker"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? `Updating information for ${formData.name}` : "Ensure all legal documents are collected and labeled correctly."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PERSONAL INFO */}
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="bg-gray-50/50 border-b py-3">
              <CardTitle className="text-md font-bold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Input label="Full Name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
              <Input label="Email Address" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Passport Number" value={formData.passportNumber} onChange={(e) => handleChange("passportNumber", e.target.value)} required />
                <Input label="Date of Birth" type="date" value={formData.dob} onChange={(e) => handleChange("dob", e.target.value)} required />
              </div>
              <Input label="Contact Number" value={formData.contact} onChange={(e) => handleChange("contact", e.target.value)} required />
              <Input label="Address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} required />
            </CardContent>
          </Card>

          {/* DEPLOYMENT INFO */}
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="bg-gray-50/50 border-b py-3">
              <CardTitle className="text-md font-bold">Deployment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Select
                label="Employer"
                value={formData.employerId}
                onChange={(e) => { handleChange("employerId", e.target.value); handleChange("jobDemandId", ""); }}
                options={employers.map(emp => ({ value: emp._id || emp.id, label: emp.employerName || emp.name }))}
                required
              />
              <Select
                label="Job Demand"
                value={formData.jobDemandId}
                disabled={!formData.employerId}
                onChange={(e) => handleChange("jobDemandId", e.target.value)}
                options={filteredJobDemands.map(jd => ({ value: jd._id || jd.id, label: jd.jobTitle || jd.title }))}
                required
              />
              <Select
                label="Sub-Agent"
                value={formData.subAgentId}
                onChange={(e) => handleChange("subAgentId", e.target.value)}
                options={subAgents.map(sa => ({ value: sa._id || sa.id, label: sa.fullName || sa.name }))}
              />
              <Select
                label="Registration Status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                options={[{ value: "pending", label: "Pending" }, { value: "processing", label: "Processing" }, { value: "active", label: "Active" }]}
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* DOCUMENTS SECTION */}
        <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <CardHeader className="bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              <CardTitle className="text-lg text-white">Documents Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Checklist */}
              <div className="lg:col-span-4 bg-slate-50 p-6 border-r border-gray-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info size={16} className="text-indigo-600" /> Required Checklist
                </h3>
                <ul className="space-y-3">
                  {requiredChecklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-600 font-medium leading-tight">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Document Upload Area */}
              <div className="lg:col-span-8 p-6 space-y-6 bg-white">
                <div className="p-5 bg-indigo-50/30 border-2 border-dashed border-indigo-100 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Document Category"
                      options={documentCategories}
                      value={currentDoc.category}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, category: e.target.value })}
                    />
                    <Input
                      label="Document Label (e.g., Front Page)"
                      placeholder="Enter custom label"
                      value={currentDoc.name}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, name: e.target.value })}
                    />
                  </div>
                  <input
                    id="worker-file-input"
                    type="file"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => setCurrentDoc({ ...currentDoc, file: e.target.files[0] })}
                  />
                  <button
                    type="button"
                    disabled={!currentDoc.file || !currentDoc.name}
                    onClick={handleAddDocument}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                                            ${(!currentDoc.file || !currentDoc.name) ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                  >
                    <Upload size={18} /> Attach Document
                  </button>
                </div>

                {/* List of Attached Files */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Currently Attached</h4>
                  {documents.length === 0 && (
                    <p className="text-center py-6 text-gray-400 text-sm italic border rounded-lg">No documents attached.</p>
                  )}
                  {documents.map((doc, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm border-l-4 ${doc.isExisting ? 'border-l-blue-500' : 'border-l-emerald-500'}`}>
                      <div className="flex items-center gap-3">
                        {doc.isExisting ? <FileText size={18} className="text-blue-500" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                        <div>
                          <p className="text-sm font-bold text-gray-800">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-medium">
                            {doc.category} • {doc.fileName || doc.file?.name} • {doc.fileSize}
                            {doc.isExisting && " • STORED"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t">
              <Textarea label="Additional Background Notes" placeholder="Mention any special remarks or document issues..." value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="flex-[2] bg-indigo-600 text-white hover:bg-indigo-700 h-14 text-lg font-bold rounded-xl shadow-lg transition-all">
            {isEditMode ? "Update Worker Profile" : "Register Worker"}
          </Button>
          <Button type="button" variant="outline" onClick={onNavigate} className="flex-1 h-14 font-bold rounded-xl">Cancel</Button>
        </div>
      </form>
    </div>
  );
}