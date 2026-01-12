"use client";

import adbs from "ad-bs-converter";
import axios from "axios";
import {
    AlertCircle,
    Bell,
    Briefcase,
    Building2,
    CheckCircle,
    Clock as ClockIcon,
    Edit,
    FilePlus,
    FileText,
    Paperclip,
    Plus,
    RefreshCw,
    Trash2,
    UserCircle,
    UserPlus,
    Users,
    X as CloseIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

/**
 * Employee Dashboard (updated)
 * - Removed "Reminder" option from the category select in new note form
 * - Added dropdowns to the Reminder form to link reminders to entities (worker/employer/job-demand/sub-agent)
 * - Saves linkedEntityId (and linkedEntityType) for reminders as well
 * - Keeps the single urgent toast (no duplicates) with the updated design
 */

/* ----------------------------- Constants -------------------------------- */

const API_BASE = "http://localhost:5000/api/dashboard";
const FILE_BASE = "http://localhost:5000";

const NEPALI_MONTHS = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashoj",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
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

/* ----------------------------- Helpers ---------------------------------- */

const getNepalTime = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));

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
        return {
            month: d.toLocaleString("en-US", { month: "short" }),
            day: d.getDate(),
        };
    }
}

function authHeaders() {
    const token = localStorage.getItem("token") || "";
    return { Authorization: `Bearer ${token}` };
}

/* ----------------------------- Clock ------------------------------------ */

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

/* ----------------------------- StatCard --------------------------------- */

