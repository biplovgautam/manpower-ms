"use client";
import {
    ArrowRight, Building2, CheckCircle2, Circle,
    Eye, EyeOff, Home, Key, Loader2, Lock,
    Mail, MapPin, Phone,
    Trash2,
    Upload, User, XCircle
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

/**
 * Enhanced Input Component
 */
const RegisterInput = React.memo(({
    type, placeholder, value, onChange, label, Icon, disabled,
    isPassword = false, prefix, className = "", required = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const IconComponent = Icon;
    const paddingClass = prefix ? "pl-28" : "pl-12";

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                {label} {required && <span className="text-red-500 font-black">*</span>}
            </label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    {Icon && <IconComponent className="h-5 w-5" />}
                </div>

                {prefix && (
                    <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 border-r pr-2 py-1 border-slate-200">
                        <span className="text-sm font-bold text-slate-600">{prefix}</span>
                    </div>
                )}

                <Input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`${paddingClass} pr-12 h-13 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all w-full ${className}`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
        </div>
    );
});

RegisterInput.displayName = 'RegisterInput';

export function RegisterPage({ onRegister, onSwitchToLogin }) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null); // Actual file for FormData
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        address: '',
        companyName: '',
        password: '',
        confirmPassword: ''
    });

    const validation = useMemo(() => {
        const passwordChecks = {
            length: formData.password.length >= 8,
            upper: /[A-Z]/.test(formData.password),
            number: /\d/.test(formData.password),
            special: /[@$!%*?&]/.test(formData.password),
            match: formData.password !== '' && formData.password === formData.confirmPassword
        };

        const requiredFieldsFilled =
            formData.fullName.trim() !== '' &&
            formData.contactNumber.trim() !== '' &&
            formData.address.trim() !== '' &&
            formData.companyName.trim() !== '' &&
            logoFile !== null; // LOGO IS NOW REQUIRED

        return {
            checks: passwordChecks,
            isPasswordValid: Object.values(passwordChecks).every(Boolean),
            isValid: Object.values(passwordChecks).every(Boolean) && requiredFieldsFilled
        };
    }, [formData, logoFile]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Guard: 2MB limit check
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File is too large. Max size is 2MB.");
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = (e) => {
        e.stopPropagation();
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!logoFile) return toast.error("Please upload an Agency Logo");

        const tid = toast.loading("Creating your agency account...");
        setIsLoading(true);

        try {
            // Using FormData to send the file + text
            const submissionData = new FormData();
            submissionData.append('agencyName', formData.companyName);
            submissionData.append('fullAddress', formData.address);
            submissionData.append('fullName', formData.fullName);
            submissionData.append('email', formData.email); // Can be empty
            submissionData.append('contactNumber', `+977${formData.contactNumber}`);
            submissionData.append('password', formData.password);
            submissionData.append('logo', logoFile);

            await onRegister(submissionData);
            toast.success("Agency registered successfully!", { id: tid });
        } catch (err) {
            toast.error(err.message || "Registration failed", { id: tid });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-16">
            <Toaster position="top-center" />

            <Card className="w-full max-w-2xl bg-white shadow-2xl shadow-slate-200 border-slate-200 rounded-[2.5rem] overflow-hidden relative">
                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900">Agency Registration</CardTitle>
                    <p className="text-slate-500 font-medium">Join Nepal&apos;s digital recruitment ecosystem</p>
                </CardHeader>

                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* COMPANY PROFILE SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 tracking-widest uppercase">Company Profile</h3>
                            <div
                                className={`flex flex-col items-center justify-center gap-4 p-8 bg-slate-50 border-2 border-dashed rounded-3xl transition-all cursor-pointer group relative ${logoPreview ? 'border-emerald-400' : 'border-slate-200 hover:border-indigo-400'}`}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {logoPreview ? (
                                    <div className="relative w-24 h-24 group">
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                                        <button
                                            onClick={removeLogo}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="h-6 w-6 text-slate-400" />
                                    </div>
                                )}
                                <p className="text-sm font-bold text-slate-600">
                                    {logoPreview ? "Logo Selected" : "Upload Agency Logo (Required)"}
                                </p>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <RegisterInput
                                    required
                                    label="Agency Name"
                                    placeholder="ABC Manpower"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    Icon={Home}
                                />
                                <RegisterInput
                                    required
                                    label="Full Address"
                                    placeholder="Kathmandu, Nepal"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    Icon={MapPin}
                                />
                            </div>
                        </div>

                        {/* ADMIN & SECURITY SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 tracking-widest uppercase">Admin & Security</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <RegisterInput
                                    required
                                    label="Full Name"
                                    placeholder="Rajesh Hamal"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    Icon={User}
                                />
                                <RegisterInput
                                    required
                                    label="Contact"
                                    prefix="+977"
                                    placeholder="98XXXXXXXX"
                                    value={formData.contactNumber}
                                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                    Icon={Phone}
                                />
                            </div>

                            {/* Email Field - No Required Star */}
                            <RegisterInput
                                label="Email Address (Optional)"
                                type="email"
                                placeholder="admin@agency.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                Icon={Mail}
                            />

                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RegisterInput
                                        required
                                        isPassword
                                        label="Password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        Icon={Lock}
                                    />
                                    <RegisterInput
                                        required
                                        isPassword
                                        label="Confirm Password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        Icon={Key}
                                    />
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <PasswordCheck label="8+ Chars" met={validation.checks.length} />
                                        <PasswordCheck label="Uppercase" met={validation.checks.upper} />
                                        <PasswordCheck label="Number" met={validation.checks.number} />
                                        <PasswordCheck label="Symbol" met={validation.checks.special} />
                                    </div>

                                    <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${formData.confirmPassword ? (validation.checks.match ? 'text-emerald-600' : 'text-red-500') : 'text-slate-400'}`}>
                                        {formData.confirmPassword && (validation.checks.match ? <CheckCircle2 size={14} /> : <XCircle size={14} />)}
                                        {formData.confirmPassword ? (validation.checks.match ? "Passwords Match" : "Passwords do not match") : "Please confirm password"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !validation.isValid}
                            className={`w-full h-14 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${validation.isValid && !isLoading
                                ? "bg-slate-900 hover:bg-indigo-600 text-white shadow-indigo-200"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>Register Company <ArrowRight className="h-5 w-5" /></>
                            )}
                        </Button>

                        <p className="text-center text-sm text-slate-500 font-bold">
                            Already registered?{" "}
                            <button type="button" onClick={onSwitchToLogin} className="text-indigo-600 hover:underline">
                                Sign In
                            </button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function PasswordCheck({ label, met }) {
    return (
        <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${met ? 'text-emerald-600 font-black' : 'text-slate-400 font-bold'}`}>
            {met ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            {label}
        </div>
    );
}