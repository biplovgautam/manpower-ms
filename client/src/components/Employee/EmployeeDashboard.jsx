"use client";

import adbs from "ad-bs-converter";
import axios from "axios";
import {
    AlertCircle,
    AtSign,
    Bell,
    Briefcase,
    BriefcaseBusiness,
    Building2,
    CheckCircle,
    Clock as ClockIcon,
    X as CloseIcon,
    Edit,
    FilePlus,
    FileText,
    Paperclip,
    Plus,
    RefreshCw,
    // ──── added for global search ────
    Search,
    ShieldCheck,
    Trash2,
    UserCircle,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { apiUrl, fileUrl } from "@/lib/api";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const API_BASE = apiUrl("/api/dashboard");
const FILE_BASE = fileUrl();

const NEPALI_MONTHS = [
    "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashoj",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const URGENT_TOAST_STYLE = {
    background: "#fff7f7",
    color: "#7f1d1d",
    border: "1px solid #fca5a5",
    padding: "12px 14px",
    fontSize: "14px",
    maxWidth: "480px",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(252, 165, 165, 0.12)",
};

const URGENT_TOAST_ID = "urgent-reminders";

const getNepalTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));

function toNepaliShort(dateStrOrDate) {
    if (!dateStrOrDate) return { month: "N/A", day: "" };
    const d = new Date(dateStrOrDate);
    try {
        const c = adbs.ad2bs(`${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`);
        return {
            month: NEPALI_MONTHS[c.en.month - 1]?.slice(0, 3) ?? "N/A",
            day: c.en.day,
        };
    } catch {
        return { month: d.toLocaleString("en-US", { month: "short" }), day: d.getDate() };
    }
}

function authHeaders() {
    const token = localStorage.getItem("token") || "";
    return { Authorization: `Bearer ${token}` };
}

function formatStatValue(v) {
    if (v === null || v === undefined) return "—";
    if (typeof v === "number" || typeof v === "string") return v;
    if (Array.isArray(v)) return v.length;
    if (typeof v === "object") {
        if (typeof v.count === "number") return v.count;
        if (typeof v.total === "number") return v.total;
        return "—";
    }
    return "—";
}

