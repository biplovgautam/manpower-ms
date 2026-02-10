"use client";

import {
    AlertTriangle, Bug, CheckCircle,
    ChevronLeft,
    Clock, Image as ImageIcon,
    Layout,
    LifeBuoy, MessageSquarePlus, Send, ShieldCheck, X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/api';

export function SupportPage({ user }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [base64Image, setBase64Image] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    // FETCH HISTORY
    const fetchHistory = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(apiUrl('/api/support/my-reports'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resData = await response.json();
            if (response.ok) {
                const history = resData.data.map(item => ({
                    id: item._id,
                    category: item.category,
                    text: item.message,
                    image: item.attachments?.[0] || null,
                    time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                }));
                setMessages(history);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // Auto-scroll to bottom when messages change or category changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeCategory]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(URL.createObjectURL(file));
            const reader = new FileReader();
            reader.onloadend = () => setBase64Image(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!inputValue.trim() && !base64Image) || isSending) return;

        setIsSending(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(apiUrl('/api/support'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: activeCategory === 'all' ? 'feedback' : activeCategory, // Default to feedback if in 'all' view
                    message: inputValue,
                    imageUrl: base64Image
                })
            });

            const resData = await response.json();

            if (response.ok) {
                const newMessage = {
                    id: resData.data._id,
                    category: resData.data.category,
                    text: inputValue,
                    image: base64Image,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                };
                setMessages(prev => [...prev, newMessage]);
                setInputValue("");
                setSelectedImage(null);
                setBase64Image(null);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setIsSending(false);
        }
    };

    // FILTER LOGIC: If 'all' is selected, show everything. Otherwise, filter by category.
    const filteredMessages = activeCategory === 'all'
        ? messages
        : messages.filter(msg => msg.category === activeCategory);

    return (
        <div className="relative flex flex-col h-[680px] w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

            {showSuccess && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <CheckCircle size={20} />
                        <span className="font-bold text-sm">Message Sent</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {activeCategory && (
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white rotate-3">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Support Center</h3>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                            {activeCategory ? `Viewing: ${activeCategory}` : 'Select Category'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {isLoadingHistory ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                        <span className="loading loading-dots loading-md text-blue-400"></span>
                    </div>
                ) : !activeCategory ? (
                    /* CATEGORY GRID VIEW */
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                            <MessageSquarePlus size={32} />
                        </div>
                        <h4 className="text-gray-900 font-bold text-xl mb-2">New Support Topic</h4>
                        <p className="text-gray-400 text-sm mb-10">Select a category to view history or send a new report.</p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            {[
                                { id: 'bug', label: 'Bugs', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { id: 'help', label: 'Help', icon: LifeBuoy, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { id: 'error', label: 'Errors', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                                { id: 'feedback', label: 'Ideas', icon: MessageSquarePlus, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all group"
                                >
                                    <div className={`p-3 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                                        <cat.icon size={22} />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-tighter">{cat.label}</span>
                                </button>
                            ))}

                            {/* ALL HISTORY BUTTON */}
                            <button
                                onClick={() => setActiveCategory('all')}
                                className="col-span-2 flex items-center justify-center gap-3 p-4 bg-slate-100 border border-transparent rounded-2xl hover:bg-slate-200 transition-all mt-2"
                            >
                                <Layout size={18} className="text-slate-600" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">View Master History</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* CHAT VIEW (Filtered) */
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        {filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <MessageSquarePlus size={30} />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest">No {activeCategory} history</p>
                                <p className="text-xs">Your new messages will appear here.</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg, index, arr) => (
                                <div key={msg.id}>
                                    {(index === 0 || arr[index - 1].date !== msg.date) && (
                                        <div className="flex justify-center my-8">
                                            <span className="text-[9px] font-black text-gray-400 bg-white border border-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                                {msg.date}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <div className="flex flex-col gap-2 max-w-[85%] items-end">
                                            <div className="px-5 py-4 rounded-3xl text-sm shadow-md bg-white border border-gray-100 text-gray-800 rounded-tr-none">
                                                {/* Category Badge shown in 'All' view */}
                                                {activeCategory === 'all' && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{msg.category}</span>
                                                    </div>
                                                )}
                                                {msg.image && (
                                                    <img src={msg.image} className="rounded-2xl mb-3 max-w-full border border-gray-100 shadow-sm" alt="attachment" />
                                                )}
                                                <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2">
                                                <Clock size={10} className="text-gray-300" />
                                                <span className="text-[10px] text-gray-400 font-bold">{msg.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Input Footer */}
            <div className={`p-5 bg-white border-t border-gray-100 transition-all duration-300 ${!activeCategory ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                {selectedImage && (
                    <div className="relative inline-block mb-4 p-1.5 bg-white rounded-2xl border-2 border-blue-500 shadow-xl">
                        <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl" />
                        <button onClick={() => { setSelectedImage(null); setBase64Image(null); }} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                        <ImageIcon size={24} />
                    </button>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />

                    <div className="flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={activeCategory ? `Describe the ${activeCategory}...` : "Select a topic..."}
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSending || (!inputValue.trim() && !base64Image) || !activeCategory}
                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg active:scale-95 min-w-[56px] flex items-center justify-center"
                    >
                        {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={22} />}
                    </button>
                </form>
            </div>
        </div>
    );
}