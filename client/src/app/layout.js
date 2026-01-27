// client/src/app/layout.js
"use client"; // We need this to handle the global interceptor
import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import '../app/global.css';

export default function RootLayout({ children }) {
    useEffect(() => {
        // Global Interceptor: If any API call returns 401 (Unauthorized), logout immediately
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.clear();
                    Cookies.remove('token', { path: '/' });
                    window.location.href = '/login'; // Nuclear redirect
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}