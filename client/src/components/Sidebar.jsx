"use client";

import {
    Briefcase,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
    Settings,
    UserCheck,
    UserCircle,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({ role, onLogout }) {
    const pathname = usePathname();

    // Define the link structures
    const adminLinks = [
        { path: '/dashboard/tenant-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/tenant-admin/employers', label: 'Employers', icon: Building2 },
        { path: '/dashboard/tenant-admin/employees', label: 'Employees', icon: Users },
        { path: '/dashboard/tenant-admin/workers', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/tenant-admin/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/tenant-admin/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const employeeLinks = [
        { path: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/employee/employer', label: 'Employers', icon: Building2 },
        { path: '/dashboard/employee/job-demand', label: 'Job Demands', icon: Briefcase },
        { path: '/dashboard/employee/worker', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/employee/subagent', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/employee/report', label: 'Report', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const links = role === 'admin' ? adminLinks : employeeLinks;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 z-40 shadow-sm">
            {/* Header / Branding */}
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        M
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">ManpowerMS</h1>
                </div>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    {role} Portal
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const Icon = link.icon;

                    // Improved active logic: 
                    // Matches exact for dashboard, and startsWith for categories to keep them 
                    // highlighted when you are in "Add" or "Details" views.
                    const isActive = link.exact
                        ? pathname === link.path
                        : pathname.startsWith(link.path);

                    return (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon
                                size={19}
                                className={`transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                    }`}
                            />
                            <span className="flex-1">{link.label}</span>

                            {isActive && (
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Card */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <div className="mb-4 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {role?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Account</p>
                        <p className="text-xs font-semibold text-gray-700 truncate capitalize">{role}</p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-transparent hover:border-red-100"
                >
                    <LogOut size={19} className="text-red-400 group-hover:text-red-500 transition-colors" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}