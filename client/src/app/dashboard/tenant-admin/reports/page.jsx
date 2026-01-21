"use client";
import { useEffect, useState } from 'react';
import AdminReportsView from '../../../../components/Admin/ReportsPage'; // Ensure the path points to the component above
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/reports/performance-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout role="tenant-admin">
            {loading ? (
                <div className="p-10 text-center font-bold animate-pulse text-slate-500">
                    GENERATING SYSTEM AUDIT...
                </div>
            ) : (
                <AdminReportsView data={data} />
            )}
        </DashboardLayout>
    );
}