const StatCard = memo(function StatCard({ title, value, icon, gradient, onClick }) {
    return (
        <Card
            onClick={onClick}
            className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
        >
            <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{value ?? "—"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
});

/* -------------------------- ReminderItem -------------------------------- */

const ReminderItem = memo(function ReminderItem({ rem, isBS, markDone, editNote, deleteNote, linkedLabel }) {
    const daysLeft = useCallback((targetDate) => {
        if (!targetDate) return null;
        const diffMs = new Date(targetDate) - getNepalTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }, []);

    const getDateDisplay = useCallback((targetDate) => {
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

    const d = daysLeft(rem.targetDate);
    const isOver = d < 0;
    const isToday = d === 0;
    const isSoon = d > 0 && d <= 3;

    const border = isOver ? "border-red-600" : isToday ? "border-red-500" : isSoon ? "border-orange-500" : "border-blue-400";
    const bg = isOver ? "bg-rose-50/70" : isToday ? "bg-red-50/60" : isSoon ? "bg-orange-50/50" : "";
    const badge = isOver ? "bg-red-600 text-white" : isToday ? "bg-red-500 text-white" : isSoon ? "bg-orange-500 text-white" : "bg-blue-100 text-blue-700";
    const anim = isOver ? "animate-pulse-fast text-red-600" : isToday ? "animate-pulse text-red-500" : isSoon ? "animate-pulse-slow text-orange-600" : "text-blue-500";
    const prio = isOver ? "OVERDUE" : isToday ? "TODAY" : isSoon ? `${d} days left` : `${d} days`;
    const dateDisplay = getDateDisplay(rem.targetDate);

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-8 flex gap-5 hover:shadow-md transition-all group ${border} ${bg}`}>
            <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-2xl shrink-0 border shadow-sm">
                <span className="text-xs font-black text-slate-600 uppercase mb-1">
                    {isBS ? dateDisplay.month : new Date(rem.targetDate).toLocaleString("en-US", { month: "short" })}
                </span>
                <span className="text-2xl font-black text-slate-800">
                    {isBS ? dateDisplay.day : new Date(rem.targetDate).getDate()}
                </span>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Bell size={20} className={`shrink-0 ${anim}`} />
                    <p className="text-md font-bold text-slate-900 leading-snug flex-1">{rem.content}</p>
                </div>

                {linkedLabel && (
                    <div className="text-sm text-slate-500 mb-2">Linked: <span className="font-bold text-slate-700">{linkedLabel}</span></div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Badge className={`text-xs font-black px-3 py-1 border-none ${badge}`}>{prio}</Badge>
                        {rem.isCompleted && (
                            <Badge className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1">DONE</Badge>
                        )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!rem.isCompleted && (
                            <button
                                onClick={() => markDone(rem._id)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                title="Mark as Done"
                            >
                                <CheckCircle size={18} />
                            </button>
                        )}
                        <button onClick={() => editNote(rem)} className="p-1.5 hover:text-indigo-600">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => deleteNote(rem._id)} className="p-1.5 hover:text-rose-600">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

/* --------------------------- useDashboard --------------------------------
   Encapsulates fetching, saving, deleting, state for the dashboard.
*/

function useDashboard() {
    const [isBS, setIsBS] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [stats, setStats] = useState({});
    const [notes, setNotes] = useState([]);
    const [dropdowns, setDropdowns] = useState({});
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("general"); // categories for general notes (worker/employer/job-demand/sub-agent/general)
    const [date, setDate] = useState("");
    const [file, setFile] = useState(null);
    const [entity, setEntity] = useState("");

    // For reminders: choose which entity type to link to (worker/employer/job-demand/sub-agent)
    const [reminderLinkType, setReminderLinkType] = useState("worker");

    const [urgentCount, setUrgentCount] = useState(0);

    const entityTypes = ["worker", "employer", "job-demand", "sub-agent"];

    const daysLeft = useCallback((targetDate) => {
        if (!targetDate) return null;
        const diffMs = new Date(targetDate) - getNepalTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // IMPORTANT: backend must return completed notes too (see backend change below)
            const res = await axios.get(API_BASE, { headers: authHeaders() });
            if (res.data?.success) {
                setStats(res.data.data.stats || {});
                setNotes(res.data.data.notes || []);
                setDropdowns(res.data.data.dropdowns || {});
            }
        } catch {
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
            if (n.category !== "reminder" || n.isCompleted) return count;
            const d = daysLeft(n.targetDate);
            return d !== null && d >= 0 && d <= 3 ? count + 1 : count;
        }, 0);

        // update state
        setUrgentCount(urgent);

        // If there are urgent reminders, create/update the single toast (fixed id prevents duplicates).
        // This will show every time the dashboard mounts and urgent > 0.
        if (urgent > 0) {
            const msg = urgent === 1 ? "1 urgent reminder!" : `${urgent} urgent reminders!`;

            toast(
                (t) => (
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center rounded-full bg-red-50 p-2">
                            <AlertCircle className="text-red-600" size={18} />
                        </div>

                        <div className="flex-1 ml-2">
                            <div className="text-sm font-extrabold text-[#7f1d1d]">{msg}</div>
                            <div className="text-xs text-[#9b1f1f] mt-0.5">Check your reminders panel for details</div>
                        </div>

                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                            }}
                            className="ml-3 p-1.5 rounded-full hover:bg-slate-100"
                            aria-label="Close urgent reminder"
                        >
                            <CloseIcon size={16} className="text-slate-600" />
                        </button>
                    </div>
                ),
                {
                    id: URGENT_TOAST_ID,
                    duration: Infinity,
                    position: "top-center",
                    style: URGENT_TOAST_STYLE,
                }
            );
        } else {
            // No urgent reminders — ensure toast is dismissed
            toast.dismiss(URGENT_TOAST_ID);
        }
    }, [notes, loading, daysLeft]);

    const sortedReminders = useMemo(() => {
        const allReminders = notes.filter((n) => n.category === "reminder");
        const active = allReminders.filter((n) => !n.isCompleted && (daysLeft(n.targetDate) ?? 999) >= 0);
        const archived = allReminders.filter((n) => n.isCompleted || (daysLeft(n.targetDate) ?? 999) < 0);
        const displayed = showArchived ? archived : active;
        return [...displayed].sort((a, b) => (daysLeft(a.targetDate) ?? 9999) - (daysLeft(b.targetDate) ?? 9999));
    }, [notes, showArchived, daysLeft]);

    const logs = useMemo(() => notes.filter((n) => n.category !== "reminder"), [notes]);

    const markDone = useCallback(
        async (id) => {
            if (!window.confirm("Mark this reminder as done?")) return;
            try {
                await axios.patch(`${API_BASE}/notes/${id}/done`, {}, { headers: authHeaders() });
                toast.success("Marked as done!");
                await fetchData(); // fetch updated notes (backend must include completed notes)
            } catch {
                toast.error("Could not update status");
            }
        },
        [fetchData]
    );

    const resetForm = useCallback(() => {
        setContent("");
        setEditId(null);
        setForm(null);
        setCategory("general");
        setDate("");
        setFile(null);
        setEntity("");
        setReminderLinkType("worker");
    }, []);

    const saveNote = useCallback(async () => {
        if (!content.trim()) return toast.error("Content is required");
        const fd = new FormData();
        fd.append("content", content);

        // For regular notes, category holds the type (general/worker/employer/job-demand/sub-agent)
        // For reminders, backend expects category 'reminder' but we also allow linking an entity via reminderLinkType.
        fd.append("category", category);

        if (date) fd.append("targetDate", date);
        if (file) fd.append("attachment", file);

        // If entity selected (either in general note or reminder), send linkedEntityId and linkedEntityType
        if (entity) {
            fd.append("linkedEntityId", entity);
            // For reminders, include the reminderLinkType so backend can know the type if needed
            const linkedType = category === "reminder" ? reminderLinkType : category;
            fd.append("linkedEntityType", linkedType);
        }

        try {
            const config = {
                headers: {
                    ...authHeaders(),
                    "Content-Type": "multipart/form-data",
                },
            };
            if (editId) {
                await axios.patch(`${API_BASE}/notes/${editId}`, fd, config);
            } else {
                await axios.post(`${API_BASE}/notes`, fd, config);
            }
            toast.success("Saved successfully");
            resetForm();
            fetchData();
        } catch {
            toast.error("Failed to save");
        }
    }, [content, category, date, file, entity, reminderLinkType, editId, fetchData, resetForm]);

    const deleteNote = useCallback(
        async (id) => {
            if (!window.confirm("Delete permanently?")) return;
            try {
                await axios.delete(`${API_BASE}/notes/${id}`, { headers: authHeaders() });
                toast.success("Deleted");
                fetchData();
            } catch {
                toast.error("Delete failed");
            }
        },
        [fetchData]
    );

    const openForm = useCallback((type) => {
        setForm(type);
        setCategory(type === "reminder" ? "reminder" : "general");
        setEntity("");
        setReminderLinkType("worker");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const detectEntityType = useCallback(
        (id) => {
            if (!id) return null;
            if ((dropdowns.workers || []).some((w) => w._id === id)) return "worker";
            if ((dropdowns.employers || []).some((e) => e._id === id)) return "employer";
            if ((dropdowns.demands || []).some((d) => d._id === id)) return "job-demand";
            if ((dropdowns.subAgents || []).some((s) => s._id === id)) return "sub-agent";
            return null;
        },
        [dropdowns]
    );

    const editNote = useCallback(
        (n) => {
            setEditId(n._id);
            setContent(n.content || "");
            // If note is a reminder, keep category 'reminder' and try to detect linked entity type
            if (n.category === "reminder") {
                setCategory("reminder");
                if (n.linkedEntityId) {
                    const detected = detectEntityType(n.linkedEntityId) || "worker";
                    setReminderLinkType(detected);
                    setEntity(n.linkedEntityId);
                } else {
                    setReminderLinkType("worker");
                    setEntity("");
                }
                setForm("reminder");
            } else {
                // For regular notes categories (worker/employer/job-demand/sub-agent/general)
                setCategory(n.category || "general");
                setEntity(n.linkedEntityId || "");
                setForm(n.category === "reminder" ? "reminder" : "note");
            }
            setDate(n.targetDate ? new Date(n.targetDate).toISOString().split("T")[0] : "");
        },
        [detectEntityType]
    );

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
        setForm,
        editId,
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
        reminderLinkType,
        setReminderLinkType,
        entityTypes,
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
        entityOpts: ["worker", "employer", "job-demand", "sub-agent"],
    };
}

/* ------------------------- Main Component -------------------------------- */

export default function EmployeeDashboard({ onNavigate = () => { } }) {
    const {
        isBS,
        setIsBS,
        showArchived,
        setShowArchived,
        stats,
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
        reminderLinkType,
        setReminderLinkType,
        entityTypes,
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
        entityOpts,
    } = useDashboard();

    // Build quick lookup maps for linked entity labels (O(1) lookup)
    const workersMap = useMemo(() => {
        const m = {};
        (dropdowns.workers || []).forEach((w) => (m[w._id] = w));
        return m;
    }, [dropdowns]);

    const employersMap = useMemo(() => {
        const m = {};
        (dropdowns.employers || []).forEach((e) => (m[e._id] = e));
        return m;
    }, [dropdowns]);

    const demandsMap = useMemo(() => {
        const m = {};
        (dropdowns.demands || []).forEach((d) => (m[d._id] = d));
        return m;
    }, [dropdowns]);

    const subAgentsMap = useMemo(() => {
        const m = {};
        (dropdowns.subAgents || []).forEach((s) => (m[s._id] = s));
        return m;
    }, [dropdowns]);

    const getLinkedLabel = useCallback(
        (note) => {
            if (!note?.linkedEntityId) return null;
            const id = note.linkedEntityId;

            // Try to detect entity type from category first (old behavior)
            switch (note.category) {
                case "worker": {
                    const w = workersMap[id];
                    return w ? `${w.name}${w.passportNumber ? ` • ${w.passportNumber}` : ""}` : id;
                }
                case "employer": {
                    const e = employersMap[id];
                    return e ? `${e.employerName}${e.country ? ` • ${e.country}` : ""}` : id;
                }
                case "job-demand": {
                    const d = demandsMap[id];
                    return d ? d.jobTitle : id;
                }
                case "sub-agent": {
                    const s = subAgentsMap[id];
                    return s ? s.name : id;
                }
                default:
                    // If note.category isn't one of the types (e.g., 'reminder'), try detecting from dropdowns:
                    if (workersMap[id]) return `${workersMap[id].name}${workersMap[id].passportNumber ? ` • ${workersMap[id].passportNumber}` : ""}`;
                    if (employersMap[id]) return `${employersMap[id].employerName}${employersMap[id].country ? ` • ${employersMap[id].country}` : ""}`;
                    if (demandsMap[id]) return demandsMap[id].jobTitle;
                    if (subAgentsMap[id]) return subAgentsMap[id].name;
                    return id;
            }
        },
        [workersMap, employersMap, demandsMap, subAgentsMap]
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F1F5F9]">
                <RefreshCw className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10 space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl">
                            <UserCircle size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Management Hub</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
                                <Clock />
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-12 font-bold shadow-lg flex items-center gap-2"
                            >
                                <Plus size={18} /> Note
                            </Button>
                            <Button
                                onClick={() => openForm("reminder")}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 h-12 font-bold shadow-lg flex items-center gap-2"
                            >
                                <Bell size={18} /> Reminder
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { t: "Employers", v: stats.employersAdded, i: <Building2 size={28} />, g: "from-blue-600 to-indigo-600", n: "employer" },
                        { t: "Job Demands", v: stats.activeJobDemands, i: <Briefcase size={28} />, g: "from-purple-600 to-indigo-600", n: "job-demand" },
                        { t: "Workers", v: stats.workersInProcess, i: <Users size={28} />, g: "from-emerald-600 to-teal-600", n: "worker" },
                        { t: "Priority Tasks", v: stats.tasksNeedingAttention, i: <AlertCircle size={28} />, g: "from-orange-500 to-rose-600" },
                        { t: "Sub Agents", v: stats.activeSubAgents, i: <UserCircle size={28} />, g: "from-slate-700 to-slate-900", n: "subagent" },
                    ].map((p) => (
                        <StatCard key={p.t} title={p.t} value={p.v} icon={p.i} gradient={p.g} onClick={p.n ? () => onNavigate(p.n) : undefined} />
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-5 space-y-8">
                        {form && (
                            <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
                                <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                    {form === "reminder" ? <Bell className="text-rose-600" /> : <FileText className="text-indigo-600" />}
                                    {form === "reminder" ? "New Reminder" : "New Note"}
                                </h2>
                                <div className="space-y-5">
                                    <textarea
                                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[110px]"
                                        placeholder="Write..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <select
                                            className="p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            disabled={form === "reminder"}
                                        >
                                            {/* removed the 'reminder' option as requested */}
                                            <option value="general">General</option>
                                            <option value="worker">Worker</option>
                                            <option value="employer">Employer</option>
                                            <option value="job-demand">Job Demand</option>
                                            <option value="sub-agent">Sub Agent</option>
                                        </select>
                                        <input
                                            type="date"
                                            className="p-3 rounded-xl border border-slate-200 font-bold text-sm"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>

                                    {/* If reminder form is open, show link-type and entity dropdowns similar to the general note */}
                                    {form === "reminder" && (
                                        <>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <select
                                                    className="p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                                                    value={reminderLinkType}
                                                    onChange={(e) => {
                                                        setReminderLinkType(e.target.value);
                                                        setEntity(""); // reset selected entity when link type changes
                                                    }}
                                                >
                                                    <option value="worker">Worker</option>
                                                    <option value="employer">Employer</option>
                                                    <option value="job-demand">Job Demand</option>
                                                    <option value="sub-agent">Sub Agent</option>
                                                </select>

                                                <select
                                                    className="p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                                                    value={entity}
                                                    onChange={(e) => setEntity(e.target.value)}
                                                >
                                                    <option value="">Select {reminderLinkType.replace("-", " ")}</option>

                                                    {reminderLinkType === "worker" &&
                                                        (dropdowns.workers || []).map((i) => (
                                                            <option key={i._id} value={i._id}>
                                                                {i.name} - {i.passportNumber || "N/A"}
                                                            </option>
                                                        ))}

                                                    {reminderLinkType === "employer" &&
                                                        (dropdowns.employers || []).map((i) => (
                                                            <option key={i._id} value={i._id}>
                                                                {i.employerName} - {i.country || "N/A"}
                                                            </option>
                                                        ))}

                                                    {reminderLinkType === "job-demand" &&
                                                        (dropdowns.demands || []).map((i) => (
                                                            <option key={i._id} value={i._id}>
                                                                {i.jobTitle}
                                                            </option>
                                                        ))}

                                                    {reminderLinkType === "sub-agent" &&
                                                        (dropdowns.subAgents || []).map((i) => (
                                                            <option key={i._id} value={i._id}>
                                                                {i.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* For regular notes (form !== 'reminder'), show the entity dropdown when category is linkable */}
                                    {form !== "reminder" && entityOpts.includes(category) && (
                                        <select
                                            className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                                            value={entity}
                                            onChange={(e) => setEntity(e.target.value)}
                                        >
                                            <option value="">Select {category.replace("-", " ")}</option>
                                            {category === "worker" &&
                                                (dropdowns.workers || []).map((i) => (
                                                    <option key={i._id} value={i._id}>
                                                        {i.name} - {i.passportNumber || "N/A"}
                                                    </option>
                                                ))}
                                            {category === "employer" &&
                                                (dropdowns.employers || []).map((i) => (
                                                    <option key={i._id} value={i._id}>
                                                        {i.employerName} - {i.country || "N/A"}
                                                    </option>
                                                ))}
                                            {category === "job-demand" &&
                                                (dropdowns.demands || []).map((i) => (
                                                    <option key={i._id} value={i._id}>
                                                        {i.jobTitle}
                                                    </option>
                                                ))}
                                            {category === "sub-agent" &&
                                                (dropdowns.subAgents || []).map((i) => (
                                                    <option key={i._id} value={i._id}>
                                                        {i.name}
                                                    </option>
                                                ))}
                                        </select>
                                    )}

                                    <input
                                        type="file"
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />

                                    <div className="flex gap-3">
                                        <Button onClick={saveNote} className="flex-1 bg-slate-900 hover:bg-black text-white py-6 rounded-xl font-bold">
                                            Save
                                        </Button>
                                        <Button variant="outline" onClick={resetForm} className="flex-1 py-6 rounded-xl font-bold">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Reminders */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-black flex items-center gap-3 relative">
                                    <div className="relative">
                                        <Bell size={24} className="text-rose-600" />
                                        {urgentCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-sm">
                                                {urgentCount > 9 ? "9+" : urgentCount}
                                            </span>
                                        )}
                                    </div>
                                    Reminders
                                </h2>
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="text-xs font-black px-4 py-2 rounded-xl border bg-white text-slate-500 uppercase tracking-widest hover:bg-slate-50"
                                >
                                    {showArchived ? "Active" : "Archive"}
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                                {sortedReminders.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No {showArchived ? "archived" : "active"} reminders</p>
                                ) : (
                                    sortedReminders.map((rem) => (
                                        <ReminderItem
                                            key={rem._id}
                                            rem={rem}
                                            isBS={isBS}
                                            markDone={markDone}
                                            editNote={editNote}
                                            deleteNote={deleteNote}
                                            linkedLabel={getLinkedLabel(rem)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Logs */}
                    <div className="lg:col-span-7 space-y-6">
                        <h2 className="text-xl font-black flex items-center gap-3 px-2">
                            <FileText size={24} className="text-indigo-600" /> Operational Logs
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[860px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-400 py-12 col-span-2">No notes yet</p>
                            ) : (
                                logs.map((note) => {
                                    const linkedLabel = getLinkedLabel(note);
                                    return (
                                        <div
                                            key={note._id}
                                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors group"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-black uppercase px-3 py-1">
                                                        {note.category}
                                                    </Badge>
                                                    {note.attachment && (
                                                        <a href={`${FILE_BASE}/${note.attachment}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                                                            <Paperclip size={16} />
                                                        </a>
                                                    )}
                                                </div>

                                                <p className="text-md text-slate-700 font-bold leading-relaxed line-clamp-4">{note.content}</p>

                                                {linkedLabel && (
                                                    <div className="text-sm text-slate-500 mt-2">
                                                        Linked: <span className="font-bold text-slate-700">{linkedLabel}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-sm">
                                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => editNote(note)} className="text-slate-400 hover:text-indigo-600">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => deleteNote(note._id)} className="text-slate-400 hover:text-rose-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Command Center */}
                <div className="pt-12 border-t border-slate-200">
                    <div className="mb-6 px-2">
                        <h2 className="text-2xl font-black text-slate-900">Command Center</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Quick Actions</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { to: "worker-add", c: "emerald", i: <UserPlus />, t: "Add Worker", d: "Register & upload documents" },
                            { to: "employer-add", c: "blue", i: <Building2 />, t: "New Employer", d: "Add company to directory" },
                            { to: "job-demand-add", c: "purple", i: <FilePlus />, t: "Post Demand", d: "Create job requirement" },
                            { to: "subagent", c: "orange", i: <Users />, t: "Sub Agents", d: "Manage recruitment partners" },
                        ].map((x) => (
                            <button
                                key={x.t}
                                onClick={() => onNavigate(x.to)}
                                className={`flex flex-col p-7 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group text-left`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${x.c}-100 text-${x.c}-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    {x.i}
                                </div>
                                <span className="text-base font-black text-slate-900">{x.t}</span>
                                <p className="text-sm text-slate-500 mt-1.5">{x.d}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

        @keyframes pulse-fast { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.7; transform:scale(1.15) } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.8; transform:scale(1.08) } }
        @keyframes pulse-slow { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.85; transform:scale(1.05) } }

        .animate-pulse-fast { animation: pulse-fast 1.2s infinite ease-in-out; }
        .animate-pulse { animation: pulse 1.8s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 2.8s infinite ease-in-out; }
      `}</style>
        </>
    );
}