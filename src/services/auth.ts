import axios from 'axios';
import { User } from '../types';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultHost = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api';
const API_BASE_URL = isLocal ? 'http://localhost:5001/api' : (import.meta.env.VITE_API_BASE_URL || defaultHost);

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('hospital_token', token);

    return {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  } catch (error: any) {
    console.error('API Error logging in:', error);
    const errorMsg = error.response?.data?.message || 'Authentication failed.';
    throw new Error(errorMsg);
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('hospital_token', token);

    return {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  } catch (error: any) {
    console.error('API Error registering user:', error);
    const errorMsg = error.response?.data?.message || 'Registration failed.';
    throw new Error(errorMsg);
  }
};

export const forgotUserPassword = async (email: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/forgotpassword`, { email });
    return response.data;
  } catch (error: any) {
    console.error('API Error dispatching recovery mail:', error);
    throw new Error(error.response?.data?.message || 'Failed to dispatch recovery link.');
  }
};

export const resetUserPassword = async (token: string, password: string): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/auth/resetpassword/${token}`, { password });
    return response.data;
  } catch (error: any) {
    console.error('API Error resetting password:', error);
    throw new Error(error.response?.data?.message || 'Failed to reset password.');
  }
};