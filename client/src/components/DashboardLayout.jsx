"use client";
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    user,
    notifications = [],
    role,
    currentPath,
    onNavigate,
    onLogout
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar with navigation logic */}
            <Sidebar
                key={`sidebar-${currentPath}`}
                role={role}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header now receives the onNavigate prop. 
                   This allows the 'VIEW FULL LOGS' button inside 
                   the Header dropdown to work.
                */}
                <Header
                    key={`header-${currentPath}`}
                    user={user}
                    notifications={notifications}
                    showSearch={false}
                    onNavigate={onNavigate}
                />

                <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}