const Clock = memo(function Clock() {
    const [time, setTime] = useState(getNepalTime());
    useEffect(() => {
        const timer = setInterval(() => setTime(getNepalTime()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <span className="flex items-center gap-2">
            <ClockIcon size={16} className="text-indigo-600" /> {time.toLocaleTimeString()}
        </span>
    );
});

const StatCard = memo(function StatCard({ title, value, icon, gradient, path, onNavigate }) {
    const isClickable = !!path && typeof onNavigate === "function";

    return (
        <div
            onClick={() => isClickable && onNavigate(path)}
            className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 bg-white border border-slate-100 
        ${isClickable ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] group" : "cursor-default"}`}
        >
            <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

            {isClickable && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            <div className="p-5 sm:p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">{value ?? "—"}</p>
                </div>

                <div className={`p-3 sm:p-4 rounded-2xl bg-slate-100 text-slate-700 transition-all duration-300 ${isClickable ? "group-hover:scale-110" : ""}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
});

const ReminderItem = memo(function ReminderItem({
    rem,
    isBS,
    markDone,
    editNote,
    deleteNote,
    linkedLabel,
    isTagged,
    creatorDisplay,
    isAdminPosted,
    isOwn,
    showArchived,
}) {
    const daysLeftCalc = useCallback((targetDate) => {
        if (!targetDate) return null;
        const diffMs = new Date(targetDate) - getNepalTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }, []);

    const d = daysLeftCalc(rem.targetDate);
    const isOver = d < 0;
    const isToday = d === 0;
    const isSoon = d > 0 && d <= 2;

    const border = isOver ? "border-red-600" : isToday ? "border-red-500" : isSoon ? "border-orange-500" : "border-blue-400";
    const bg = isOver ? "bg-rose-50/70" : isToday ? "bg-red-50/60" : isSoon ? "bg-orange-50/50" : isTagged ? "bg-indigo-50/40" : "";

    const badge = isOver ? "bg-red-600 text-white" : isToday ? "bg-red-500 text-white" : isSoon ? "bg-orange-500 text-white" : isTagged ? "bg-indigo-500 text-white" : "bg-blue-100 text-blue-700";

    const dateDisplay = useCallback((targetDate) => {
        if (!targetDate) return { month: "N/A", day: "" };
        const d = new Date(targetDate);
        try {
            const c = adbs.ad2bs(`${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`);
            return {
                month: NEPALI_MONTHS[c.en.month - 1]?.slice(0, 3) ?? "N/A",
                day: c.en.day,
            };
        } catch {
            return { month: d.toLocaleString("en-US", { month: "short" }), day: d.getDate() };
        }
    }, []);

    return (
        <div className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm border-l-8 flex gap-4 sm:gap-5 hover:shadow-md transition-all group ${border} ${bg}`}>
            <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-2xl shrink-0 border shadow-sm">
                <span className="text-xs font-black text-slate-600 uppercase mb-1">
                    {isBS ? dateDisplay(rem.targetDate).month : new Date(rem.targetDate).toLocaleString("en-US", { month: "short" })}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-800">
                    {isBS ? dateDisplay(rem.targetDate).day : new Date(rem.targetDate).getDate()}
                </span>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Bell size={20} className={`shrink-0 ${isOver ? "animate-pulse-fast text-red-600" : isToday ? "animate-pulse text-red-500" : isSoon ? "animate-pulse-slow text-orange-600" : ""}`} />
                    <p className="text-base font-bold text-slate-900 leading-snug flex-1">{rem.content}</p>
                </div>

                {linkedLabel && (
                    <div className="text-sm text-slate-500 mb-1">
                        Linked: <span className="font-bold text-slate-700">{linkedLabel}</span>
                    </div>
                )}

                <div className="text-xs text-slate-500 mt-2 flex items-center flex-wrap gap-2">
                    <span>Posted by: <span className="font-medium text-slate-800">{creatorDisplay}</span></span>
                    {isAdminPosted && (
                        <Badge className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                            <ShieldCheck size={12} /> Admin
                        </Badge>
                    )}
                </div>

                {isTagged && (
                    <Badge className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 mt-2">
                        <AtSign size={12} className="inline mr-1" /> You are tagged
                    </Badge>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-2">
                        <Badge className={`text-xs font-black px-3 py-1 border-none ${badge}`}>
                            {isOver ? "OVERDUE" : isToday ? "TODAY" : isSoon ? `${d} days left` : `${d} days`}
                        </Badge>
                        {rem.isCompleted && <Badge className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1">DONE</Badge>}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!showArchived && !rem.isCompleted && (
                            <button
                                onClick={() => markDone(rem._id)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                title="Mark as Done"
                            >
                                <CheckCircle size={18} />
                            </button>
                        )}
                        {isOwn && (
                            <>
                                <button onClick={() => editNote(rem)} className="p-1.5 hover:text-indigo-600">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => deleteNote(rem._id)} className="p-1.5 hover:text-rose-600">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

function useDashboard() {
    const [isBS, setIsBS] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [stats, setStats] = useState({});
    const [notes, setNotes] = useState([]);
    const [dropdowns, setDropdowns] = useState({});
    const [loading, setLoading] = useState(true);

    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId")?.trim() : null;

    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("general");
    const [date, setDate] = useState("");
    const [file, setFile] = useState(null);
    const [entity, setEntity] = useState("");

    const [urgentCount, setUrgentCount] = useState(0);
    const [reminderFilter, setReminderFilter] = useState('all');
    const [logFilter, setLogFilter] = useState('all');

    const daysLeft = useCallback((targetDate) => {
        if (!targetDate) return null;
        const diffMs = new Date(targetDate) - getNepalTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_BASE, { headers: authHeaders() });
            if (res.data?.success) {
                setStats(res.data.data.stats || {});
                setNotes(res.data.data.notes || []);
                setDropdowns(res.data.data.dropdowns || {});
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (loading || !notes.length) return;

        const urgent = notes.reduce((count, n) => {
            if (!n.targetDate || n.isCompleted) return count;
            const d = daysLeft(n.targetDate);
            return d !== null && d >= 0 && d <= 2 ? count + 1 : count;
        }, 0);

        setUrgentCount(urgent);

        if (urgent > 0) {
            const msg = urgent === 1 ? "1 urgent reminder!" : `${urgent} urgent reminders!`;
            toast(
                <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center rounded-full bg-red-50 p-2">
                        <AlertCircle className="text-red-600" size={18} />
                    </div>
                    <div className="flex-1 ml-2">
                        <div className="text-sm font-extrabold text-[#7f1d1d]">{msg}</div>
                        <div className="text-xs text-[#9b1f1f] mt-0.5">Check your reminders panel</div>
                    </div>
                    <button onClick={() => toast.dismiss(URGENT_TOAST_ID)} className="ml-3 p-1.5 rounded-full hover:bg-slate-100">
                        <CloseIcon size={16} className="text-slate-600" />
                    </button>
                </div>,
                { id: URGENT_TOAST_ID, duration: Infinity, position: "top-center", style: URGENT_TOAST_STYLE }
            );
        } else {
            toast.dismiss(URGENT_TOAST_ID);
        }

        return () => toast.dismiss(URGENT_TOAST_ID);
    }, [notes, loading, daysLeft]);

    const sortedReminders = useMemo(() => {
        const allReminders = notes.filter((n) => n.targetDate);
        let filtered = allReminders;

        if (reminderFilter === 'my') {
            filtered = filtered.filter((n) => String(n.createdBy?._id || n.createdBy) === String(currentUserId));
        } else if (reminderFilter === 'tagged') {
            filtered = filtered.filter((n) => String(n.linkedEntityId?._id || n.linkedEntityId) === String(currentUserId));
        }

        const active = filtered.filter((n) => !n.isCompleted && (daysLeft(n.targetDate) ?? 999) >= 0);
        const archived = filtered.filter((n) => n.isCompleted || (daysLeft(n.targetDate) ?? 999) < 0);

        return (showArchived ? archived : active).sort((a, b) =>
            (daysLeft(a.targetDate) ?? 9999) - (daysLeft(b.targetDate) ?? 9999)
        );
    }, [notes, showArchived, daysLeft, reminderFilter, currentUserId]);

    const logs = useMemo(() => {
        let filtered = notes.filter((n) => !n.targetDate);

        if (logFilter === 'my') {
            filtered = filtered.filter((n) => String(n.createdBy?._id || n.createdBy) === String(currentUserId));
        } else if (logFilter === 'tagged') {
            filtered = filtered.filter((n) => String(n.linkedEntityId?._id || n.linkedEntityId) === String(currentUserId));
        }

        return filtered;
    }, [notes, logFilter, currentUserId]);

    const markDone = useCallback(async (id) => {
        if (!window.confirm("Mark this reminder as done?")) return;
        try {
            await axios.patch(`${API_BASE}/notes/${id}/done`, {}, { headers: authHeaders() });
            toast.success("Marked as done!");
            await fetchData();
        } catch {
            toast.error("Could not update status");
        }
    }, [fetchData]);

    const resetForm = useCallback(() => {
        setContent("");
        setEditId(null);
        setForm(null);
        setCategory("general");
        setDate("");
        setFile(null);
        setEntity("");
    }, []);

    const saveNote = useCallback(async () => {
        if (!content.trim()) return toast.error("Content is required");
        const fd = new FormData();
        fd.append("content", content);
        fd.append("category", category);
        if (date) fd.append("targetDate", date);
        if (file) fd.append("attachment", file);
        if (entity) fd.append("linkedEntityId", entity);

        try {
            const config = { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } };
            if (editId) {
                await axios.patch(`${API_BASE}/notes/${editId}`, fd, config);
            } else {
                await axios.post(`${API_BASE}/notes`, fd, config);
            }
            toast.success(editId ? "Updated successfully" : "Saved successfully");
            resetForm();
            fetchData();
        } catch {
            toast.error("Failed to save");
        }
    }, [content, category, date, file, entity, editId, fetchData, resetForm]);

    const deleteNote = useCallback(async (id) => {
        if (!window.confirm("Delete permanently?")) return;
        try {
            await axios.delete(`${API_BASE}/notes/${id}`, { headers: authHeaders() });
            toast.success("Deleted");
            fetchData();
        } catch {
            toast.error("Delete failed");
        }
    }, [fetchData]);

    const openForm = useCallback((type) => {
        setForm(type);
        setCategory(type === "reminder" ? "reminder" : "general");
        setEntity("");
        setDate("");
        setFile(null);
        setContent("");
        setEditId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const editNote = useCallback((n) => {
        setEditId(n._id);
        setContent(n.content || "");
        const isReminder = !!n.targetDate;
        setForm(isReminder ? "reminder" : "note");
        setCategory(n.category || (isReminder ? "reminder" : "general"));
        setDate(n.targetDate ? new Date(n.targetDate).toISOString().split("T")[0] : "");

        const rawLinked = n.linkedEntityId;
        const linkedId = rawLinked && typeof rawLinked === "object" ? (rawLinked._id || "") : (rawLinked || "");
        setEntity(linkedId);
    }, []);

    const isEmployeeTagged = useCallback((note) => {
        if (!currentUserId || !note?.linkedEntityId) return false;
        const linkedId = typeof note.linkedEntityId === "object" ? note.linkedEntityId._id : note.linkedEntityId;
        return String(linkedId).trim() === String(currentUserId).trim();
    }, [currentUserId]);

    const getCreatorInfo = useCallback((note) => {
        if (!note?.createdBy) return { display: "Unknown", isAdmin: false };
        const creator = note.createdBy;
        const isOwn = String(creator._id || creator) === String(currentUserId);
        const name = creator.fullName || "Unknown User";
        const display = isOwn ? "ME" : name;
        const isAdmin = creator.role === "admin" || creator.role === "super_admin";
        return { display, isAdmin };
    }, [currentUserId]);

    const isOwnItem = useCallback((item) => {
        if (!currentUserId || !item?.createdBy) return false;
        const creatorId = item.createdBy?._id || item.createdBy;
        return String(creatorId).trim() === String(currentUserId).trim();
    }, [currentUserId]);

    return {
        isBS,
        setIsBS,
        showArchived,
        setShowArchived,
        stats,
        notes,
        dropdowns,
        loading,
        form,
        content,
        setContent,
        category,
        setCategory,
        date,
        setDate,
        file,
        setFile,
        entity,
        setEntity,
        urgentCount,
        sortedReminders,
        logs,
        daysLeft,
        markDone,
        saveNote,
        deleteNote,
        editNote,
        resetForm,
        openForm,
        fetchData,
        currentUserId,
        formatStatValue,
        isEmployeeTagged,
        getCreatorInfo,
        reminderFilter,
        setReminderFilter,
        logFilter,
        setLogFilter,
        isOwnItem,
        editId,
    };
}

export default function EmployeeDashboard({ navigateTo = () => { } }) {
    const {
        isBS, setIsBS,
        showArchived, setShowArchived,
        stats, dropdowns, loading,
        form, content, setContent, category, setCategory,
        date, setDate, file, setFile, entity, setEntity,
        urgentCount, sortedReminders, logs,
        markDone, saveNote, deleteNote, editNote,
        resetForm, openForm, fetchData,
        currentUserId, formatStatValue,
        isEmployeeTagged, getCreatorInfo,
        reminderFilter, setReminderFilter,
        logFilter, setLogFilter,
        isOwnItem,
        editId,
    } = useDashboard();

    const workersMap = useMemo(() => {
        const m = {};
        (dropdowns.workers || []).forEach(w => m[w._id] = w);
        return m;
    }, [dropdowns]);

    const employersMap = useMemo(() => {
        const m = {};
        (dropdowns.employers || []).forEach(e => m[e._id] = e);
        return m;
    }, [dropdowns]);

    const demandsMap = useMemo(() => {
        const m = {};
        (dropdowns.demands || []).forEach(d => m[d._id] = d);
        return m;
    }, [dropdowns]);

    const subAgentsMap = useMemo(() => {
        const m = {};
        (dropdowns.subAgents || []).forEach(s => m[s._id] = s);
        return m;
    }, [dropdowns]);

    const getLinkedLabel = useCallback((note) => {
        if (!note?.linkedEntityId) return null;
        const id = typeof note.linkedEntityId === "object" ? note.linkedEntityId._id : note.linkedEntityId;

        if (note.category === "worker") return workersMap[id]?.name || "Worker";
        if (note.category === "employer") return employersMap[id]?.employerName || "Employer";
        if (note.category === "job-demand") return demandsMap[id]?.jobTitle || "Job Demand";
        if (note.category === "sub-agent") return subAgentsMap[id]?.name || "Sub Agent";
        return "Entity";
    }, [workersMap, employersMap, demandsMap, subAgentsMap]);

    // ────────────────────────────────────────────────
    //   GLOBAL SEARCH (added - nothing removed)
    // ────────────────────────────────────────────────

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const performSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setSearchLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/search`, {
                params: { q: q.trim() },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setSearchResults(res.data.results || []);
                setShowSearchResults(true);
            }
        } catch (err) {
            console.error('Search failed', err);
            toast.error('Search failed. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const debouncedSearch = useCallback(debounce(performSearch, 400), [performSearch]);

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (item) => {
        setSearchQuery('');
        setShowSearchResults(false);

        const id = item._id;
        if (!id) {
            toast.error("Cannot open item: missing ID");
            return;
        }

        switch (item.type) {
            case 'worker':
                navigateTo(`worker?id=${id}`);
                break;
            case 'employer':
                navigateTo(`employer?id=${id}`);
                break;
            case 'job-demand':
                navigateTo(`job-demand?id=${id}`);
                break;
            case 'sub-agent':
                navigateTo(`subagent?id=${id}`);
                break;
            case 'note':
            case 'reminder':
                toast.success(`Selected ${item.type}: ${item.content?.substring(0, 40) || 'Note'}...`);
                break;
            default:
                toast.error(`Unknown entity type: ${item.type}`);
                break;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <RefreshCw className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    const statCards = [
        { title: "Employers", value: formatStatValue(stats.employersAdded), icon: <Building2 size={28} />, gradient: "from-blue-600 to-indigo-600", path: "employer" },
        { title: "Job Demands", value: formatStatValue(stats.activeJobDemands), icon: <Briefcase size={28} />, gradient: "from-purple-600 to-indigo-600", path: "job-demand" },
        { title: "Workers", value: formatStatValue(stats.workersInProcess), icon: <Users size={28} />, gradient: "from-emerald-600 to-teal-600", path: "worker" },
        { title: "Sub Agents", value: formatStatValue(stats.activeSubAgents), icon: <UserCircle size={28} />, gradient: "from-slate-700 to-slate-900", path: "subagent" },
        { title: "Priority Tasks", value: urgentCount, icon: <AlertCircle size={28} />, gradient: "from-orange-500 to-rose-600" },
    ];

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 lg:space-y-10 text-slate-800">
                {/* HEADER + ADD NOTE / ADD REMINDER BUTTONS */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl">
                            <UserCircle size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Management Hub</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
                                <Clock />
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex bg-slate-200 p-1.5 rounded-xl font-bold">
                            <button
                                onClick={() => setIsBS(false)}
                                className={`px-5 py-2 rounded-lg transition-all ${!isBS ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                            >
                                AD
                            </button>
                            <button
                                onClick={() => setIsBS(true)}
                                className={`px-5 py-2 rounded-lg transition-all ${isBS ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                            >
                                BS
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => openForm("note")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 sm:px-6 h-11 sm:h-12 font-bold shadow-lg flex items-center gap-2"
                            >
                                <Plus size={18} /> Note
                            </Button>
                            <Button
                                onClick={() => openForm("reminder")}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 sm:px-6 h-11 sm:h-12 font-bold shadow-lg flex items-center gap-2"
                            >
                                <Bell size={18} /> Reminder
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ──── GLOBAL SEARCH BAR (added here) ──── */}
                <div ref={searchRef} className="relative w-full">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearchResults(true)}
                            placeholder="Search workers, employers, job demands, sub-agents..."
                            className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white shadow-md text-base placeholder:text-slate-400"
                        />
                        {searchLoading && (
                            <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={22} />
                        )}
                        {searchQuery && !searchLoading && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[60vh] overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    No results found for <span className="font-medium">"{searchQuery}"</span>
                                </div>
                            ) : (
                                <>
                                    <div className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 border-b">
                                        Results ({searchResults.length})
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {searchResults.map((item) => {
                                            let iconComponent = <Search size={20} />;
                                            let bgColor = "bg-slate-600";

                                            switch (item.type) {
                                                case 'worker':
                                                    iconComponent = <Users size={20} />;
                                                    bgColor = "bg-teal-600";
                                                    break;
                                                case 'employer':
                                                    iconComponent = <Building2 size={20} />;
                                                    bgColor = "bg-emerald-600";
                                                    break;
                                                case 'job-demand':
                                                    iconComponent = <BriefcaseBusiness size={20} />;
                                                    bgColor = "bg-orange-600";
                                                    break;
                                                case 'sub-agent':
                                                    iconComponent = <UserCircle size={20} />;
                                                    bgColor = "bg-purple-600";
                                                    break;
                                                case 'note':
                                                case 'reminder':
                                                    iconComponent = <FileText size={20} />;
                                                    bgColor = "bg-amber-600";
                                                    break;
                                            }

                                            let subtitle = '';
                                            switch (item.type) {
                                                case 'worker':
                                                    subtitle = [item.passportNumber, item.phone || item.contact].filter(Boolean).join(' • ') || item.status || 'Worker';
                                                    break;
                                                case 'employer':
                                                    subtitle = item.country || 'Employer';
                                                    break;
                                                case 'job-demand':
                                                    subtitle = [item.employerName || item.companyName, item.country].filter(Boolean).join(' • ') || 'Demand';
                                                    break;
                                                case 'sub-agent':
                                                    subtitle = [item.phone || item.contact, item.email].filter(Boolean).join(' • ') || 'Sub-agent';
                                                    break;
                                                default:
                                                    subtitle = item.category || item.status || '—';
                                            }

                                            return (
                                                <button
                                                    key={item._id}
                                                    onClick={() => handleResultClick(item)}
                                                    className="w-full px-6 py-4 text-left hover:bg-indigo-50 transition-colors flex items-center gap-5"
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${bgColor}`}>
                                                        {iconComponent}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate text-base">
                                                            {item.title || item.name || item.employerName || item.jobTitle || item.content?.substring(0, 60) || '—'}
                                                        </p>
                                                        <p className="text-sm text-slate-500 mt-1 truncate">
                                                            {item.type.toUpperCase()} • {subtitle}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    {statCards.map((stat) => (
                        <StatCard
                            key={stat.title}
                            {...stat}
                            onNavigate={navigateTo}
                        />
                    ))}
                </div>

                {/* Main two-column content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Left column - Reminders + Form */}
                    <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                        {form && (
                            <Card className="p-6 sm:p-7 lg:p-8 rounded-2xl shadow-md border border-slate-200/70 bg-white">
                                <h2 className="text-xl sm:text-2xl font-black mb-6 flex items-center gap-3">
                                    {form === "reminder" ? <Bell className="text-rose-600" size={26} /> : <FileText className="text-indigo-600" size={26} />}
                                    {form === "reminder" ? "New Reminder" : "New Note / Log"}
                                </h2>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            {form === "reminder" ? "Reminder message" : "Note content"}
                                        </label>
                                        <textarea
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none min-h-[120px] resize-y text-base"
                                            placeholder={form === "reminder" ? "e.g. Call Mr. Ram regarding visa process" : "Write your note here..."}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Category</label>
                                            <select
                                                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            >
                                                <option value="general">General</option>
                                                <option value="reminder">Reminder</option>
                                                <option value="worker">Worker</option>
                                                <option value="employer">Employer</option>
                                                <option value="job-demand">Job Demand</option>
                                                <option value="sub-agent">Sub Agent</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">
                                                {form === "reminder" ? "Target Date" : "Due Date (optional)"}
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full p-3.5 rounded-xl border border-slate-200 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Link to entity (optional)</label>
                                        <select
                                            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
                                            value={entity}
                                            onChange={(e) => setEntity(e.target.value)}
                                        >
                                            <option value="">— Not linked —</option>

                                            {category === "worker" &&
                                                dropdowns.workers?.map((w) => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name}
                                                    </option>
                                                ))}

                                            {category === "employer" &&
                                                dropdowns.employers?.map((e) => (
                                                    <option key={e._id} value={e._id}>
                                                        {e.employerName || e.name || "Unnamed Employer"}
                                                    </option>
                                                ))}

                                            {category === "job-demand" &&
                                                dropdowns.demands?.map((d) => (
                                                    <option key={d._id} value={d._id}>
                                                        {d.jobTitle || "Untitled Demand"}
                                                    </option>
                                                ))}

                                            {category === "sub-agent" &&
                                                dropdowns.subAgents?.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name || "Unnamed Sub Agent"}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Attachment (optional)</label>
                                        <input
                                            type="file"
                                            className="w-full p-3 rounded-xl border border-slate-200 text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-colors"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-slate-100">
                                        <Button
                                            variant="destructive"
                                            onClick={resetForm}
                                            className="flex-1 h-12 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            onClick={saveNote}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-semibold shadow-md transition-all sm:order-last"
                                        >
                                            {editId ? "Update" : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Reminders Section */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Bell size={24} className="text-rose-600" />
                                        {urgentCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-sm">
                                                {urgentCount > 9 ? "9+" : urgentCount}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black">
                                        {showArchived ? "Archived Reminders" : "Reminders"}
                                    </h2>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 sm:justify-between">
                                    <div className="flex bg-slate-100 p-1 rounded-xl text-sm font-medium border border-slate-200 w-fit">
                                        <button
                                            onClick={() => setShowArchived(false)}
                                            className={`px-5 py-2 rounded-lg transition-all font-medium ${!showArchived
                                                ? "bg-white shadow-sm text-indigo-700 font-semibold border border-indigo-200"
                                                : "text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() => setShowArchived(true)}
                                            className={`px-5 py-2 rounded-lg transition-all font-medium ${showArchived
                                                ? "bg-white shadow-sm text-indigo-700 font-semibold border border-indigo-200"
                                                : "text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            Archived
                                        </button>
                                    </div>

                                    <select
                                        className="p-2.5 rounded-xl border-2 border-indigo-100 bg-white text-sm font-bold shadow-sm w-full sm:w-auto min-w-[140px]"
                                        value={reminderFilter}
                                        onChange={(e) => setReminderFilter(e.target.value)}
                                    >
                                        <option value="all">All</option>
                                        <option value="my">My Reminders</option>
                                        <option value="tagged">Tagged for Me</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                                {sortedReminders.length === 0 ? (
                                    <p className="text-center text-slate-400 py-12">
                                        No {showArchived ? "archived" : "active"} reminders found
                                    </p>
                                ) : (
                                    sortedReminders.map((rem) => {
                                        const { display: creatorDisplay, isAdmin: isAdminPosted } = getCreatorInfo(rem);
                                        const isOwn = isOwnItem(rem);
                                        return (
                                            <ReminderItem
                                                key={rem._id}
                                                rem={rem}
                                                isBS={isBS}
                                                markDone={markDone}
                                                editNote={editNote}
                                                deleteNote={deleteNote}
                                                linkedLabel={getLinkedLabel(rem)}
                                                isTagged={isEmployeeTagged(rem)}
                                                creatorDisplay={creatorDisplay}
                                                isAdminPosted={isAdminPosted}
                                                isOwn={isOwn}
                                                showArchived={showArchived}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right column - Operational Logs */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
                            <h2 className="text-xl font-black flex items-center gap-3 whitespace-nowrap">
                                <FileText size={24} className="text-indigo-600" /> Operational Logs
                            </h2>

                            <select
                                className="p-2.5 rounded-xl border-2 border-indigo-100 bg-white text-sm font-bold shadow-sm w-full sm:w-auto min-w-[140px]"
                                value={logFilter}
                                onChange={(e) => setLogFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="my">My Notes</option>
                                <option value="tagged">Tagged for Me</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[860px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-400 py-12 col-span-2">No operational logs yet</p>
                            ) : (
                                logs.map((note) => {
                                    const { display: creatorDisplay, isAdmin: isAdminPosted } = getCreatorInfo(note);
                                    const isOwn = isOwnItem(note);

                                    const displayDate = isBS
                                        ? `${toNepaliShort(note.createdAt).month} ${toNepaliShort(note.createdAt).day}`
                                        : new Date(note.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        });

                                    return (
                                        <div
                                            key={note._id}
                                            className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors group ${isEmployeeTagged(note) ? "bg-indigo-50/40 border-indigo-200" : ""
                                                }`}
                                        >
                                            {isEmployeeTagged(note) && (
                                                <Badge className="self-start mb-3 bg-indigo-500 text-white text-xs font-bold px-3 py-1">
                                                    <AtSign size={12} className="inline mr-1" /> You are tagged
                                                </Badge>
                                            )}

                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-black uppercase px-3 py-1">
                                                        {note.category}
                                                    </Badge>
                                                    {note.attachment && (
                                                        <a
                                                            href={`${FILE_BASE}/${note.attachment}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                        >
                                                            <Paperclip size={16} />
                                                        </a>
                                                    )}
                                                </div>

                                                <p className="text-md text-slate-700 font-bold leading-relaxed line-clamp-4">{note.content}</p>

                                                {getLinkedLabel(note) && (
                                                    <div className="text-sm text-slate-500 mt-2">
                                                        Linked: <span className="font-bold text-slate-700">{getLinkedLabel(note)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center flex-wrap gap-2">
                                                <span>By: <span className="font-medium text-slate-800">{creatorDisplay}</span></span>
                                                {isAdminPosted && (
                                                    <Badge className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                                                        <ShieldCheck size={12} /> Admin
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-4 flex justify-between items-center text-sm">
                                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isOwn && (
                                                        <>
                                                            <button onClick={() => editNote(note)} className="text-slate-400 hover:text-indigo-600">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => deleteNote(note._id)} className="text-slate-400 hover:text-rose-600">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {displayDate}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Command Center */}
                <div className="pt-10 border-t border-slate-200">
                    <div className="mb-6 px-2">
                        <h2 className="text-2xl font-black text-slate-900">Command Center</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Quick Actions</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { to: "worker", color: "emerald", icon: <UserPlus />, title: "Add Worker", desc: "Register & upload documents" },
                            { to: "employer", color: "blue", icon: <Building2 />, title: "New Employer", desc: "Add company to directory" },
                            { to: "job-demand-add", color: "purple", icon: <FilePlus />, title: "Post Demand", desc: "Create job requirement" },
                            { to: "subagent", color: "orange", icon: <Users />, title: "Sub Agents", desc: "Manage recruitment partners" },
                        ].map((item) => (
                            <button
                                key={item.title}
                                onClick={() => navigateTo(item.to)}
                                className="flex flex-col p-7 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group text-left"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <span className="text-base font-black text-slate-900">{item.title}</span>
                                <p className="text-sm text-slate-500 mt-1.5">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes pulse-fast {
          0%,100% { opacity:1; transform:scale(1) }
          50% { opacity:0.7; transform:scale(1.15) }
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1) }
          50% { opacity:0.8; transform:scale(1.08) }
        }
        @keyframes pulse-slow {
          0%,100% { opacity:1; transform:scale(1) }
          50% { opacity:0.85; transform:scale(1.05) }
        }

        .animate-pulse-fast { animation: pulse-fast 1.2s infinite ease-in-out; }
        .animate-pulse { animation: pulse 1.8s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 2.8s infinite ease-in-out; }
      `}</style>
        </>
    );
} 