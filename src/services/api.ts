import axios from 'axios';
import { AppointmentData, ContactData } from '../types';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultHost = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api';
export const API_BASE_URL = isLocal ? 'http://localhost:5001/api' : (import.meta.env.VITE_API_BASE_URL || defaultHost);

export const submitAppointment = async (data: AppointmentData): Promise<any> => {
  try {
    const token = localStorage.getItem('hospital_token');
    const response = await axios.post(`${API_BASE_URL}/appointments`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error submitting appointment:', error);
    throw error;
  }
};

export const submitContactMessage = async (data: ContactData): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/contact`, data);
    return response.data;
  } catch (error) {
    console.error('API Error submitting contact message:', error);
    throw error;
  }
};