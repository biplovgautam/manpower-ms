"use client";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { DashboardLayout } from "../../../components/DashboardLayout";
import EmployeeDashboard from "../../../components/Employee/EmployeeDashboard";
import { apiUrl } from "@/lib/api";

export default function EmployeePage({ notifications, onMarkAllRead }) {
    const router = useRouter();
    const [data, setData] = useState({ user: null, loading: true });
    const [error, setError] = useState(null);

    // --- NAVIGATION LOGIC (FIXED) ---
    const handleNavigate = useCallback(
        (path) => {
            if (!path) return;

            // Ensure we use an absolute path to prevent "double pathing"
            // If the path already has the prefix, use it as is, otherwise prepend it
            const target = path.startsWith('/dashboard/employee') 
                ? path 
                : `/dashboard/employee/${path.startsWith('/') ? path.substring(1) : path}`;
            
            // Clean up leading slashes to ensure exactly one
            const finalPath = target.startsWith('/') ? target : `/${target}`;
            
            router.push(finalPath);
        },
        [router]
    );

    const fetchUser = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");

            if (!token || !role || role.toLowerCase() !== "employee") {
                localStorage.clear();
                router.replace("/login");
                return;
            }

            const response = await axios.get(apiUrl("/api/auth/me"), {
                headers: { Authorization: `Bearer ${token}` },
            });

            const userData = response.data?.data || response.data?.user || response.data;
            setData({ user: userData, loading: false });
            setError(null);
        } catch (err) {
            console.error("Session verification failed:", err);
            localStorage.clear();
            setError(err.message || "Session verification failed");
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleLogout = useCallback(() => {
        localStorage.clear();
        router.push("/login");
    }, [router]);

    if (data.loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <RefreshCw className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-500 font-medium animate-pulse">
                    Establishing secure session...
                </p>
            </div>
        );
    }

    if (error && !data.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
                <div className="text-center">
                    <p className="text-red-600 font-bold text-lg mb-2">Session Error</p>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="employee"
                user={data.user}
                userName={data.user?.fullName || "Employee"}
                currentPath="/dashboard/employee"
                onLogout={handleLogout}
                // Pass the fixed navigation to the layout header/sidebar
                onNavigate={handleNavigate} 
            >
                <div className="animate-in fade-in duration-500">
                    <EmployeeDashboard
                        data={data}
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                        // Ensure dashboard components use the fixed navigator
                        navigateTo={handleNavigate} 
                    />
                </div>
            </DashboardLayout>
        </>
    );
}