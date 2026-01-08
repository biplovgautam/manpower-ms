"use client";
import { 
  AlertCircle, ArrowRight, Home, Key, Loader2, 
  Lock, Mail, User, UserPlus, Phone, MapPin 
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const RegisterInput = React.memo(({
    type,
    placeholder,
    value,
    onChange,
    label,
    Icon,
    disabled,
    className = '',
    autoFocus = false,
    clearError
}) => {
    const IconComponent = Icon;
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{label}</label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    {Icon && <IconComponent className="h-4 w-4 text-gray-400" />}
                </div>
                <Input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => {
                        onChange(e);
                        clearError();
                    }}
                    autoComplete={type === 'email' ? 'email' : (type === 'password' ? 'new-password' : 'name')}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className={`pl-10 pr-4 h-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${className}`}
                />
            </div>
        </div>
    );
});
RegisterInput.displayName = 'RegisterInput';

export function RegisterPage({ onRegister, onSwitchToLogin }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        address: '',
        companyName: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = useCallback((e, field) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

    const clearError = useCallback(() => {
        if (error) setError('');
    }, [error]);

    const validateRegistration = () => {
        const { fullName, email, contactNumber, address, companyName, password, confirmPassword } = formData;
        if (!fullName || fullName.trim().length < 3) return 'Full Name must be at least 3 characters';
        if (!email || !email.includes('@')) return 'Please enter a valid email format';
        if (!contactNumber || contactNumber.trim().length < 5) return 'Please enter a valid contact number';
        if (!address || address.trim().length < 5) return 'Please enter a detailed address';
        if (!companyName) return 'Please enter your Company Name';
        if (!password || password.length < 6) return 'Password must be at least 6 characters';
        if (password !== confirmPassword) return 'Passwords do not match';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateRegistration();
        
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // MATCHING THE PARENT ARGUMENTS EXACTLY:
            // (username, email, password, role, companyName, contactNumber, address)
            await onRegister(
                formData.fullName, 
                formData.email, 
                formData.password, 
                'admin', 
                formData.companyName, 
                formData.contactNumber, 
                formData.address
            );
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4 py-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-lg relative z-10 bg-white/95 backdrop-blur-2xl shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                        <UserPlus className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Admin Registration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-2 font-medium">
                        <Lock className="h-4 w-4 text-indigo-500" />
                        Create Your Company's Master Account
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 text-red-700">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm font-semibold">{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RegisterInput
                                type="text"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={e => handleChange(e, 'fullName')}
                                label="Full Name"
                                Icon={User}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                            <RegisterInput
                                type="email"
                                placeholder="admin@company.com"
                                value={formData.email}
                                onChange={e => handleChange(e, 'email')}
                                label="Work Email"
                                Icon={Mail}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RegisterInput
                                type="tel"
                                placeholder="+1 234..."
                                value={formData.contactNumber}
                                onChange={e => handleChange(e, 'contactNumber')}
                                label="Contact Number"
                                Icon={Phone}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                            <RegisterInput
                                type="text"
                                placeholder="Company Name"
                                value={formData.companyName}
                                onChange={e => handleChange(e, 'companyName')}
                                label="Company Name"
                                Icon={Home}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                        </div>

                        <RegisterInput
                            type="text"
                            placeholder="Full Office Address"
                            value={formData.address}
                            onChange={e => handleChange(e, 'address')}
                            label="Office Address"
                            Icon={MapPin}
                            disabled={isLoading}
                            clearError={clearError}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RegisterInput
                                type="password"
                                placeholder="Min. 6 chars"
                                value={formData.password}
                                onChange={e => handleChange(e, 'password')}
                                label="Password"
                                Icon={Lock}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                            <RegisterInput
                                type="password"
                                placeholder="Confirm"
                                value={formData.confirmPassword}
                                onChange={e => handleChange(e, 'confirmPassword')}
                                label="Confirm Password"
                                Icon={Key}
                                disabled={isLoading}
                                clearError={clearError}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-4 flex items-center justify-center gap-2 text-base font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg transition-all rounded-lg active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                            ) : (
                                <><UserPlus className="h-5 w-5" /> Register Company Admin</>
                            )}
                        </Button>
                    </form>

                    <div className="text-center pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-full transition-all duration-200"
                        >
                            Already have an account? Sign In <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}