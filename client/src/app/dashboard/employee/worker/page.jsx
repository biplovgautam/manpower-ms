"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';
import { WorkerDetailsPage } from '../../../../components/Employee/WorkerDetailPage'; 
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function WorkersPage() {
  const router = useRouter();
  const [view, setView] = useState('list'); 
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobDemands, setJobDemands] = useState([]);
  const [subAgents, setSubAgents] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAllData(token);
  }, [router]);

  const fetchAllData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers', { headers }),
        fetch('http://localhost:5000/api/employers', { headers }),
        fetch('http://localhost:5000/api/job-demands', { headers }),
        fetch('http://localhost:5000/api/sub-agents', { headers })
      ]);

      const workerResult = await workerRes.json();
      const empResult = await empRes.json();
      const demandResult = await demandRes.json();
      const agentResult = await agentRes.json();

      if (workerResult.success) setWorkers(workerResult.data || []);
      setEmployers(empResult.data || empResult.employers || (Array.isArray(empResult) ? empResult : []));
      setJobDemands(demandResult.data || demandResult.jobDemands || (Array.isArray(demandResult) ? demandResult : []));
      setSubAgents(agentResult.data || agentResult.subAgents || (Array.isArray(agentResult) ? agentResult : []));
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleUpdateStage = async (workerId, stageId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/workers/${workerId}/stage/${stageId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const result = await res.json();
      if (result.success) {
        setWorkers(prev => prev.map(w => w._id === workerId ? result.data : w));
        setSelectedWorker(result.data);
      }
    } catch (err) {
      console.error("Update stage failed", err);
    }
  };

  const handleSave = async (payload) => {
    const token = localStorage.getItem('token');
    const data = new FormData();
    // Destructure documents (files) from the rest of the text data
    const { documents, ...rest } = payload;

    // 1. Append text fields (name, passport, etc.)
    Object.keys(rest).forEach(key => {
      if (rest[key] !== null && rest[key] !== undefined) {
        data.append(key, rest[key]);
      }
    });

    // 2. Append files using the key 'files' to match backend upload.array('files')
    if (documents && documents.length > 0) {
      documents.forEach((doc) => {
        if (doc.file) {
          data.append('files', doc.file); 
        }
      });
    }

    try {
      const isEdit = selectedWorker && view === 'edit';
      const url = isEdit 
        ? `http://localhost:5000/api/workers/${selectedWorker._id}`
        : 'http://localhost:5000/api/workers/add';
      
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}` 
          // Browser sets Content-Type + boundary automatically for FormData
        },
        body: data
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await res.json();
        
        if (res.ok && result.success) {
          // Success Path
          await fetchAllData(token); // Refresh the global list
          setSelectedWorker(result.data); // Update the state with new data from server
          setView('list'); // Redirect to list (change to 'details' if you want to see changes immediately)
          alert("Worker saved successfully!");
        } else {
          alert(result.message || "Error saving worker");
        }
      } else {
        const textError = await res.text();
        console.error("Server Error:", textError);
        alert("Server returned an error. Check backend logs for 'MulterError'.");
      }
    } catch (err) {
      console.error("Save failed", err);
      alert("Network error occurred.");
    }
  };

  const handleNavigate = (newView, data = null) => {
    if (newView === 'edit' && data) {
      setSelectedWorker(data);
      setView('edit');
    } else if (newView === 'details' && data) {
      setSelectedWorker(data);
      setView('details');
    } else {
      if (newView === 'list') setSelectedWorker(null);
      setView(newView);
    }
  };

  return (
    <DashboardLayout role="employee">
      {view === 'list' && (
        <WorkerManagementPage 
          workers={workers} 
          onNavigate={handleNavigate} 
          onSelectWorker={(worker) => handleNavigate('details', worker)}
        />
      )}
      
      {(view === 'add' || view === 'edit') && (
        <AddWorkerPage
          initialData={view === 'edit' ? selectedWorker : null}
          employers={employers}
          jobDemands={jobDemands}
          subAgents={subAgents}
          onNavigate={() => handleNavigate('list')}
          onSave={handleSave}
        />
      )}

      {view === 'details' && selectedWorker && (
        <WorkerDetailsPage 
          worker={selectedWorker} 
          onNavigate={handleNavigate} 
          onUpdateWorkerStage={handleUpdateStage}
        />
      )}
    </DashboardLayout>
  );
}