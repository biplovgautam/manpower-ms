"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { EmployerListPage } from '../../../../components/Employee/EmployerListPage';
import { AddEmployerPage } from '../../../../components/Employee/AddEmployer';
import { EmployerDetailsPage } from '../../../../components/Employee/EmployerDetailPage';

export default function EmployersPage() {
    const router = useRouter();
    const [view, setView] = useState('list'); // views: 'list', 'add', 'details', 'edit'
    const [employers, setEmployers] = useState([]);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
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
    }, [router]);

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

    const handleSave = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/employers', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        
        const result = await res.json();
        if (res.ok && result.success) {
            fetchEmployers(token);
            setView('list');
        } else {
            throw new Error(result.error || "Failed to save employer");
        }
    };

    const handleUpdate = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/employers/${selectedEmployer._id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        
        const result = await res.json();
        if (res.ok && result.success) {
            fetchEmployers(token);
            setView('list');
            setSelectedEmployer(null);
        } else {
            throw new Error(result.error || "Failed to update employer");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employer?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/employers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                fetchEmployers(token);
                setView('list');
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    return (
        <DashboardLayout 
            role="employee" 
            userName={userData.fullName} 
            currentPath="/dashboard/employee/employer" 
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            {view === 'list' && (
                <EmployerListPage 
                    employers={employers} 
                    onNavigate={setView} 
                    onSelectEmployer={(emp) => {
                        setSelectedEmployer(emp);
                        setView('details');
                    }} 
                    onDelete={handleDelete}
                />
            )}

            {view === 'add' && (
                <AddEmployerPage 
                    onNavigate={() => setView('list')} 
                    onSave={handleSave} 
                />
            )}

            {view === 'edit' && (
                <AddEmployerPage 
                    onNavigate={() => setView('list')} 
                    onSave={handleUpdate} 
                    initialData={selectedEmployer}
                    isEdit={true}
                />
            )}

            {view === 'details' && (
                <EmployerDetailsPage 
                    employer={selectedEmployer} 
                    onNavigate={setView} 
                    onDelete={handleDelete}
                />
            )}
        </DashboardLayout>
    );
}