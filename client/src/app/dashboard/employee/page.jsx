"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Components
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);

    // Unified state for API data
    const [data, setData] = useState({
        user: null,
        notifications: [],
        loading: true
    });

    useEffect(() => {
        const fetchEmployeeData = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (!token || role !== 'employee') {
                router.replace('/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:5000/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    const user = res.data.data.user;

                    if (user?.isBlocked) {
                        setIsBlocked(true);
                        handleLogout("Account restricted by administrator.");
                        return;
                    }

                    setData({
                        user: user,
                        notifications: res.data.data.notes || [],
                        loading: false
                    });
                    setIsReady(true);
                }
            } catch (err) {
                console.error("Employee Dashboard Error:", err);
                if (err.response?.status === 401) {
                    handleLogout();
                }
            }
        };

        fetchEmployeeData();
    }, [router]);

    const handleNavigation = (path) => {
        if (!path) return;

        // Define route mappings including the new notifications page
        const routes = {
            'employer': '/dashboard/employee/employer',
            'job-demand': '/dashboard/employee/job-demand',
            'worker': '/dashboard/employee/worker',
            'subagent': '/dashboard/employee/subagent',
            'sub-agent': '/dashboard/employee/subagent',
            'notifications': '/dashboard/employee/notifications', // Added this
            'reports': '/dashboard/employee',
            'dashboard': '/dashboard/employee',
        };

        // If it's an absolute path starting with '/', use it directly
        const targetPath = path.startsWith('/') ? path : (routes[path] || '/dashboard/employee');
        router.push(targetPath);
    };

    const handleLogout = (msg = "Session ended.") => {
        toast.error(msg);
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
    };

    if (isBlocked) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p className="text-slate-500">Your account has been restricted. Please contact your manager.</p>
                </div>
            </div>
        );
    }

    if (!isReady || data.loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600 border-gray-200"></div>
                    <p className="text-slate-500 font-bold animate-pulse text-sm">Synchronizing Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="employee"
            user={data.user}
            notifications={data.notifications}
            currentPath="/dashboard/employee"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            <EmployeeDashboard
                data={data}
                onNavigate={handleNavigation}
            />
        </DashboardLayout>
    );
}