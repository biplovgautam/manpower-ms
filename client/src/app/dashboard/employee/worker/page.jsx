// src/app/dashboard/employee/worker/page.jsx
"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerDetailsPage } from '../../../../components/Employee/WorkerDetailPage'; // ← Correct component name
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';

function WorkersContent() {
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
      const headers = { Authorization: `Bearer ${token}` };

      const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers', { headers }),
        fetch('http://localhost:5000/api/employers?view=all', { headers }),
        fetch('http://localhost:5000/api/job-demands?view=all', { headers }),
        fetch('http://localhost:5000/api/sub-agents?view=all', { headers }),
      ]);

      const wData = await workerRes.json();
      const eData = await empRes.json();
      const dData = await demandRes.json();
      const aData = await agentRes.json();

      if (wData.success) setWorkers(wData.data || []);
      if (eData.success) setEmployers(eData.data || []);
      if (dData.success) setJobDemands(dData.data || []);
      if (aData.success) setSubAgents(aData.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const handleSave = async (payload) => {
    const token = localStorage.getItem('token');
    const data = new FormData();
    const { documents, ...rest } = payload;

    Object.keys(rest).forEach((key) => {
      if (rest[key]) data.append(key, rest[key]);
    });

    if (documents?.length > 0) {
      documents.forEach((doc) => {
        if (doc.file) data.append('files', doc.file);
      });
    }

    try {
      const isEdit = selectedWorker && view === 'edit';
      const url = isEdit
        ? `http://localhost:5000/api/workers/${selectedWorker._id}`
        : 'http://localhost:5000/api/workers/add';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        await fetchAllData(token);
        setView('list');
      } else {
        alert(result.message || 'Failed to save worker');
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error while saving worker");
    }
  };

  const handleNavigate = (newView, data = null) => {
    setSelectedWorker(data);
    setView(newView);
  };

  const handleUpdateWorkerStage = async (workerId, stageId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/workers/${workerId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stageId, status: newStatus }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Update failed');

      await fetchAllData(token); // refresh list
    } catch (err) {
      console.error("Stage update failed:", err);
      throw err; // let the child component handle revert
    }
  };

  return (
    <DashboardLayout role="employee">
      {view === 'list' && (
        <WorkerManagementPage
          workers={workers}
          onNavigate={handleNavigate}
          onSelectWorker={(w) => handleNavigate('details', w)}
        />
      )}

      {(view === 'add' || view === 'edit') && (
        <AddWorkerPage
          initialData={selectedWorker}
          employers={employers}
          jobDemands={jobDemands}
          subAgents={subAgents}
          onNavigate={() => setView('list')}
          onSave={handleSave}
        />
      )}

      {view === 'details' && selectedWorker && (
        <WorkerDetailsPage
          worker={selectedWorker}
          onNavigate={handleNavigate}
          onUpdateWorkerStage={handleUpdateWorkerStage}
        />
      )}
    </DashboardLayout>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Workers Management...</div>}>
      <WorkersContent />
    </Suspense>
  );
}