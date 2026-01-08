"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { RegisterPage } from '../../../components/RegisterPage';

const API_URL = 'http://localhost:5000/api/auth/register';

export default function Register() {
  const router = useRouter();

  const handleRegister = async (username, email, password, role, companyName, contactNumber, address) => {
    try {
      const response = await axios.post(API_URL, {
        fullName: username,
        email,
        password,
        role,
        companyName,
        contactNumber,
        address,
      });

      router.push('/login?registered=true');
    } catch (error) {
      const errorMessage = error.response?.data?.msg || 'Registration failed.';
      throw new Error(errorMessage);
    }
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return <RegisterPage onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />;
}