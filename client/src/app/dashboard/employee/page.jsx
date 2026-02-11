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

    const fetchUser = useCallback(async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

            if (!token || !role || role.toLowerCase() !== "employee") {
                if (typeof window !== "undefined") {
                    localStorage.clear();
                }
                router.replace("/login");
                return;
            }

            const response = await axios.get(
                apiUrl("/api/auth/me"),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const userData = response.data?.data || response.data?.user || response.data;
            setData({ user: userData, loading: false });
            setError(null);
        } catch (err) {
            console.error("Session verification failed:", err);
            if (typeof window !== "undefined") {
                localStorage.clear();
            }
            setError(err.message || "Session verification failed");
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleNavigate = useCallback(
        (path) => {
            if (!path) {
                console.warn("Navigation path is empty");
                return;
            }
            router.push(path);
        },
        [router]
    );

    const handleLogout = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.clear();
        }
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
                    <p className="text-red-600 font-bold text-lg mb-2">
                        Session Error
                    </p>
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
            >
                <div className="animate-in fade-in duration-500">
                    <EmployeeDashboard
                        data={data}
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                        navigateTo={handleNavigate}
                    />
                </div>
            </DashboardLayout>
        </>
    );
}