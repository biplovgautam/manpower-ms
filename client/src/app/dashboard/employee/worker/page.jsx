"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function WorkersPage() {
  const router = useRouter();
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [userData, setUserData] = useState({ fullName: '', role: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'employee') {
      router.push('/login');
      return;
    }
    setUserData({ fullName: localStorage.getItem('fullName'), role });
    fetchWorkers(token);
  }, [router]);

  const fetchWorkers = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/workers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setWorkers(result.data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
  };

  const handleSave = async (formData) => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/workers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const result = await res.json();
    if (res.ok && result.success) {
      fetchWorkers(token);
      setView('list');
    } else {
      throw new Error(result.error || "Failed to save worker");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/workers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchWorkers(token);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <DashboardLayout
      role="employee"
      userName={userData.fullName}
      currentPath="/dashboard/employee/worker"
      onLogout={() => { localStorage.clear(); router.push('/login'); }}
    >
      {view === 'list' && (
        <WorkerManagementPage
          workers={workers}
          onNavigate={setView}
          onSelectWorker={(worker) => {
            setSelectedWorker(worker);
            setView('edit');
          }}
          onDelete={handleDelete}
        />
      )}

      {(view === 'add' || view === 'edit') && (
        <AddWorkerPage
          onNavigate={() => setView('list')}
          onSave={handleSave}
          initialData={view === 'edit' ? selectedWorker : null}
          isEdit={view === 'edit'}
        />
      )}
    </DashboardLayout>
  );
}