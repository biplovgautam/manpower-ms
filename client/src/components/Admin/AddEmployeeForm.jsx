"use client";
import {
    ArrowLeft, CheckCircle2, Circle,
    Eye, EyeOff, Loader2, Lock,
    Mail, MapPin, Phone, User, UserPlus
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

export function AddEmployeeForm({ onBack, onSuccess }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        contactNumber: '',
        address: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordChecks = useMemo(() => ({
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[@$!%*?&]/.test(formData.password),
    }), [formData.password]);

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.contactNumber || !formData.address || !isPasswordValid) {
            toast.error("Please fill all required fields correctly.");
            return;
        }

        const tid = toast.loading("Registering staff...");
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/register-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Staff registered successfully!", { id: tid });
                setTimeout(() => onSuccess(), 1200);
            } else {
                toast.error(data.msg || "Registration failed", { id: tid });
            }
        } catch (err) {
            toast.error("Connection error.", { id: tid });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <Toaster position="top-center" />

            <div className="max-w-3xl mx-auto">
                {/* Clean Back Button - Always Visible */}
                <button
                    onClick={onBack}
                    className="flex items-center text-slate-600 hover:text-blue-600 font-semibold mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Staff Directory
                </button>

                <Card className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                    {/* Header - Light background, Dark text for perfect contrast */}
                    <CardHeader className="border-b border-slate-100 bg-white p-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <UserPlus size={28} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-900">Add New Staff</CardTitle>
                                <p className="text-slate-500 text-sm">Create a new account and send credentials via SMS.</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        required
                                        placeholder="e.g. Rajesh Hamal"
                                        className="pl-10 h-12 border-slate-300 focus:border-blue-500 text-slate-900 bg-white"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Number */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Contact Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input
                                            required
                                            placeholder="98XXXXXXXX"
                                            className="pl-10 h-12 border-slate-300 text-slate-900 bg-white"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Email - Optional */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-500 italic">Email Address (Optional)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            className="pl-10 h-12 border-slate-200 border-dashed text-slate-900 bg-slate-50/30"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="space-y-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700">Security Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Set a secure password"
                                        className="pl-10 pr-10 h-12 border-slate-300 text-slate-900 bg-white"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Live Validation Checklist */}
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                        {passwordChecks.length ? <CheckCircle2 size={14} /> : <Circle size={14} />} 8+ Chars
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordChecks.upper ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                        {passwordChecks.upper ? <CheckCircle2 size={14} /> : <Circle size={14} />} 1 Uppercase
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordChecks.number ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                        {passwordChecks.number ? <CheckCircle2 size={14} /> : <Circle size={14} />} 1 Number
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordChecks.special ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                        {passwordChecks.special ? <CheckCircle2 size={14} /> : <Circle size={14} />} 1 Symbol
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Home Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        required
                                        placeholder="Full address details"
                                        className="pl-10 h-12 border-slate-300 text-slate-900 bg-white"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={isLoading || !isPasswordValid}
                                    className={`w-full h-14 rounded-xl font-bold text-lg transition-all ${isPasswordValid && !isLoading
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" /> Saving...
                                        </span>
                                    ) : (
                                        "Register Staff Member"
                                    )}
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-bold">
                                    Secure Registration • Instant SMS Alert
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}