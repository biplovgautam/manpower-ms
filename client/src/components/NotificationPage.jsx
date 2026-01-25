"use client";
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { useState } from 'react';

export default function NotificationsPage({ notifications = [] }) {
    const [filter, setFilter] = useState('All');

    // Filter logic: Checks category field first, then content
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true;
        const categoryMatch = n.category?.toLowerCase() === filter.toLowerCase();
        const contentMatch = n.content?.toLowerCase().includes(filter.toLowerCase());
        return categoryMatch || contentMatch;
    });

    const categories = ['All', 'Worker', 'Demand', 'Agent', 'Employer'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Activity Log</h1>
                        <p className="text-slate-500 text-sm">Monitor all company-wide updates and changes.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                        <CheckCheck size={18} />
                        Mark all as read
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === cat
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Notification List Area */}
                <div className="min-h-[400px] border-2 border-dashed border-slate-100 rounded-3xl overflow-hidden flex flex-col">
                    {filteredNotifications.length > 0 ? (
                        <div className="w-full divide-y divide-slate-100">
                            {filteredNotifications.map((item) => (
                                <div key={item._id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-900">{item.createdBy?.fullName || "System"}</p>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                                <Clock size={12} />
                                                {new Date(item.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm mt-1">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="text-slate-200" size={40} />
                            </div>
                            <p className="text-slate-400 font-bold">No notifications found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}