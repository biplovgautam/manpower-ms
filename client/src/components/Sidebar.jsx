"use client";

import {
    Briefcase, Building2, FileText, LayoutDashboard,
    LogOut, Settings, UserCheck, UserCircle, Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Sidebar({ onLogout }) {
    const pathname = usePathname();
    const [sidebarData, setSidebarData] = useState({
        name: 'ManpowerMS',
        logo: null,
        role: 'user'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setSidebarData({
                    name: parsed.companyName || 'ManpowerMS',
                    logo: parsed.companyLogo || null,
                    role: parsed.role || 'user'
                });
            } catch (err) {
                console.error("Error parsing user data", err);
            }
        }
    }, []);

    // SHARED PATH: This must match your folder structure app/dashboard/settings/page.jsx
    const SETTINGS_PATH = '/dashboard/settings';

    const adminLinks = [
        { path: '/dashboard/tenant-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/tenant-admin/employees', label: 'Employees', icon: Users },
        { path: '/dashboard/tenant-admin/employers', label: 'Employers', icon: Building2 },
        { path: '/dashboard/tenant-admin/workers', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/tenant-admin/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/tenant-admin/reports', label: 'Reports', icon: FileText },
        { path: SETTINGS_PATH, label: 'Settings', icon: Settings },
    ];

    const employeeLinks = [
        { path: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/employee/employer', label: 'Employers', icon: Building2 },
        { path: '/dashboard/employee/job-demand', label: 'Job Demands', icon: Briefcase },
        { path: '/dashboard/employee/worker', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/employee/subagent', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/employee/report', label: 'Report', icon: FileText },
        { path: SETTINGS_PATH, label: 'Settings', icon: Settings },
    ];

    // Determine which links to show based on role
    const links = (sidebarData.role === 'admin' || sidebarData.role === 'super_admin')
        ? adminLinks
        : employeeLinks;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 z-40 shadow-sm">

            {/* BRANDING SECTION */}
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
                        {sidebarData.logo ? (
                            <img
                                src={sidebarData.logo}
                                alt="Company Logo"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl uppercase">
                                {sidebarData.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden">
                        <h1 className="text-[15px] font-bold text-gray-900 tracking-tight truncate leading-tight">
                            {sidebarData.name}
                        </h1>
                        <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest">
                            {sidebarData.role.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;

                    // Logic: Dashboard items require exact match, others match on prefix
                    const isActive = link.exact
                        ? pathname === link.path
                        : pathname.startsWith(link.path);

                    return (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Icon
                                size={19}
                                className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                            />
                            <span className="flex-1">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* LOGOUT */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                    <LogOut size={19} className="text-red-400" />
                    <span>Logout Session</span>
                </button>
            </div>
        </div>
    );
}