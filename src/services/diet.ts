import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('hospital_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const fetchDietPlan = async (patientId?: string) => {
  try {
    const url = patientId 
      ? `${API_BASE_URL}/diet/plan/${patientId}`
      : `${API_BASE_URL}/diet/plan/me`; // Fallback for patient self-query
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error('Error fetching diet plan:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch diet plan.');
  }
};

export const saveDietPlan = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/diet/plan`, data, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error('Error saving diet plan:', error);
    throw new Error(error.response?.data?.message || 'Failed to save diet plan.');
  }
};

export const saveComplianceLog = async (date: string, meal: string, status: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/diet/compliance`,
      { date, meal, status },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Error saving compliance log:', error);
    throw new Error(error.response?.data?.message || 'Failed to save compliance log.');
  }
};

export const fetchComplianceLogs = async (patientId: string, startDate?: string, endDate?: string) => {
  try {
    let url = `${API_BASE_URL}/diet/compliance/${patientId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error('Error fetching compliance logs:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch compliance logs.');
  }
};
