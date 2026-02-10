// client/src/app/login/page.js
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
        // Pre-warm the dashboard routes for faster navigation
        router.prefetch('/dashboard/tenant-admin');
        router.prefetch('/dashboard/employee');
    }, [router]);

    const handleLogin = async (identifier, password, selectedRole) => {
        try {
            // 1. Backend Request
            const response = await axios.post(API_URL, { identifier, password });
            const { token, user } = response.data;

            // 2. Block Check (Handled by backend usually, but good for local safety)
            if (user.isBlocked) {
                throw new Error("Account Restricted: Please contact your administrator.");
            }

            // 3. Role Normalization
            // Your backend sends 'super_admin' or 'admin'. 
            // We map both to 'admin' to match the 'selectedRole' from the UI toggle.
            const actualRole = (user.role === 'super_admin' || user.role === 'admin') ? 'admin' : 'employee';

            // 4. Portal Authorization Check
            if (actualRole !== selectedRole) {
                const requiredPortal = selectedRole === 'admin' ? 'Administrator' : 'Employee';
                // We throw a specific error message for the LoginPage toast
                throw new Error(`Access Denied: Use the ${requiredPortal} toggle to sign in.`);
            }

            // 5. Storage Sync (Cookies + LocalStorage)
            // Path: '/' is vital so the cookie is available across the whole site
            Cookies.set('token', token, { expires: 7, path: '/' });
            Cookies.set('role', actualRole, { expires: 7, path: '/' });
            
            localStorage.setItem('token', token);
            localStorage.setItem('role', actualRole);
            localStorage.setItem('user', JSON.stringify(user));

            // 6. Navigation
            const targetPath = actualRole === 'admin' ? '/dashboard/tenant-admin' : '/dashboard/employee';
            
            console.log('✅ LOGIN SUCCESS: Navigating to', targetPath);
            
            // We use router.push here. 
            // NOTE: If the layout interceptor is fixed, this won't refresh the page on error anymore.
            router.push(targetPath);

            return response.data;

        } catch (error) {
            // Extract the message from backend or the thrown Errors above
            const errorMessage = error.response?.data?.msg || error.message || "Login failed";
            
            console.error('❌ LOGIN ATTEMPT FAILED:', errorMessage);
            
            // CRITICAL: We throw this error back so LoginPage.jsx 
            // catches it in its 'try-catch' and stops the loading state.
            throw new Error(errorMessage);
        }
    };

    return <LoginPage onLogin={handleLogin} />;
}