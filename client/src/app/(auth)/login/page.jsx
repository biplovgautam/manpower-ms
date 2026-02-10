"use client";
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoginPage } from '../../../components/LoginPage';
import { apiUrl } from '@/lib/api';

const API_URL = apiUrl('/api/auth/login');

export default function Login() {
    const router = useRouter();

    useEffect(() => {
        router.prefetch('/dashboard/tenant-admin');
        router.prefetch('/dashboard/employee');
    }, [router]);

    const handleLogin = async (identifier, password, selectedRole) => {
        try {
            const response = await axios.post(API_URL, { identifier, password });
            const { token, user } = response.data;

            // --- RESTRICTION CHECK ---
            if (user.isBlocked) {
                toast.error("Access Denied: Your account is restricted.");
                throw new Error("Your account has been restricted. Please contact your administrator.");
            }

            const actualRole = user.role === 'super_admin' ? 'admin' : user.role;

            if (actualRole !== selectedRole) {
                const roleDisplay = selectedRole === 'admin' ? 'Administrator' : 'Employee';
                throw new Error(`Access Denied: Not authorized for the ${roleDisplay} portal.`);
            }

            // --- STORAGE SYNC ---
            localStorage.setItem('token', token);
            localStorage.setItem('userId', user._id);
            localStorage.setItem('role', actualRole);
            localStorage.setItem('fullName', user.fullName);
            localStorage.setItem('user', JSON.stringify(user));

            Cookies.set('token', token, { expires: 7, path: '/' });
            Cookies.set('role', actualRole, { expires: 7, path: '/' });

            const targetPath = actualRole === 'admin' ? '/dashboard/tenant-admin' : '/dashboard/employee';

            console.log('✅ LOGIN SUCCESS: Navigating to', targetPath);
            router.push(targetPath);

            return response.data;
        } catch (error) {
            console.error('❌ LOGIN ATTEMPT FAILED:', error.message);
            throw error;
        }
    };

    return <LoginPage onLogin={handleLogin} />;
}