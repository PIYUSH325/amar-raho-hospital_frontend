import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/posts`, {
      email,
      password,
    });
    
    if (password.length < 4) {
      throw new Error('Invalid credentials. Password too short.');
    }

    return {
      id: `usr_${response.data.id || Math.floor(Math.random() * 1000)}`,
      name: email.split('@')[0].toUpperCase(),
      email: email,
    };
  } catch (error: any) {
    console.error('API Error logging in:', error);
    throw new Error(error.message || 'Authentication failed. Please verify your credentials.');
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/posts`, {
      name,
      email,
      password,
    });

    return {
      id: `usr_${response.data.id || Math.floor(Math.random() * 1000)}`,
      name: name,
      email: email,
    };
  } catch (error: any) {
    console.error('API Error registering user:', error);
    throw new Error(error.message || 'Registration failed. Please check input parameters.');
  }
};

export const forgotUserPassword = async (email: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/posts`, {
      email,
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error dispatching recovery mail:', error);
    throw new Error(error.message || 'Failed to dispatch recovery link.');
  }
};
