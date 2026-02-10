"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { RegisterPage } from '../../../components/RegisterPage';
import { apiUrl } from '@/lib/api';

// Update this URL if your backend is deployed elsewhere
const API_URL = apiUrl('/api/auth/register');

export default function Register() {
  const router = useRouter();

  /**
   * handleRegister now receives a FormData object from RegisterPage.jsx
   * This object contains: agencyName, fullAddress, fullName, email, contactNumber, password, and logo.
   */
  const handleRegister = async (formData) => {
    try {
      // Axios detects FormData and automatically sets 'multipart/form-data'
      const response = await axios.post(API_URL, formData);

      // If registration is successful, redirect to login
      if (response.data.success) {
        router.push('/login?registered=true');
      }
    } catch (error) {
      // 1. Check if the error is from the backend (error.response)
      // 2. Check for the 'msg' field we defined in our controller/middleware
      // 3. Fallback to a generic message
      const errorMessage = error.response?.data?.msg || 'Registration failed. Please try again.';
      
      // Throwing the error allows the 'toast.error' in RegisterPage.jsx to catch it
      throw new Error(errorMessage);
    }
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <RegisterPage
      onRegister={handleRegister}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
}