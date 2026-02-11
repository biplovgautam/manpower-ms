"use client";
import { useEffect, useState, useCallback } from 'react';
import AdminReportsView from '../../../../components/Admin/ReportsPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { apiUrl } from '@/lib/api';

export default function AdminReportsPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Using useCallback to maintain stable function reference
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("User authentication token not found.");

            // Full URL ensures we bypass Next.js local routing and hit the Express backend
            const response = await fetch(apiUrl('/api/reports/performance-stats?view=month'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Server Error: ${response.status}`);
            }

            if (result.success) {
                setReportData(result);
            } else {
                throw new Error("Data retrieval was not successful.");
            }
        } catch (err) {
            console.error("API Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    return (
        <DashboardLayout role="tenant-admin">
            <div className="bg-[#f9fafb] min-h-screen">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[70vh]">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-bold animate-pulse text-slate-400 uppercase tracking-widest text-xs">
                            Generating System Audit...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
                        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Connectivity Issue</h3>
                            <p className="text-sm opacity-90 mb-4">{error}</p>
                            <button 
                                onClick={fetchReportData}
                                className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-red-700 transition-colors"
                            >
                                Reconnect to Server
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Pass the reportData down. 
                       Make sure AdminReportsView is set up to receive 
                       initialData as a prop! 
                    */
                    <AdminReportsView initialData={reportData} />
                )}
            </div>
        </DashboardLayout>
    );
}