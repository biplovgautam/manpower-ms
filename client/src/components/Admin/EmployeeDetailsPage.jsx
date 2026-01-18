"use client";
import {
    ArrowLeft,
    Briefcase, Building2,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    Users,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function EmployeeDetailsPage({ employee, onBack }) {
    const [data, setData] = useState({ employers: [], demands: [], workers: [] });
    const [activeTab, setActiveTab] = useState('workers');
    const [isLoading, setIsLoading] = useState(true);

    // --- DATA FETCHING ---
    const fetchEmployeeData = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/api/auth/employees/${employee._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setData({
                    employers: result.data.employers || [],
                    demands: result.data.demands || [],
                    workers: result.data.workers || []
                });
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [employee._id]);

    useEffect(() => {
        fetchEmployeeData();
    }, [fetchEmployeeData]);

    // --- REAL PERFORMANCE LOGIC ---
    // Calculates the % of workers currently "Placed" vs Total Workers
    const performanceStats = useMemo(() => {
        if (!data.workers || data.workers.length === 0) return { score: 0, count: 0 };

        const placedCount = data.workers.filter(w =>
            w.status?.toLowerCase() === 'placed'
        ).length;

        const score = Math.round((placedCount / data.workers.length) * 100);
        return { score, count: placedCount };
    }, [data.workers]);

    // Mapping for empty state check
    const tabToDataKey = {
        workers: 'workers',
        jobs: 'demands',
        companies: 'employers'
    };

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Synchronizing System</span>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900 overflow-hidden">

            {/* --- TOP NAVIGATION --- */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold">Back to Directory</span>
                    </button>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Security Clearance: Admin</span>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest">SYSTEM V4.0.2</div>
            </header>

            <div className="flex-1 flex max-w-[1600px] mx-auto w-full p-6 gap-6 overflow-hidden">

                {/* --- LEFT SIDEBAR: PROFILE & STATS --- */}
                <aside className="w-[360px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 custom-scrollbar">

                    {/* Main Identity Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative inline-block mb-6">
                            <div className="h-24 w-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-xl shadow-blue-100">
                                {employee.fullName?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-white border-4 border-white rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 bg-emerald-500 rounded-full ring-4 ring-emerald-50" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{employee.fullName}</h1>
                        <p className="text-blue-600 font-bold text-[11px] mb-8 uppercase tracking-[0.15em] mt-1 italic opacity-80">{employee.role}</p>

                        <div className="space-y-6 pt-2">
                            <MetaItem icon={<Mail size={16} />} label="Professional Email" value={employee.email} />
                            <MetaItem icon={<Phone size={16} />} label="Contact Number" value={employee.contactNumber} />
                            <MetaItem icon={<MapPin size={16} />} label="Assigned Region" value={employee.address} />
                        </div>
                    </div>

                    {/* Real-time Performance Card */}
                    <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap size={14} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conversion Rate</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <p className="text-5xl font-black">{performanceStats.score}</p>
                                <p className="text-blue-400 font-bold text-xl">%</p>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                                {performanceStats.count} successful placements out of {data.workers.length} total leads.
                            </p>
                        </div>
                        <div className="absolute -right-6 -bottom-6 text-white/[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                            <Zap size={180} />
                        </div>
                    </div>
                </aside>

                {/* --- MAIN CONTENT: WORKSPACE --- */}
                <main className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">

                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-50/50 border-b border-slate-200 px-2 shrink-0">
                        <WorkspaceTab
                            active={activeTab === 'workers'}
                            icon={<Users size={16} />}
                            label="Managed Workers"
                            count={data.workers.length}
                            onClick={() => setActiveTab('workers')}
                        />
                        <WorkspaceTab
                            active={activeTab === 'jobs'}
                            icon={<Briefcase size={16} />}
                            label="Open Demands"
                            count={data.demands.length}
                            onClick={() => setActiveTab('jobs')}
                        />
                        <WorkspaceTab
                            active={activeTab === 'companies'}
                            icon={<Building2 size={16} />}
                            label="Employers"
                            count={data.employers.length}
                            onClick={() => setActiveTab('companies')}
                        />
                    </div>

                    {/* Dynamic Data List */}
                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        {activeTab === 'workers' && (
                            <div className="divide-y divide-slate-50">
                                {data.workers.map(w => (
                                    <DataRow
                                        key={w._id}
                                        primary={w.name || w.fullName}
                                        secondary={`Passport: ${w.passportNumber || 'N/A'}`}
                                        tag={w.status || 'Pending'}
                                        type="worker"
                                    />
                                ))}
                            </div>
                        )}
                        {activeTab === 'jobs' && (
                            <div className="divide-y divide-slate-50">
                                {data.demands.map(j => (
                                    <DataRow
                                        key={j._id}
                                        primary={j.jobTitle}
                                        secondary={j.employerId?.employerName || 'Direct Hire'}
                                        tag={`${j.requiredWorkers} Seats`}
                                        type="job"
                                    />
                                ))}
                            </div>
                        )}
                        {activeTab === 'companies' && (
                            <div className="divide-y divide-slate-50">
                                {data.employers.map(e => (
                                    <DataRow
                                        key={e._id}
                                        primary={e.employerName}
                                        secondary={e.country || 'International'}
                                        tag="Active Client"
                                        type="company"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State UI */}
                        {(data[tabToDataKey[activeTab]]?.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-full py-24 text-slate-400">
                                <div className="bg-slate-50 p-8 rounded-full mb-4 ring-1 ring-slate-100">
                                    <Search size={40} strokeWidth={1} className="text-slate-300" />
                                </div>
                                <p className="font-bold text-xs uppercase tracking-[0.2em]">No Database Records</p>
                                <p className="text-[11px] mt-2 text-slate-400">No {activeTab} linked to this profile yet.</p>
                            </div>
                        )}
                    </div>
                </main>

            </div>
        </div>
    );
}

// --- REFINED SUB-COMPONENTS ---

function MetaItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-700 truncate">{value || "—"}</p>
            </div>
        </div>
    );
}

function WorkspaceTab({ active, label, count, icon, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-6 py-5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 relative ${active
                    ? 'border-blue-600 text-blue-600 bg-white shadow-[0_-4px_0_0_rgba(37,99,235,0.05)_inset]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/80'
                }`}
        >
            {icon}
            <span>{label}</span>
            <span className={`ml-1 text-[10px] px-2 py-0.5 rounded font-black ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                {count || 0}
            </span>
        </button>
    );
}

function DataRow({ primary, secondary, tag, type }) {
    const isStatusActive = ['placed', 'active', 'approved'].includes(tag?.toLowerCase());

    return (
        <div className="group flex items-center justify-between px-8 py-5 hover:bg-slate-50/60 transition-all cursor-pointer">
            <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-105 group-hover:bg-white group-hover:shadow-lg group-hover:text-blue-600 transition-all duration-300">
                    {type === 'worker' ? <Users size={20} /> : type === 'job' ? <Briefcase size={20} /> : <Building2 size={20} />}
                </div>
                <div>
                    <p className="text-[15px] font-bold text-slate-800 tracking-tight mb-0.5">{primary}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{secondary}</p>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border transition-colors ${isStatusActive
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300'
                    }`}>
                    {tag}
                </span>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                    <ChevronRight size={18} />
                </div>
            </div>
        </div>
    );
}