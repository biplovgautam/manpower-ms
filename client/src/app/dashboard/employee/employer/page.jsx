"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { EmployerListPage } from '../../../../components/Employee/EmployerListPage';
import { AddEmployerPage } from '../../../../components/Employee/AddEmployer';

export default function EmployersPage() {
    const router = useRouter();
    const [view, setView] = useState('list');
    const [employers, setEmployers] = useState([]);
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
        const res = await fetch('http://localhost:5000/api/employers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setEmployers(result.data);
    };

    const handleSave = async (formData) => {
        const res = await fetch('http://localhost:5000/api/employers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            fetchEmployers(localStorage.getItem('token'));
            setView('list');
        }
    };

    return (
        <DashboardLayout role="employee" userName={userData.fullName} currentPath="/dashboard/employee/employer" onLogout={() => { localStorage.clear(); router.push('/login'); }}>
            {view === 'list' ? <EmployerListPage employers={employers} onNavigate={setView} onSelectEmployer={console.log} /> 
                             : <AddEmployerPage onNavigate={setView} onSave={handleSave} />}
        </DashboardLayout>
    );
}