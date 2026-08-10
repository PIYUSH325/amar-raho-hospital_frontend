export interface AppointmentData {
  name: string;
  email: string;
  mobile: string;
  doctor: string;
  doctorRef?: string;
  date: string;
  time: string;
  problem: string;
}

export interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt?: string;
}

export interface AIAnalysis {
  condition: string;
  alerts: string;
  remedies: string;
}

export interface PatientReport {
  _id: string;
  title: string;
  filePath: string;
  extractedText: string;
  aiAnalysis?: AIAnalysis;
  uploadedAt: string;
}

export interface PatientProfile {
  _id: string;
  user: User;
  mobile: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  address: string;
  reports?: PatientReport[];
}

export interface DoctorProfile {
  _id: string;
  user: User;
  specialization: string;
  experience: number;
  fees: number;
  bio: string;
  availability: string[];
  isVerified: boolean;
  department: string;
}

export interface Appointment {
  _id: string;
  user: string;
  doctorRef?: string;
  name: string;
  email: string;
  mobile: string;
  doctor: string;
  date: string;
  time: string;
  problem: string;
  status: 'Scheduled' | 'Approved' | 'Completed' | 'Cancelled';
}

export interface MedicalRecord {
  _id: string;
  patient: User | string;
  doctor: User | string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  visitDate: string;
}

export interface Prescription {
  _id: string;
  patient: User | string;
  doctor: User | string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
}