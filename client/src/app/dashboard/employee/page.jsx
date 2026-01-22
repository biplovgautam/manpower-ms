"use client";

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Components
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 1. Get auth data from localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const fullName = localStorage.getItem('fullName');

        // 2. DEBUGGER: Check console if navigation fails
        console.group("Employee Auth Debugger");
        console.log("Token Present:", !!token);
        console.log("Role Found:", role);
        console.log("Full Name:", fullName);
        console.groupEnd();

        // 3. Security Check: Must have token AND be an employee
        if (!token || role !== 'employee') {
            console.error("⛔ AUTH DENIED: Redirecting to /login", { tokenExist: !!token, role });
            router.replace('/login');
            return;
        }

        setUserData({ fullName: fullName || 'Employee', role });
        setIsReady(true);
    }, [router]);

    /**
     * UPDATED: handleNavigation
     * This receives the 'workers' string from your ReportsPage
     * and maps it to the correct Next.js route.
     */
    // In EmployeePage.tsx - handleNavigation
    const handleNavigation = (path) => {
        if (!path) return;

        console.log("[NAVIGATION REQUEST]", { requestedPath: path });

        // Use let instead of const
        let targetPath = '/dashboard/employee'; // default fallback

        // Option 1: Simple if-else chain (your current style)
        if (path.includes('employer')) {
            targetPath = '/dashboard/employee/employer';
        } else if (path.includes('job-demand')) {
            targetPath = '/dashboard/employee/job-demand';
        } else if (path.includes('worker')) {
            targetPath = '/dashboard/employee/worker';
        } else if (path.includes('subagent') || path.includes('sub-agent')) {
            targetPath = '/dashboard/employee/subagent';
        } else if (path === 'reports' || path === 'dashboard') {
            targetPath = '/dashboard/employee';
        }

        // Option 2: You can also combine with object mapping (cleaner)
        const routes = {
            'employer': '/dashboard/employee/employer',
            'job-demand': '/dashboard/employee/job-demand',
            'worker': '/dashboard/employee/worker',
            'subagent': '/dashboard/employee/subagent',
            'sub-agent': '/dashboard/employee/subagent',
            'reports': '/dashboard/employee',
            'dashboard': '/dashboard/employee',
        };

        // This line is now safe - we're not reassigning, just choosing
        targetPath = routes[path] || targetPath; // keep the if-else result if no map match

        console.log("→ Navigating to:", targetPath);

        router.push(targetPath);
    };

    const handleLogout = () => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.push('/login');
    };

    if (!isReady) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            {/* EmployeeDashboard must pass the onNavigate prop 
              down to the ReportsPage component inside it.
            */}
            <EmployeeDashboard onNavigate={handleNavigation} />
        </DashboardLayout>
    );
}
