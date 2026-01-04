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
      const res = await fetch(`http://localhost:5000/api/workers/${workerId}/stage`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ stageId, status: newStatus })
      });
      if (res.ok) {
        // Refresh data and update the selected worker view
        await fetchAllData(token);
        const updatedWorker = workers.find(w => w._id === workerId);
        if (updatedWorker) setSelectedWorker(updatedWorker);
      }
    } catch (err) {
      console.error("Update stage failed", err);
    }
  };

  const handleSave = async (payload) => {
    const token = localStorage.getItem('token');
    const data = new FormData();
    const { documents, ...rest } = payload;

    Object.keys(rest).forEach(key => data.append(key, rest[key]));

    if (documents && documents.length > 0) {
      const metadata = documents.map(d => ({ category: d.category, name: d.name }));
      data.append('documentMetadata', JSON.stringify(metadata));
      documents.forEach((doc) => data.append('files', doc.file));
    }

    try {
      const res = await fetch('http://localhost:5000/api/workers/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (res.ok) {
        fetchAllData(token);
        setView('list');
      } else {
        const err = await res.json();
        alert(err.message || "Error saving worker");
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <DashboardLayout role="employee">
      {view === 'list' && (
        <WorkerManagementPage 
          workers={workers} 
          onNavigate={setView} 
          onSelectWorker={(worker) => {
            setSelectedWorker(worker);
            setView('details');
          }}
        />
      )}
      
      {view === 'add' && (
        <AddWorkerPage
          employers={employers}
          jobDemands={jobDemands}
          subAgents={subAgents}
          onNavigate={() => setView('list')}
          onSave={handleSave}
        />
      )}

      {/* ✅ FIXED: Now rendering the actual component instead of JSON */}
      {view === 'details' && selectedWorker && (
        <WorkerDetailsPage 
          worker={selectedWorker} 
          onNavigate={setView} 
          onUpdateWorkerStage={handleUpdateStage}
        />
      )}
    </DashboardLayout>
  );
}