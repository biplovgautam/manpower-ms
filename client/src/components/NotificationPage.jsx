"use client";
import { Bell, CheckCheck, Clock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function NotificationsPage({ notifications = [], onMarkAllAsRead, currentUserId }) {
    const [filter, setFilter] = useState('All');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true;
        return n.category?.toLowerCase() === filter.toLowerCase();
    });

    const categories = ['All', 'Worker', 'Demand', 'Agent', 'Employer', 'System'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Activity Log</h1>
                        <p className="text-slate-500 text-sm">Real-time audit trail of company operations.</p>
                    </div>

                    {notifications.some(n => !n.isReadBy?.includes(currentUserId)) && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${filter === cat
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="min-h-[450px] bg-slate-50/30 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                    {filteredNotifications.length > 0 ? (
                        <div className="w-full divide-y divide-slate-100">
                            {filteredNotifications.map((item) => {
                                const isUnread = currentUserId && !item.isReadBy?.includes(currentUserId);
                                return (
                                    <div key={item._id} className={`p-6 flex items-start gap-4 transition-all hover:bg-white relative ${isUnread ? 'bg-indigo-50/30' : ''}`}>
                                        {isUnread && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isUnread ? 'bg-indigo-100 text-indigo-600' : 'bg-white border text-slate-400'}`}>
                                            {item.category === 'system' ? <ShieldCheck size={20} /> : <Bell size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900">{item.createdBy?.fullName || "System"}</span>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase">{item.category}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                                    <Clock size={12} />
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm">{item.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <Bell className="text-slate-200 mb-4" size={48} />
                            <h3 className="text-slate-800 font-black">No notifications here</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}