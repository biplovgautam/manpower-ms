"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { SupportPage } from '../../../components/SupportPage';
import { apiUrl } from '@/lib/api';

// If you have an Admin-specific inbox component, import it here:
// import { SupportInbox } from '../../../components/SupportInbox'; 

function SupportContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        
        // Immediate redirect if no token exists
        if (!token) {
            router.replace('/login');
            return;
        }

        try {
            const response = await fetch(apiUrl('/api/auth/me'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const resJson = await response.json();

            if (!response.ok) {
                throw new Error(resJson.message || "SESSION_EXPIRED");
            }

            // Robust data mapping: prioritize 'data' or 'user' objects, fallback to root
            const userPayload = resJson.data || resJson.user || resJson;
            setUserData(userPayload);
            
        } catch (error) {
            console.error("Support Page Auth Error:", error);
            // Clear storage on auth failure to prevent redirect loops
            localStorage.removeItem('token');
            router.replace('/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => { 
        fetchUser(); 
    }, [fetchUser]);

    // Derived state for cleaner JSX
    const role = userData?.role?.toLowerCase() || '';
    const isSuperAdmin = role === 'super_admin' || role === 'admin';

    return (
        <DashboardLayout 
            role={userData?.role} 
            user={userData}
        >
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6">
                        <div className="relative">
                            <span className="loading loading-ring loading-lg text-indigo-600 scale-150"></span>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 font-semibold italic">Verifying Credentials</p>
                            <p className="text-slate-400 text-xs mt-1">Syncing secure support channel...</p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {isSuperAdmin ? "Support Management" : "Support & Feedback"}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {isSuperAdmin
                                        ? "Reviewing and managing global system tickets"
                                        : "Direct communication channel with our technical engineers"}
                                </p>
                            </div>
                            
                            {isSuperAdmin && (
                                <div className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm border border-indigo-100 self-start md:self-auto">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                    System Administrator
                                </div>
                            )}
                        </header>

                        {/* Content Logic */}
                        <div className="min-h-[400px]">
                            {isSuperAdmin ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                                    <div className="max-w-md mx-auto">
                                        <p className="text-slate-800 font-bold text-lg mb-2">Admin Inbox Ready</p>
                                        <p className="text-slate-500 text-sm mb-6">You are viewing the consolidated support stream.</p>
                                        {/* <SupportInbox user={userData} /> */}
                                        <div className="h-[200px] border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 italic text-xs">
                                            Ticket stream component placeholder
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <SupportPage user={userData} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <p className="text-slate-400 font-medium animate-pulse">Initializing Layout...</p>
            </div>
        }>
            <SupportContent />
        </Suspense>
    );
}