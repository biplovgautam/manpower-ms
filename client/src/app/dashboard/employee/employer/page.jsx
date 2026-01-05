"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { EmployerListPage } from '../../../../components/Employee/EmployerListPage';
import { AddEmployerPage } from '../../../../components/Employee/AddEmployer';
import { EmployerDetailsPage } from '../../../../components/Employee/EmployerDetailPage';
import { CreateJobDemandPage } from '../../../../components/Employee/CreateJobDemandPage';

function EmployersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState('list'); // views: 'list', 'add', 'details', 'edit', 'createDemand'
    const [employers, setEmployers] = useState([]);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        
        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }
        
        setUserData({ fullName: localStorage.getItem('fullName'), role });
        fetchEmployers(token);

        // CHECK FOR ACTION PARAMETER
        const action = searchParams.get('action');
        if (action === 'add') {
            setView('add');
        }
    }, [router, searchParams]);

    const fetchEmployers = async (token) => {
        try {
            const res = await fetch('http://localhost:5000/api/employers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setEmployers(result.data);
        } catch (error) {
            console.error("Failed to fetch:", error);
        }
    };

    const handleSelectEmployer = async (emp) => {
        setSelectedEmployer(emp);
        setView('details');
        setIsLoadingDetails(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/employers/${emp._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setSelectedEmployer(result.data);
        } catch (error) {
            console.error("Failed to load details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleSaveDemand = async (submissionData) => {
        try {
            const token = localStorage.getItem('token');
            const targetEmployer = employers.find(e => e.employerName === submissionData.employerName);
            
            const res = await fetch('http://localhost:5000/api/demands', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...submissionData,
                    employerId: targetEmployer?._id
                })
            });
            const result = await res.json();
            if (result.success) {
                handleSelectEmployer(targetEmployer || selectedEmployer);
            }
        } catch (error) {
            console.error("Save Demand Failed:", error);
        }
    };

    const handleSave = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/employers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (res.ok && result.success) { 
            fetchEmployers(token); 
            setView('list'); 
            // Clear URL params after saving
            router.replace('/dashboard/employee/employer');
        }
    };

    const handleUpdate = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/employers/${selectedEmployer._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        if (res.ok) { fetchEmployers(token); setView('list'); setSelectedEmployer(null); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/employers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { fetchEmployers(token); setView('list'); }
        } catch (error) { console.error(error); }
    };

    return (
        <DashboardLayout 
            role="employee" userName={userData.fullName} 
            currentPath="/dashboard/employee/employer" 
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            {view === 'list' && (
                <EmployerListPage employers={employers} onNavigate={setView} onSelectEmployer={handleSelectEmployer} onDelete={handleDelete} />
            )}
            {view === 'add' && <AddEmployerPage onNavigate={() => setView('list')} onSave={handleSave} />}
            {view === 'edit' && <AddEmployerPage onNavigate={() => setView('list')} onSave={handleUpdate} initialData={selectedEmployer} isEdit={true} />}
            
            {view === 'details' && (
                <EmployerDetailsPage 
                    employer={selectedEmployer} onNavigate={setView} onDelete={handleDelete} 
                    isLoading={isLoadingDetails} onCreateDemand={() => setView('createDemand')}
                />
            )}

            {view === 'createDemand' && (
                <CreateJobDemandPage 
                    employers={employers} initialData={{ employerName: selectedEmployer?.employerName }}
                    onNavigate={() => setView('details')} onSave={handleSaveDemand}
                />
            )}
        </DashboardLayout>
    );
}

// Main Export with Suspense wrapper
export default function EmployersPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading Employer Management...</div>}>
            <EmployersContent />
        </Suspense>
    );
}