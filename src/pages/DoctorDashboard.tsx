import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Appointment, DoctorProfile, PatientProfile, MedicalRecord, Prescription, DietPlanTask } from '../types';
import DietPlanBuilder from '../components/DietPlanBuilder';
import WeeklyDietPlanner from '../components/WeeklyDietPlanner';
import { fetchDietPlan, fetchComplianceLogs } from '../services/diet';
import { LiveChatBox } from '../components/LiveChatBox';
import { useLocation } from 'react-router-dom';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface PatientListItem {
  _id: string;
  name: string;
  email: string;
  metadata: PatientProfile;
}

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
 
  const [activeTab, setActiveTab] = useState<'today' | 'appointments' | 'history' | 'profile' | 'nutrition' | 'fitness' | 'general' | 'chats'>('today');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'chats') {
      setActiveTab('chats');
    }
  }, [location.search]);
  
  
  // Lists
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  const [selectedPatientHistory, setSelectedPatientHistory] = useState<PatientListItem | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [loadingHistoryDetails, setLoadingHistoryDetails] = useState(false);
  
  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [isPresenceActive, setIsPresenceActive] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [patientTodoChecklist, setPatientTodoChecklist] = useState<DietPlanTask[]>([]);
  const [selectedPlanPatientId, setSelectedPlanPatientId] = useState<string>('');

  // Weekly Nutrition states
  const [showWeeklyPlanner, setShowWeeklyPlanner] = useState(false);
  const [weeklyPlanData, setWeeklyPlanData] = useState<any>(null);
  const [complianceLogs, setComplianceLogs] = useState<any[]>([]);
  const [loadingWeeklyData, setLoadingWeeklyData] = useState(false);

  const loadWeeklyData = async () => {
    if (!selectedPlanPatientId) return;
    setLoadingWeeklyData(true);
    try {
      const planRes = await fetchDietPlan(selectedPlanPatientId);
      if (planRes.success) {
        setWeeklyPlanData(planRes.data);
      }
      
      // Get current week dates (Monday to Sunday)
      const today = new Date();
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() + distanceToMonday);
      
      const datesOfWeek: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        datesOfWeek.push(d.toISOString().split('T')[0]);
      }
      
      const logsRes = await fetchComplianceLogs(selectedPlanPatientId, datesOfWeek[0], datesOfWeek[6]);
      if (logsRes.success) {
        setComplianceLogs(logsRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load weekly nutrition data:", err.message);
    } finally {
      setLoadingWeeklyData(false);
    }
  };

  useEffect(() => {
    if (selectedPlanPatientId && activeTab === 'nutrition') {
      loadWeeklyData();
    } else {
      setWeeklyPlanData(null);
      setComplianceLogs([]);
    }
  }, [selectedPlanPatientId, activeTab]);

  // Active checkup modal state
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [selectedReportForAI, setSelectedReportForAI] = useState<any | null>(null);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copilotTab, setCopilotTab] = useState<'summary' | 'chat'>('summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'doctor' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hi, I am your EMR Copilot. Ask me anything about this report!' }
  ]);
  const [sendingChat, setSendingChat] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');
  
  // Checkup form states
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  
  // Patient Profile form states (doctor verifies/updates clinical file on visit)
  const [patientMobile, setPatientMobile] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientBloodGroup, setPatientBloodGroup] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientEmergency, setPatientEmergency] = useState('');

  // Prescription builder state
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string }>>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [liveChatPartnerId, setLiveChatPartnerId] = useState(''); // Selected Patient ID for live chat



  // Doctor profile settings state
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    experience: '',
    fees: '',
    bio: '',
    department: '',
    availability: [] as string[]
  });


  const triggerToast = (type: 'success' | 'danger', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load Doctor profile
      try {
        const docRes = await axios.get(`${API_BASE_URL}/doctors/me`, { headers });
        setDoctorProfile(docRes.data.data);
        const profile = docRes.data.data;
        setIsPresenceActive(profile.isPresenceActive !== false);
        setProfileForm({
          specialization: profile.specialization || '',
          experience: String(profile.experience || ''),
          fees: String(profile.fees || ''),
          bio: profile.bio || '',
          department: profile.department || 'General',
          availability: profile.availability || []
        });
      } catch (err) {
        console.error('Failed to load doctor profile details');
      }

      // Load appointments
      try {
        const appRes = await axios.get(`${API_BASE_URL}/appointments/my`, { headers });
        setAppointments(appRes.data.data);
      } catch (err) {
        console.error('Failed to load appointments list');
      }

      // Load patients
      try {
        const patRes = await axios.get(`${API_BASE_URL}/admin/patients`, { headers });
        setPatients(patRes.data.data);
      } catch (err) {
        console.error('Failed to load patient index');
      }

      // Load notifications
      try {
        const notRes = await axios.get(`${API_BASE_URL}/doctors/notifications`, { headers });
        setNotifications(notRes.data.data || []);
      } catch (err) {
        console.error('Failed to load notifications');
      }

    } catch (error) {
      console.error('Failed to load portal databases');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePresence = async (checked: boolean) => {
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(
        `${API_BASE_URL}/doctors/presence`,
        { isPresenceActive: checked },
        { headers }
      );
      if (res.data.success) {
        setIsPresenceActive(checked);
        triggerToast('success', `Presence status updated to ${checked ? 'Active' : 'Away'}`);
      }
    } catch (err: any) {
      console.error('Failed to toggle presence status:', err.message);
      triggerToast('danger', 'Failed to toggle presence status.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch full clinical history details for a single selected patient
  const selectPatientHistory = async (pat: PatientListItem) => {
    setSelectedPatientHistory(pat);
    setLoadingHistoryDetails(true);
    setEditingPrescriptionId(null);
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Records
      const recRes = await axios.get(`${API_BASE_URL}/medical-records?patientId=${pat._id}`, { headers });
      setPatientRecords(recRes.data.data);

      // Fetch Prescriptions
      const presRes = await axios.get(`${API_BASE_URL}/prescriptions?patientId=${pat._id}`, { headers });
      setPatientPrescriptions(presRes.data.data);
    } catch (err) {
      console.error("Failed to load patient history files");
    } finally {
      setLoadingHistoryDetails(false);
    }
  };

  // Load prescription details into form fields for editing
  const startEditingPrescription = (pres: Prescription) => {
    setEditingPrescriptionId(pres._id);
    setMedicines(pres.medicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration
    })));
    setInstructions(pres.instructions || '');
  };

  const startNewPrescription = () => {
    setEditingPrescriptionId('new');
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setInstructions('');
  };

  // Save modified prescription medicines list (handles both updates and retrospective creation)
  const handleSavePrescriptionEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMedicines = medicines.filter(m => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      triggerToast('danger', 'At least one medicine is required.');
      return;
    }

    try {
      const token = localStorage.getItem('hospital_token');
      if (editingPrescriptionId === 'new') {
        await axios.post(`${API_BASE_URL}/prescriptions`, {
          patientId: selectedPatientHistory?._id,
          medicines: validMedicines,
          instructions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('success', 'Prescription created successfully!');
      } else {
        await axios.put(`${API_BASE_URL}/prescriptions/${editingPrescriptionId}`, {
          medicines: validMedicines,
          instructions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('success', 'Prescription updated successfully!');
      }
      setEditingPrescriptionId(null);
      
      // Reload details for current patient
      if (selectedPatientHistory) {
        selectPatientHistory(selectedPatientHistory);
      }
    } catch (error: any) {
      triggerToast('danger', error.response?.data?.message || 'Failed to save prescription');
    }
  };

  // Update appointment status (Approve, Complete, Cancel)
  const updateStatus = async (appId: string, status: string) => {
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.put(`${API_BASE_URL}/admin/appointments/${appId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(appointments.map(app => app._id === appId ? { ...app, status: status as any } : app));
      triggerToast('success', `Appointment status changed to '${status}'.`);
    } catch (error: any) {
      triggerToast('danger', error.response?.data?.message || 'Failed to update booking status.');
    }
  };

  // Launch checkup workflow for patient
  const startCheckup = (app: Appointment) => {
    setSelectedApp(app);
    setDiagnosis('');
    setTreatmentPlan('');
    setNotes('');
    setInstructions('');
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    
    // Find matching patient profile to pre-fill demographics
    const matchingPat = patients.find(p => p._id === app.user);
    if (matchingPat) {
      setPatientMobile(matchingPat.metadata?.mobile || app.mobile || '');
      setPatientAge(matchingPat.metadata?.age ? String(matchingPat.metadata.age) : '');
      setPatientGender(matchingPat.metadata?.gender || '');
      setPatientBloodGroup(matchingPat.metadata?.bloodGroup || '');
      setPatientAddress(matchingPat.metadata?.address || '');
      setPatientEmergency(matchingPat.metadata?.emergencyContact || '');
      setPatientTodoChecklist(matchingPat.metadata?.dietPlan || []);
    } else {
      setPatientMobile(app.mobile || '');
      setPatientAge('');
      setPatientGender('');
      setPatientBloodGroup('');
      setPatientAddress('');
      setPatientEmergency('');
      setPatientTodoChecklist([]);
    }
  };

  // Save consultation checkup (medical record + patient demographics + prescription)
  const submitCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (!diagnosis || !treatmentPlan) {
      triggerToast('danger', 'Please enter diagnosis and treatment plan details.');
      return;
    }

    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Update Patient clinical profile demographics (verifying patient profile)
      await axios.put(`${API_BASE_URL}/admin/patients/${selectedApp.user}`, {
        mobile: patientMobile,
        age: patientAge ? Number(patientAge) : undefined,
        gender: patientGender,
        bloodGroup: patientBloodGroup,
        address: patientAddress,
        emergencyContact: patientEmergency,
        dietPlan: patientTodoChecklist
      }, { headers });

      // 2. Save Medical consultation record
      await axios.post(`${API_BASE_URL}/medical-records`, {
        patientId: selectedApp.user,
        diagnosis,
        treatmentPlan,
        notes
      }, { headers });

      // 3. Save Prescription if medicines were entered
      const validMedicines = medicines.filter(m => m.name.trim() !== '');
      if (validMedicines.length > 0) {
        await axios.post(`${API_BASE_URL}/prescriptions`, {
          patientId: selectedApp.user,
          medicines: validMedicines,
          instructions
        }, { headers });
      }

      // 4. Set Appointment status as Completed
      await axios.put(`${API_BASE_URL}/admin/appointments/${selectedApp._id}/status`, {
        status: 'Completed'
      }, { headers });

      setAppointments(appointments.map(app => app._id === selectedApp._id ? { ...app, status: 'Completed' } : app));
      triggerToast('success', 'Consultation saved and appointment marked as completed!');
      setSelectedApp(null);
      loadData(); // reload patients profiles cache
    } catch (error: any) {
      triggerToast('danger', error.response?.data?.message || 'Failed saving checkup consultation records.');
    }
  };

  // Prescription builder helpers
  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedChange = (index: number, field: string, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Save Nutrition/Fitness plan directly from the sidebar tabs
  const handleSaveIndependentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanPatientId) return;
    setSavingPlan(true);
    setPlanSuccessMsg('');
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.put(`${API_BASE_URL}/admin/patients/${selectedPlanPatientId}`, {
        dietPlan: patientTodoChecklist
      }, { headers });
      
      // Update patients state locally so it has the updated checklist
      setPatients(patients.map(p => p._id === selectedPlanPatientId ? {
        ...p,
        metadata: res.data.data
      } : p));
      
      setPlanSuccessMsg('Plan updated and secured successfully!');
      triggerToast('success', 'Patient checklist saved and secured successfully.');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to save patient plan';
      setPlanSuccessMsg(`Error: ${msg}`);
      triggerToast('danger', msg);
    } finally {
      setSavingPlan(false);
    }
  };

  // Save Doctor profile settings
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.post(`${API_BASE_URL}/doctors/profile`, {
        specialization: profileForm.specialization,
        experience: Number(profileForm.experience),
        fees: Number(profileForm.fees),
        bio: profileForm.bio,
        department: profileForm.department,
        availability: profileForm.availability
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Your profile settings updated successfully.');
      loadData();
    } catch (error: any) {
      triggerToast('danger', error.response?.data?.message || 'Failed to update profile.');
    }
  };

  const toggleDay = (day: string) => {
    const current = [...profileForm.availability];
    if (current.includes(day)) {
      setProfileForm({ ...profileForm, availability: current.filter(d => d !== day) });
    } else {
      setProfileForm({ ...profileForm, availability: [...current, day] });
    }
  };

  // Filtering Today's Scheduled appointments
  const todayAppointments = appointments.filter(app => {
    return app.status === 'Scheduled' || app.status === 'Approved';
  });

  // Filter patients list to only show patients who have booked appointments with this doctor
  const myPatients = patients.filter(pat => 
    appointments.some(app => app.user === pat._id)
  );

  // Prevent form submission when pressing Enter key in input fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  // Helper to scan medical records and highlight key metrics
  const highlightMedicalVitals = (text: string) => {
    if (!text) return <small className="text-muted">No scanned text available.</small>;
    
    const keywords = ['hemoglobin', 'sugar', 'wbc', 'platelet', 'cholesterol', 'vitamin', 'calcium', 'rbc', 'thyroid'];
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const lowerLine = line.toLowerCase();
      const hasKeyword = keywords.some(key => lowerLine.includes(key));
      
      return (
        <div 
          key={index} 
          className={hasKeyword ? "bg-warning text-dark fw-bold px-2 rounded py-1 my-1" : "text-muted small"}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {line}
        </div>
      );
    });
  };

  const handleSendChatMessage = async (e: React.FormEvent, reportText: string) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'doctor', text: userMessage }]);
    setSendingChat(true);

    try {
      const token = localStorage.getItem('hospital_token');
      const response = await axios.post(`${API_BASE_URL}/patients/chat-ai`, {
        message: userMessage,
        reportText: reportText || ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
      }
    } catch (error: any) {
      console.error(error);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error. Please verify the AI connection.' }]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div 
      className="container-fluid py-4 min-vh-100" 
      style={{ 
        paddingRight: isAICopilotOpen ? '420px' : '0px', 
        transition: 'padding-right 0.35s ease',
        background: 'linear-gradient(135deg, #eef2f7 0%, #dbeafe 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Toast Notifier */}
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-4 shadow-lg`} style={{ zIndex: 1050, minWidth: '300px' }}>
          <i className={`fa ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
          {toast.text}
        </div>
      )}

      {/* Main Unified App Canvas Box */}
      <div 
        className="mx-auto w-100 shadow-lg d-flex overflow-hidden flex-grow-1" 
        style={{ 
          maxWidth: '1440px', 
          background: '#ffffff', 
          borderRadius: '24px',
          minHeight: '80vh',
          border: '1px solid rgba(255,255,255,0.7)'
        }}
      >
        {/* ================= LEFT SIDEBAR nav ================= */}
        <div 
          className="d-flex flex-column p-4 justify-content-between text-center position-relative"
          style={{ 
            width: isSidebarCollapsed ? '88px' : '260px', 
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#f8fafc', 
            borderRight: '1px solid #e2e8f0',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          {/* Sidebar Expand/Collapse Toggle Handle */}
          <button 
            type="button" 
            className="btn btn-primary d-flex align-items-center justify-content-center position-absolute shadow"
            style={{ 
              top: '25px', 
              right: '10px', 
              zIndex: 10, 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%',
              padding: 0, 
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 8px rgba(13, 110, 253, 0.3)'
            }}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`fa ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} style={{ fontSize: '10px' }}></i>
          </button>

          <div>
            {/* Doctor Profile Card */}
            <div className="text-center mb-5 mt-2">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white mx-auto mb-3 shadow" 
                style={{ 
                  width: isSidebarCollapsed ? '48px' : '80px', 
                  height: isSidebarCollapsed ? '48px' : '80px', 
                  border: '3px solid #fff',
                  transition: 'all 0.3s ease'
                }}
              >
                <h3 className={`m-0 text-white fw-bold ${isSidebarCollapsed ? 'fs-5' : ''}`}>
                  {user?.name ? user.name.slice(0,2).toUpperCase() : 'DR'}
                </h3>
              </div>
              
              {!isSidebarCollapsed && (
                <div className="animate__animated animate__fadeIn">
                  <h5 className="mb-1 fw-bold text-dark text-truncate text-center w-100">Dr. {user?.name}</h5>
                  <p className="text-muted small mb-0 text-truncate text-center w-100">{doctorProfile?.specialization || 'Neurologist'}</p>
                  <span className="text-muted text-uppercase" style={{ fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold' }}>
                    MBBS, DNB - {doctorProfile?.department || 'Neurology'}
                  </span>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="nav flex-column nav-pills text-start">
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'today' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('today'); setSelectedApp(null); setSelectedPatientHistory(null); }}
              >
                <i className="fa fa-th-large fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Today's Patients</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'appointments' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('appointments'); setSelectedApp(null); setSelectedPatientHistory(null); }}
              >
                <i className="fa fa-calendar-alt fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Manage Bookings</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'history' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('history'); setSelectedApp(null); setSelectedPatientHistory(null); }}
              >
                <i className="fa fa-notes-medical fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Patient History</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'profile' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('profile'); setSelectedApp(null); setSelectedPatientHistory(null); }}
              >
                <i className="fa fa-user-md fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Profile Settings</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'nutrition' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('nutrition'); setSelectedApp(null); setSelectedPatientHistory(null); setSelectedPlanPatientId(''); setPatientTodoChecklist([]); setPlanSuccessMsg(''); }}
              >
                <i className="fa fa-apple-alt fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Nutrition Plans</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'fitness' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('fitness'); setSelectedApp(null); setSelectedPatientHistory(null); setSelectedPlanPatientId(''); setPatientTodoChecklist([]); setPlanSuccessMsg(''); }}
              >
                <i className="fa fa-running fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Fitness Plans</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'general' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('general'); setSelectedApp(null); setSelectedPatientHistory(null); setSelectedPlanPatientId(''); setPatientTodoChecklist([]); setPlanSuccessMsg(''); }}
              >
                <i className="fa fa-clipboard-list fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>General Habits</span>}
              </button>
              <button 
                type="button"
                className={`premium-nav-link border-0 text-start py-3 px-4 d-flex align-items-center ${activeTab === 'chats' ? 'active-link' : 'bg-transparent'}`}
                onClick={() => { setActiveTab('chats'); setLiveChatPartnerId(''); }}
              >
                <i className="fa fa-comments fs-5 me-3"></i> 
                {!isSidebarCollapsed && <span>Patient Chats</span>}
              </button>
            </div>
          </div>

          {/* Log Out button */}
          <div>
            <button 
              type="button"
              className="premium-nav-link border-0 text-start text-danger py-3 px-4 rounded w-100 bg-transparent d-flex align-items-center"
              onClick={logout}
            >
              <i className="fa fa-sign-out-alt fs-5 me-3"></i> 
              {!isSidebarCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>

        {/* ================= MIDDLE MAIN PANEL ================= */}
        <div 
          className="flex-grow-1 p-4 d-flex flex-column"
          style={{ background: '#ffffff', minWidth: 0, overflowY: 'auto' }}
        >
          {/* Internal Top-bar search and notifications */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="position-relative" style={{ width: '400px' }}>
              <i className="fa fa-search position-absolute text-muted" style={{ top: '12px', left: '15px' }}></i>
              <input 
                type="text" 
                className="form-control ps-5 border-0 bg-light rounded-pill" 
                placeholder="Search patient, appointments, records..." 
                style={{ height: '42px', fontSize: '14px' }}
              />
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* Presence Toggle Switch */}
              <div className="d-flex align-items-center gap-2 border px-3 py-1 rounded-pill bg-light shadow-sm me-2">
                <span className="fw-semibold text-secondary small">Presence:</span>
                <div className="form-check form-switch m-0 d-flex align-items-center">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch"
                    checked={isPresenceActive}
                    onChange={(e) => handleTogglePresence(e.target.checked)}
                    id="presenceToggle"
                    style={{ cursor: 'pointer' }}
                  />
                  <label 
                    className="form-check-label fw-bold small ms-2"
                    htmlFor="presenceToggle"
                    style={{ cursor: 'pointer', color: isPresenceActive ? '#198754' : '#dc3545' }}
                  >
                    {isPresenceActive ? 'Active' : 'Away'}
                  </label>
                </div>
              </div>
              <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa fa-envelope text-muted"></i>
              </button>
              <div className="position-relative">
                <button 
                  type="button"
                  className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative" 
                  style={{ width: '40px', height: '40px' }}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <i className="fa fa-bell text-muted"></i>
                  {notifications.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', marginTop: '8px', marginLeft: '-8px' }}>
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div 
                    className="position-absolute end-0 mt-2 bg-white border shadow-lg rounded-4 p-3 animate__animated animate__fadeIn"
                    style={{ zIndex: 1050, width: '320px', maxHeight: '400px', overflowY: 'auto' }}
                  >
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                      <h6 className="fw-bold text-dark m-0 small"><i className="fa fa-bell text-primary me-2"></i>Patient Alerts</h6>
                      <button 
                        type="button" 
                        className="btn btn-link text-muted p-0 small text-decoration-none"
                        style={{ fontSize: '11px' }}
                        onClick={() => setNotifications([])}
                      >
                        Clear All
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-muted small text-center my-3">No patient missed task alerts.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2 text-start">
                        {notifications.map((notif) => (
                          <div key={notif._id} className="p-2 bg-light border-start border-3 border-warning rounded small text-dark">
                            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '10px' }}>
                              <span className="fw-bold text-warning-emphasis">Diet/Fitness Missed</span>
                              <span className="text-muted">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ fontSize: '11px', lineHeight: '1.3' }}>{notif.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="d-flex align-items-center ms-2">
                <span className="small fw-semibold text-dark me-2">Dr. {user?.name}</span>
                <i className="fa fa-chevron-down text-muted small"></i>
              </div>
            </div>
          </div>

          {/* Stats Cards with Sparklines */}
          <div className="row g-3 mb-4">
            {/* Stat Card 1 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="text-start">
                  <span className="text-muted small fw-semibold d-block mb-1">Today's Queue</span>
                  <h3 className="fw-bold m-0 text-dark">
                    {appointments.filter(a => a.status === 'Scheduled' || a.status === 'Approved').length}
                  </h3>
                  <span className="text-success small" style={{ fontSize: '10px' }}><i className="fa fa-arrow-up me-1"></i>Active</span>
                </div>
                {/* SVG sparkline graph */}
                <svg width="100" height="40" className="ms-2">
                  <path d="M 0 30 Q 20 10, 40 25 T 80 5 T 100 20" fill="none" stroke="#10b981" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="text-start">
                  <span className="text-muted small fw-semibold d-block mb-1">Total Bookings</span>
                  <h3 className="fw-bold m-0 text-dark">{appointments.length}</h3>
                  <span className="text-primary small" style={{ fontSize: '10px' }}><i className="fa fa-arrow-up me-1"></i>All Time</span>
                </div>
                <svg width="100" height="40" className="ms-2">
                  <path d="M 0 35 Q 20 15, 40 30 T 80 15 T 100 25" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="text-start">
                  <span className="text-muted small fw-semibold d-block mb-1">Checked Out</span>
                  <h3 className="fw-bold m-0 text-dark">
                    {appointments.filter(a => a.status === 'Completed').length}
                  </h3>
                  <span className="text-info small" style={{ fontSize: '10px' }}><i className="fa fa-check me-1"></i>Completed</span>
                </div>
                <svg width="100" height="40" className="ms-2">
                  <path d="M 0 20 Q 25 35, 50 15 T 85 30 T 100 10" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Panel Workspace Content */}
          <div className="flex-grow-1">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading doctor portal databases...</p>
              </div>
            ) : selectedApp ? (
              
              /* ================= ACTIVE CHECKUP CONSULTATION PANEL ================= */
              <div className="animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold m-0 text-dark"><i className="fa fa-user-md text-primary me-2"></i>Patient Checkup & EMR</h4>
                  <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setSelectedApp(null)}>
                    <i className="fa fa-arrow-left me-1"></i> Back to Queue
                  </button>
                </div>

                <form onSubmit={submitCheckup} onKeyDown={handleKeyDown}>
                  <div className="card bg-light border-0 rounded-4 p-3 mb-4 text-start">
                    <h6 className="fw-bold mb-3"><i className="fa fa-user-shield text-primary me-2"></i>Verify & Set Patient Profile</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="small text-muted mb-1">Mobile Number</label>
                        <input type="text" className="form-control" value={patientMobile} onChange={(e) => setPatientMobile(e.target.value)} required />
                      </div>
                      <div className="col-md-2">
                        <label className="small text-muted mb-1">Age</label>
                        <input type="number" className="form-control" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} required />
                      </div>
                      <div className="col-md-3">
                        <label className="small text-muted mb-1">Gender</label>
                        <select className="form-select" value={patientGender} onChange={(e) => setPatientGender(e.target.value)} required>
                          <option value="">Choose</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="small text-muted mb-1">Blood Group</label>
                        <select className="form-select" value={patientBloodGroup} onChange={(e) => setPatientBloodGroup(e.target.value)}>
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="small text-muted mb-1">Emergency contact phone</label>
                        <input type="text" className="form-control" value={patientEmergency} onChange={(e) => setPatientEmergency(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="small text-muted mb-1">Patient Home Address</label>
                        <input type="text" className="form-control" value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {/* Consultation checkup details */}
                  <h6 className="fw-bold mb-3 text-start"><i className="fa fa-file-medical text-primary me-2"></i>Consultation Records</h6>
                  <div className="row g-3 mb-4 text-start">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Diagnosis / Condition *</label>
                      <input type="text" className="form-control py-2" placeholder="e.g., Acute Migraine, Viral Fever" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Treatment Plan / Recommendation *</label>
                      <input type="text" className="form-control py-2" placeholder="e.g., Rest 3 days, avoid screen time" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Clinical Notes</label>
                      <textarea className="form-control" rows={2} placeholder="Optional physician checkup findings..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                    </div>
                  </div>

                  {/* Diet & Fitness Planner Builder */}
                  <DietPlanBuilder checklist={patientTodoChecklist} onChange={setPatientTodoChecklist} />

                  {/* Prescription Builder */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0"><i className="fa fa-prescription-bottle-alt text-success me-2"></i>Issue Medicines (Rx)</h6>
                    <button type="button" className="btn btn-xs btn-outline-success" onClick={handleAddMedicine}>
                      + Add Medicine
                    </button>
                  </div>

                  {medicines.map((med, index) => (
                    <div key={index} className="row g-2 align-items-end mb-3 border-bottom pb-2">
                      <div className="col-md-4">
                        <label className="small text-muted">Medicine Name</label>
                        <input type="text" className="form-control" placeholder="e.g., Paracetamol 500mg" value={med.name} onChange={(e) => handleMedChange(index, 'name', e.target.value)} />
                      </div>
                      <div className="col-md-2">
                        <label className="small text-muted">Dosage</label>
                        <input type="text" className="form-control" placeholder="1 tab, 5ml" value={med.dosage} onChange={(e) => handleMedChange(index, 'dosage', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="small text-muted">Frequency</label>
                        <input type="text" className="form-control" placeholder="Once daily, 1-0-1" value={med.frequency} onChange={(e) => handleMedChange(index, 'frequency', e.target.value)} />
                      </div>
                      <div className="col-md-2">
                        <label className="small text-muted">Duration</label>
                        <input type="text" className="form-control" placeholder="5 days, 1 month" value={med.duration} onChange={(e) => handleMedChange(index, 'duration', e.target.value)} />
                      </div>
                      <div className="col-md-1 text-center">
                        <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => handleRemoveMedicine(index)}>
                          <i className="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 border-top pt-3 text-end">
                    <button type="submit" className="btn btn-primary px-4 py-2 fw-bold shadow-sm rounded-pill">
                      <i className="fa fa-file-invoice me-2"></i> Complete Checkout & Submit
                    </button>
                  </div>
                </form>
              </div>

            ) : selectedPatientHistory ? (
              
              /* ================= PATIENT CLINICAL HISTORY VIEW ================= */
              <div className="animate__animated animate__fadeIn text-start">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold m-0 text-dark"><i className="fa fa-history text-secondary me-2"></i>Patient Clinical Record</h4>
                  <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setSelectedPatientHistory(null)}>
                    <i className="fa fa-arrow-left me-1"></i> Back to List
                  </button>
                </div>

                <div className="card bg-light border-0 rounded-4 p-3 mb-4 text-start">
                  <h6 className="fw-bold mb-3"><i className="fa fa-user-circle text-primary me-2"></i>Patient Bio Info</h6>
                  <div className="row g-2">
                    <div className="col-md-4"><strong>Full Name:</strong> {selectedPatientHistory.name}</div>
                    <div className="col-md-4"><strong>Email Address:</strong> {selectedPatientHistory.email}</div>
                    <div className="col-md-4"><strong>Mobile Number:</strong> {selectedPatientHistory.metadata?.mobile || 'Not set'}</div>
                    <div className="col-md-4"><strong>Age / Gender:</strong> {selectedPatientHistory.metadata?.age || 'N/A'} yrs / {selectedPatientHistory.metadata?.gender || 'N/A'}</div>
                    <div className="col-md-4"><strong>Blood Group:</strong> {selectedPatientHistory.metadata?.bloodGroup || 'Not set'}</div>
                    <div className="col-md-4"><strong>Address:</strong> {selectedPatientHistory.metadata?.address || 'Not set'}</div>
                  </div>
                </div>

                {loadingHistoryDetails ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Retrieving patient medical folder files...</p>
                  </div>
                ) : editingPrescriptionId ? (
                  /* INLINE PRESCRIPTION RETRO EDITOR FOR HISTORY FOLDERS */
                  <div className="card border p-4 rounded-4 shadow-sm bg-light animate__animated animate__fadeIn">
                    <h5 className="fw-bold text-success mb-4"><i className="fa fa-edit me-2"></i>Modify Prescribed Medicines</h5>
                    <form onSubmit={handleSavePrescriptionEdits}>
                      {medicines.map((med, index) => (
                        <div key={index} className="row g-2 align-items-end mb-3 border-bottom pb-2">
                          <div className="col-md-4">
                            <label className="small text-muted">Medicine Name</label>
                            <input type="text" className="form-control" placeholder="Medicine Name" value={med.name} onChange={(e) => handleMedChange(index, 'name', e.target.value)} required />
                          </div>
                          <div className="col-md-2">
                            <label className="small text-muted">Dosage</label>
                            <input type="text" className="form-control" placeholder="Dosage" value={med.dosage} onChange={(e) => handleMedChange(index, 'dosage', e.target.value)} required />
                          </div>
                          <div className="col-md-3">
                            <label className="small text-muted">Frequency</label>
                            <input type="text" className="form-control" placeholder="Frequency" value={med.frequency} onChange={(e) => handleMedChange(index, 'frequency', e.target.value)} required />
                          </div>
                          <div className="col-md-2">
                            <label className="small text-muted">Duration</label>
                            <input type="text" className="form-control" placeholder="Duration" value={med.duration} onChange={(e) => handleMedChange(index, 'duration', e.target.value)} required />
                          </div>
                          <div className="col-md-1 text-center">
                            {medicines.length > 1 && (
                              <button type="button" className="btn btn-outline-danger btn-sm mb-1" onClick={() => handleRemoveMedicine(index)}>
                                <i className="fa fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="mt-3 text-end">
                        <button type="button" className="btn btn-sm btn-outline-success px-3 rounded-pill" onClick={handleAddMedicine}>
                          + Add Medicine
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="form-label fw-semibold small">Special Instructions</label>
                        <input type="text" className="form-control py-2" placeholder="Special dosage guidelines..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                      </div>

                      <div className="mt-4 pt-3 border-top text-end">
                        <button className="btn btn-primary px-4 py-2 me-2 rounded-pill fw-bold" type="submit">Save Changes</button>
                        <button className="btn btn-outline-secondary px-4 py-2 rounded-pill" type="button" onClick={() => setEditingPrescriptionId(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="row g-4">
                    {/* Clinical consultation logs column */}
                    <div className="col-md-6">
                      <h5 className="fw-bold text-primary mb-3"><i className="fa fa-file-medical me-2"></i>Consultation Logs</h5>
                      {patientRecords.length === 0 ? (
                        <div className="p-4 border rounded-4 text-center bg-light text-muted small">No checkups recorded for this patient.</div>
                      ) : (
                        patientRecords.map((rec) => (
                          <div key={rec._id} className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-light">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Consultation Record</span>
                              <small className="text-muted">{new Date(rec.visitDate).toLocaleDateString()}</small>
                            </div>
                            <h6 className="fw-bold mb-1">Diagnosis: {rec.diagnosis}</h6>
                            <p className="small text-dark mb-2"><strong>Treatment Plan:</strong> {rec.treatmentPlan}</p>
                            {rec.notes && (
                              <div className="p-2 border rounded text-muted small bg-white mt-1">
                                <strong>Physician Notes:</strong> {rec.notes}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Prescriptions column */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold text-success m-0"><i className="fa fa-prescription-bottle-alt me-2"></i>Issued Prescriptions (Rx)</h5>
                        <button type="button" className="btn btn-xs btn-outline-success rounded-pill px-3" onClick={startNewPrescription}>
                          + Add Rx
                        </button>
                      </div>
                      
                      {patientPrescriptions.length === 0 ? (
                        <div className="p-4 border rounded-4 text-center bg-light text-muted small">No prescriptions issued for this patient.</div>
                      ) : (
                        patientPrescriptions.map((pres) => {
                          const isUpdated = pres.updatedAt && pres.createdAt !== pres.updatedAt;
                          const isAuthor = typeof pres.doctor === 'object' 
                            ? pres.doctor._id === user?.id 
                            : pres.doctor === user?.id;

                          return (
                            <div key={pres._id} className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-light">
                              <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-2">
                                <div>
                                  <span className="badge bg-success-subtle text-success border border-success-subtle mb-1">Prescription Log</span>
                                  <small className="text-muted d-block">Issued: {new Date(pres.createdAt).toLocaleDateString()}</small>
                                  {isUpdated && <small className="text-danger fw-bold d-block">Updated: {new Date(pres.updatedAt).toLocaleDateString()}</small>}
                                </div>
                                {isAuthor && (
                                  <button type="button" className="btn btn-xs btn-outline-success rounded-pill px-3" onClick={() => startEditingPrescription(pres)}>
                                    <i className="fa fa-edit me-1"></i> Edit
                                  </button>
                                )}
                              </div>

                              <div className="table-responsive bg-white rounded p-2 border">
                                <table className="table table-sm table-borderless small mb-0">
                                  <thead>
                                    <tr className="border-bottom text-muted">
                                      <th>Medicine</th>
                                      <th>Dosage</th>
                                      <th>Freq</th>
                                      <th>Days</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pres.medicines.map((med, idx) => (
                                      <tr key={idx}>
                                        <td className="fw-bold text-dark">{med.name}</td>
                                        <td>{med.dosage}</td>
                                        <td>{med.frequency}</td>
                                        <td>{med.duration}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {pres.instructions && (
                                <div className="p-2 border rounded text-muted small bg-white mt-2">
                                  <strong>Directions:</strong> {pres.instructions}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Laboratory Test Reports Section in history */}
                    <div className="col-12 mt-4 pt-3 border-top">
                      <h5 className="fw-bold text-danger mb-3"><i className="fa fa-file-pdf me-2"></i>Patient Uploaded Test Reports</h5>
                      {!selectedPatientHistory.metadata?.reports || selectedPatientHistory.metadata.reports.length === 0 ? (
                        <div className="p-4 border rounded-4 text-center bg-light text-muted small">No scanned reports uploaded by this patient.</div>
                      ) : (
                        <div className="row g-3">
                          {selectedPatientHistory.metadata.reports
                            .filter((r: any) => r.doctorRef === user?.id)
                            .map((report: any, index: number) => (
                              <div key={index} className="col-md-6">
                                <div className="card border p-3 rounded-4 shadow-sm h-100 bg-white">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="fw-bold text-dark m-0">{report.title}</h6>
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{report.extractedData?.metrics_detected || 'Biochemistry'}</span>
                                  </div>
                                  <p className="small text-muted mb-3">Scanned on: {new Date(report.uploadedAt).toLocaleDateString()}</p>
                                  
                                  <div className="p-2 bg-light rounded text-start mb-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    <strong className="small text-muted d-block mb-1">Extracted Text:</strong>
                                    {highlightMedicalVitals(report.extractedText)}
                                  </div>

                                  {/* AI Insights triggering button */}
                                  <div className="d-flex justify-content-between align-items-center">
                                    {report.aiAnalysis && (
                                      <button 
                                        type="button"
                                        className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-bold"
                                        onClick={() => {
                                          setSelectedReportForAI(report);
                                          setIsAICopilotOpen(true);
                                        }}
                                      >
                                        <i className="fa fa-robot me-1"></i> AI Insights
                                      </button>
                                    )}
                                    <a 
                                      href={`${API_BASE_URL.replace('/api', '')}${report.filePath}`} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="btn btn-sm btn-outline-danger px-3 rounded-pill"
                                    >
                                      Open File
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            ) : (

              /* ================= WORKSPACE SWITCHER ACCORDING TO TABS ================= */
              <>
                {/* TAB 1: TODAY'S CONSULTATION QUEUE */}
                {activeTab === 'today' && (
                  <div className="animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-4 text-dark text-start"><i className="fa fa-list-ul text-primary me-2"></i>Today's Patient Consultation Queue</h5>
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-5 text-muted border rounded-4 bg-light">
                        <i className="fa fa-clipboard-list fa-3x mb-3 text-muted"></i>
                        <p className="m-0">Your consultation queue is empty for today.</p>
                      </div>
                    ) : (
                      <div className="table-responsive rounded-4 border bg-white">
                        <table className="table table-hover align-middle mb-0 text-start">
                          <thead className="table-light">
                            <tr className="text-muted small">
                              <th className="ps-4">Patient Name</th>
                              <th>Schedule Time</th>
                              <th>Vitals/Problem</th>
                              <th>Status</th>
                              <th className="text-end pe-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todayAppointments.map((app) => {
                              const pat = patients.find(p => p._id === app.user);
                              return (
                                <tr key={app._id}>
                                  <td className="ps-4">
                                    <div className="fw-bold text-dark">{pat ? pat.name : 'Unknown Patient'}</div>
                                    <small className="text-muted">{pat ? pat.email : ''}</small>
                                  </td>
                                  <td>{app.date} at <span className="fw-semibold">{app.time}</span></td>
                                  <td>
                                    <span className="small text-muted">{app.problem || 'General Checkup'}</span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      app.status === 'Scheduled' ? 'bg-primary' : 
                                      app.status === 'Approved' ? 'bg-success' : 'bg-secondary'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="text-end pe-4">
                                    <button 
                                      type="button"
                                      className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                      onClick={() => startCheckup(app)}
                                    >
                                      <i className="fa fa-stethoscope me-1"></i> Checkup
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MANAGE APPOINTMENTS */}
                {activeTab === 'appointments' && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
                      <h5 className="fw-bold text-dark m-0 text-start"><i className="fa fa-calendar-alt text-primary me-2"></i>Consultations & Bookings Hub</h5>
                      <div className="btn-group border shadow-sm rounded-pill overflow-hidden">
                        <button 
                          className={`btn btn-sm px-3 border-0 rounded-0 ${viewMode === 'list' ? 'btn-primary' : 'btn-light text-dark'}`} 
                          onClick={() => setViewMode('list')}
                        >
                          <i className="fa fa-list me-1"></i> List View
                        </button>
                        <button 
                          className={`btn btn-sm px-3 border-0 rounded-0 ${viewMode === 'calendar' ? 'btn-primary' : 'btn-light text-dark'}`} 
                          onClick={() => setViewMode('calendar')}
                        >
                          <i className="fa fa-calendar me-1"></i> Calendar View
                        </button>
                      </div>
                    </div>

                    {viewMode === 'list' ? (
                      appointments.length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-4 bg-light">
                          <i className="fa fa-calendar-times fa-3x mb-3 text-muted"></i>
                          <p className="m-0">No booking requests found in database.</p>
                        </div>
                      ) : (
                        <div className="table-responsive rounded-4 border bg-white">
                          <table className="table table-hover align-middle mb-0 text-start">
                            <thead className="table-light">
                              <tr className="text-muted small">
                                <th className="ps-4">Patient</th>
                                <th>Timings</th>
                                <th>Reason</th>
                                <th>Booking Status</th>
                                <th className="text-end pe-4">Options</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointments.map((app) => {
                                const pat = patients.find(p => p._id === app.user);
                                return (
                                  <tr key={app._id}>
                                    <td className="ps-4">
                                      <div className="fw-bold text-dark">{pat ? pat.name : 'Unknown Patient'}</div>
                                      <small className="text-muted">{pat ? pat.email : ''}</small>
                                    </td>
                                    <td>{app.date} at <span className="fw-semibold">{app.time}</span></td>
                                    <td><span className="small text-muted">{app.problem}</span></td>
                                    <td>
                                      <span className={`badge ${
                                        app.status === 'Approved' ? 'bg-success' :
                                        app.status === 'Completed' ? 'bg-info' :
                                        app.status === 'Cancelled' ? 'bg-danger' : 'bg-warning'
                                      }`}>
                                        {app.status}
                                      </span>
                                    </td>
                                    <td className="text-end pe-4">
                                      {app.status === 'Scheduled' && (
                                        <>
                                          <button type="button" className="btn btn-xs btn-success rounded-pill px-2 me-1" onClick={() => updateStatus(app._id, 'Approved')}>
                                            Approve
                                          </button>
                                          <button type="button" className="btn btn-xs btn-danger rounded-pill px-2" onClick={() => updateStatus(app._id, 'Cancelled')}>
                                            Cancel
                                          </button>
                                        </>
                                      )}
                                      {app.status === 'Approved' && (
                                        <button type="button" className="btn btn-xs btn-primary rounded-pill px-2" onClick={() => startCheckup(app)}>
                                          Checkup
                                        </button>
                                      )}
                                      {app.status === 'Completed' && (
                                        <span className="text-success small fw-bold"><i className="fa fa-check-circle"></i> Checked Out</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      /* 📅 DOCTOR CALENDAR GRID */
                      <div className="card p-3 p-md-4 border rounded-4 shadow-sm bg-white overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <button 
                            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                          >
                            <i className="fa fa-chevron-left"></i>
                          </button>
                          <h4 className="fw-bold m-0 text-capitalize text-dark text-center">
                            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                          </h4>
                          <button 
                            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                          >
                            <i className="fa fa-chevron-right"></i>
                          </button>
                        </div>

                        {/* Days Header */}
                        <div className="row text-center fw-bold text-muted small py-2 mb-2 border-bottom">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="col text-center" style={{ width: '14.28%', flex: '0 0 14.28%' }}>{d}</div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="row g-0 border-start border-top">
                          {/* Empty offset cells */}
                          {Array(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()).fill(null).map((_, idx) => (
                            <div key={`empty-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '100px', opacity: 0.4 }}></div>
                          ))}

                          {/* Month Days */}
                          {Array(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).fill(null).map((_, idx) => {
                            const dayNum = idx + 1;
                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            
                            // Find appointments matching this date
                            const dayApps = appointments.filter(app => app.date === dateStr);

                            return (
                              <div key={dayNum} className="col border-bottom border-end p-2 position-relative bg-white" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '100px' }}>
                                <span className="fw-bold text-muted small position-absolute top-1 start-2">{dayNum}</span>
                                <div className="mt-3 overflow-y-auto" style={{ maxHeight: '75px', scrollbarWidth: 'none' }}>
                                  {dayApps.map(app => {
                                    const pat = patients.find(p => p._id === app.user);
                                    const patName = pat ? pat.name : 'Patient';
                                    
                                    return (
                                      <div 
                                        key={app._id}
                                        className={`p-1 mb-1 rounded text-white text-truncate text-start`}
                                        style={{ 
                                          fontSize: '9px', 
                                          cursor: 'pointer',
                                          lineHeight: '1.2',
                                          backgroundColor: app.status === 'Approved' ? '#198754' : app.status === 'Completed' ? '#0dcaf0' : app.status === 'Cancelled' ? '#dc3545' : '#ffc107',
                                          color: app.status === 'Scheduled' ? '#212529' : '#fff'
                                        }}
                                        onClick={() => {
                                          if (app.status === 'Approved') {
                                            startCheckup(app);
                                          } else if (app.status === 'Scheduled') {
                                            updateStatus(app._id, 'Approved');
                                          }
                                        }}
                                        title={`${patName} - ${app.time} - ${app.problem} (${app.status}) [Click to manage]`}
                                      >
                                        <strong className="d-block">{app.time}</strong>
                                        <span>{patName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* End offset padding cells */}
                          {Array((7 - ((new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()) % 7)) % 7).fill(null).map((_, idx) => (
                            <div key={`empty-end-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '100px', opacity: 0.4 }}></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PATIENT HISTORY LOGS */}
                {activeTab === 'history' && (
                  <div className="animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-4 text-dark text-start"><i className="fa fa-folder-open text-primary me-2"></i>Patient Electronic Medical Folders</h5>
                    {myPatients.length === 0 ? (
                      <div className="text-center py-5 text-muted border rounded-4 bg-light">
                        <i className="fa fa-users-cog fa-3x mb-3 text-muted"></i>
                        <p className="m-0">No patient medical records registered with you.</p>
                      </div>
                    ) : (
                      <div className="row g-3 text-start">
                        {myPatients.map((pat) => (
                          <div key={pat._id} className="col-md-6 col-lg-4">
                            <div className="card border p-3 rounded-4 shadow-sm bg-light text-start h-100 d-flex flex-column justify-content-between">
                              <div>
                                <h6 className="fw-bold text-dark m-0">{pat.name}</h6>
                                <p className="text-muted small mb-2">{pat.email}</p>
                                <hr className="my-2" />
                                <div className="small text-muted mb-3">
                                  <div>Age / Gender: {pat.metadata?.age || 'N/A'} yrs / {pat.metadata?.gender || 'N/A'}</div>
                                  <div>Blood Group: {pat.metadata?.bloodGroup || 'Not set'}</div>
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="btn btn-sm btn-outline-primary w-100 rounded-pill"
                                onClick={() => selectPatientHistory(pat)}
                              >
                                <i className="fa fa-folder-open me-1"></i> Open EMR File
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PROFILE SETTINGS */}
                {activeTab === 'profile' && (
                  <div className="animate__animated animate__fadeIn text-start">
                    <h5 className="mb-4 fw-bold text-dark text-start"><i className="fa fa-user-md text-primary me-2"></i>Physician Profile Settings</h5>
                    <form onSubmit={handleProfileSubmit}>
                      <div className="row g-4 text-start">
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">Specialization Area</label>
                          <input type="text" className="form-control py-3" placeholder="e.g. Cardiology Specialist" value={profileForm.specialization} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })} required />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold small">Experience (Years)</label>
                          <input type="number" className="form-control py-3" value={profileForm.experience} onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })} required />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold small">Consultation Fees (INR)</label>
                          <input type="number" className="form-control py-3" value={profileForm.fees} onChange={(e) => setProfileForm({ ...profileForm, fees: e.target.value })} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">Medical Department</label>
                          <input type="text" className="form-control py-3" placeholder="Cardiology, Pediatrics, etc." value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-bold small">Physician Bio Summary</label>
                          <textarea className="form-control" rows={3} placeholder="Write a short summary about your medical practice..." value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}></textarea>
                        </div>
                        
                        <div className="col-12">
                          <label className="form-label fw-bold d-block small">Weekly Availability Days</label>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const active = profileForm.availability.includes(day);
                            return (
                              <button 
                                key={day}
                                type="button" 
                                className={`btn btn-sm me-2 mb-2 px-3 py-2 rounded-pill ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => toggleDay(day)}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        <div className="col-12 mt-4 text-end">
                          <button className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-sm" type="submit">
                            Save Profile Settings
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 5: NUTRITION PLANS */}
                {activeTab === 'nutrition' && (
                  <div className="animate__animated animate__fadeIn text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold text-dark m-0">
                        <i className="fa fa-apple-alt text-success me-2"></i>🍏 Manage Patient Nutrition Plans
                      </h4>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                      <label className="form-label fw-bold small text-muted mb-2">Select Patient to Prescribe</label>
                      <select 
                        className="form-select py-3 mb-4 rounded-3 border-secondary bg-light"
                        value={selectedPlanPatientId}
                        onChange={(e) => {
                          const patId = e.target.value;
                          setSelectedPlanPatientId(patId);
                          const pat = patients.find(p => p._id === patId);
                          setPatientTodoChecklist(pat?.metadata?.dietPlan || []);
                          setPlanSuccessMsg('');
                        }}
                      >
                        <option value="">-- Choose a patient --</option>
                        {patients.map((pat) => (
                          <option key={pat._id} value={pat._id}>
                            {pat.name} ({pat.email})
                          </option>
                        ))}
                      </select>

                      {selectedPlanPatientId && (
                        <div>
                          <div className="alert alert-info py-3 border-0 rounded-3 mb-4">
                            <i className="fa fa-info-circle me-2"></i>
                            Prescribing nutrition and diet tasks for <strong>{patients.find(p => p._id === selectedPlanPatientId)?.name}</strong>.
                          </div>

                          <DietPlanBuilder 
                            checklist={patientTodoChecklist} 
                            onChange={setPatientTodoChecklist} 
                          />

                          {planSuccessMsg && (
                            <div className="alert alert-success border-0 py-2 px-3 rounded-3 mb-3 small">
                              <i className="fa fa-check-circle me-1"></i> {planSuccessMsg}
                            </div>
                          )}

                          <div className="text-end">
                            <button 
                              type="button" 
                              className="btn btn-success px-5 py-3 fw-bold rounded-pill shadow-sm"
                              onClick={handleSaveIndependentPlan}
                              disabled={savingPlan}
                            >
                              {savingPlan ? 'Saving Changes...' : 'Save & Secure Nutrition Plan'}
                            </button>
                          </div>

                          {/* 7-DAY WEEKLY DIET PLAN & COMPLIANCE SCHEDULER */}
                          <hr className="my-5" />

                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                              <h5 className="fw-bold text-dark m-0">📅 7-Day Weekly Meal Calendar & Compliance</h5>
                              <p className="text-muted small m-0">Assign a structured weekly diet and track patient compliance logs.</p>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary px-4 py-2 fw-bold rounded-pill shadow-sm"
                              onClick={() => setShowWeeklyPlanner(true)}
                            >
                              <i className="fa fa-utensils me-1"></i> Assign Weekly Diet
                            </button>
                          </div>

                          {loadingWeeklyData ? (
                            <div className="text-center py-4">
                              <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                              <p className="text-muted mt-2 small">Loading compliance logs...</p>
                            </div>
                          ) : (
                            <div className="table-responsive rounded-3 border bg-white shadow-sm">
                              <table className="table table-hover align-middle mb-0 text-start">
                                <thead className="table-light text-muted small fw-bold">
                                  <tr>
                                    <th style={{ width: '120px' }}>Day of Week</th>
                                    <th>Breakfast</th>
                                    <th>Lunch</th>
                                    <th>Snacks</th>
                                    <th>Dinner</th>
                                  </tr>
                                </thead>
                                <tbody className="small">
                                  {daysOfWeek.map((day, idx) => {
                                    const dayPlan = weeklyPlanData?.[day] || {};
                                    return (
                                      <tr key={day}>
                                        <td className="fw-bold text-capitalize text-dark">{day}</td>
                                        <td>
                                          <div className="fw-semibold text-secondary mb-1">{dayPlan.breakfast || '—'}</div>
                                          {dayPlan.breakfast && (
                                            <div style={{ fontSize: '10px' }}>
                                              {(() => {
                                                const today = new Date();
                                                const currentDay = today.getDay();
                                                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                                                const targetDate = new Date(today);
                                                targetDate.setDate(today.getDate() + distanceToMonday + idx);
                                                const dateStr = targetDate.toISOString().split('T')[0];
                                                const log = complianceLogs.find(l => l.date === dateStr);
                                                const status = log?.meals?.breakfast || 'Pending';
                                                if (status === 'Followed') return <span className="badge bg-success-subtle text-success border border-success">🟢 Followed</span>;
                                                if (status === 'Skipped') return <span className="badge bg-danger-subtle text-danger border border-danger">🔴 Skipped</span>;
                                                return <span className="badge bg-light text-muted border">Pending</span>;
                                              })()}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <div className="fw-semibold text-secondary mb-1">{dayPlan.lunch || '—'}</div>
                                          {dayPlan.lunch && (
                                            <div style={{ fontSize: '10px' }}>
                                              {(() => {
                                                const today = new Date();
                                                const currentDay = today.getDay();
                                                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                                                const targetDate = new Date(today);
                                                targetDate.setDate(today.getDate() + distanceToMonday + idx);
                                                const dateStr = targetDate.toISOString().split('T')[0];
                                                const log = complianceLogs.find(l => l.date === dateStr);
                                                const status = log?.meals?.lunch || 'Pending';
                                                if (status === 'Followed') return <span className="badge bg-success-subtle text-success border border-success">🟢 Followed</span>;
                                                if (status === 'Skipped') return <span className="badge bg-danger-subtle text-danger border border-danger">🔴 Skipped</span>;
                                                return <span className="badge bg-light text-muted border">Pending</span>;
                                              })()}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <div className="fw-semibold text-secondary mb-1">{dayPlan.snacks || '—'}</div>
                                          {dayPlan.snacks && (
                                            <div style={{ fontSize: '10px' }}>
                                              {(() => {
                                                const today = new Date();
                                                const currentDay = today.getDay();
                                                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                                                const targetDate = new Date(today);
                                                targetDate.setDate(today.getDate() + distanceToMonday + idx);
                                                const dateStr = targetDate.toISOString().split('T')[0];
                                                const log = complianceLogs.find(l => l.date === dateStr);
                                                const status = log?.meals?.snacks || 'Pending';
                                                if (status === 'Followed') return <span className="badge bg-success-subtle text-success border border-success">🟢 Followed</span>;
                                                if (status === 'Skipped') return <span className="badge bg-danger-subtle text-danger border border-danger">🔴 Skipped</span>;
                                                return <span className="badge bg-light text-muted border">Pending</span>;
                                              })()}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <div className="fw-semibold text-secondary mb-1">{dayPlan.dinner || '—'}</div>
                                          {dayPlan.dinner && (
                                            <div style={{ fontSize: '10px' }}>
                                              {(() => {
                                                const today = new Date();
                                                const currentDay = today.getDay();
                                                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                                                const targetDate = new Date(today);
                                                targetDate.setDate(today.getDate() + distanceToMonday + idx);
                                                const dateStr = targetDate.toISOString().split('T')[0];
                                                const log = complianceLogs.find(l => l.date === dateStr);
                                                const status = log?.meals?.dinner || 'Pending';
                                                if (status === 'Followed') return <span className="badge bg-success-subtle text-success border border-success">🟢 Followed</span>;
                                                if (status === 'Skipped') return <span className="badge bg-danger-subtle text-danger border border-danger">🔴 Skipped</span>;
                                                return <span className="badge bg-light text-muted border">Pending</span>;
                                              })()}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: FITNESS PLANS */}
                {activeTab === 'fitness' && (
                  <div className="animate__animated animate__fadeIn text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold text-dark m-0">
                        <i className="fa fa-running text-primary me-2"></i>🏃 Manage Patient Fitness Plans
                      </h4>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                      <label className="form-label fw-bold small text-muted mb-2">Select Patient to Prescribe</label>
                      <select 
                        className="form-select py-3 mb-4 rounded-3 border-secondary bg-light"
                        value={selectedPlanPatientId}
                        onChange={(e) => {
                          const patId = e.target.value;
                          setSelectedPlanPatientId(patId);
                          const pat = patients.find(p => p._id === patId);
                          setPatientTodoChecklist(pat?.metadata?.dietPlan || []);
                          setPlanSuccessMsg('');
                        }}
                      >
                        <option value="">-- Choose a patient --</option>
                        {patients.map((pat) => (
                          <option key={pat._id} value={pat._id}>
                            {pat.name} ({pat.email})
                          </option>
                        ))}
                      </select>

                      {selectedPlanPatientId && (
                        <div>
                          <div className="alert alert-info py-3 border-0 rounded-3 mb-4">
                            <i className="fa fa-info-circle me-2"></i>
                            Prescribing exercise and workout tasks for <strong>{patients.find(p => p._id === selectedPlanPatientId)?.name}</strong>.
                          </div>

                          <DietPlanBuilder 
                            checklist={patientTodoChecklist} 
                            onChange={setPatientTodoChecklist} 
                          />

                          {planSuccessMsg && (
                            <div className="alert alert-success border-0 py-2 px-3 rounded-3 mb-3 small">
                              <i className="fa fa-check-circle me-1"></i> {planSuccessMsg}
                            </div>
                          )}

                          <div className="text-end">
                            <button 
                              type="button" 
                              className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-sm"
                              onClick={handleSaveIndependentPlan}
                              disabled={savingPlan}
                            >
                              {savingPlan ? 'Saving Changes...' : 'Save & Secure Fitness Plan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 7: GENERAL HABITS */}
                {activeTab === 'general' && (
                  <div className="animate__animated animate__fadeIn text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold text-dark m-0">
                        <i className="fa fa-clipboard-list text-info me-2"></i>📋 Manage Patient General Habits
                      </h4>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                      <label className="form-label fw-bold small text-muted mb-2">Select Patient to Prescribe</label>
                      <select 
                        className="form-select py-3 mb-4 rounded-3 border-secondary bg-light"
                        value={selectedPlanPatientId}
                        onChange={(e) => {
                          const patId = e.target.value;
                          setSelectedPlanPatientId(patId);
                          const pat = patients.find(p => p._id === patId);
                          setPatientTodoChecklist(pat?.metadata?.dietPlan || []);
                          setPlanSuccessMsg('');
                        }}
                      >
                        <option value="">-- Choose a patient --</option>
                        {patients.map((pat) => (
                          <option key={pat._id} value={pat._id}>
                            {pat.name} ({pat.email})
                          </option>
                        ))}
                      </select>

                      {selectedPlanPatientId && (
                        <div>
                          <div className="alert alert-info py-3 border-0 rounded-3 mb-4">
                            <i className="fa fa-info-circle me-2"></i>
                            Prescribing general habits and routine tasks for <strong>{patients.find(p => p._id === selectedPlanPatientId)?.name}</strong>.
                          </div>

                          <DietPlanBuilder 
                            checklist={patientTodoChecklist} 
                            onChange={setPatientTodoChecklist} 
                          />

                          {planSuccessMsg && (
                            <div className="alert alert-success border-0 py-2 px-3 rounded-3 mb-3 small">
                              <i className="fa fa-check-circle me-1"></i> {planSuccessMsg}
                            </div>
                          )}

                          <div className="text-end">
                            <button 
                              type="button" 
                              className="btn btn-info text-white px-5 py-3 fw-bold rounded-pill shadow-sm"
                              onClick={handleSaveIndependentPlan}
                              disabled={savingPlan}
                            >
                              {savingPlan ? 'Saving Changes...' : 'Save & Secure Habits Plan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 8: DOCTOR-PATIENT PRIVATE CHAT */}
                {activeTab === 'chats' && (
                  <div className="animate__animated animate__fadeIn text-start">
                    <h4 className="fw-bold mb-4 text-dark"><i className="fa fa-comments text-primary me-2"></i>Patient Conversations</h4>
                    <div className="row g-4">
                      {/* Patients List Column */}
                      <div className="col-md-4">
                        <div className="card border rounded-4 p-3 shadow-sm bg-light">
                          <h6 className="fw-bold mb-3 text-muted">Select a Patient</h6>
                          <div className="list-group">
                            {patients.map((pat) => (
                              <button
                                key={pat._id}
                                type="button"
                                className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 py-3 shadow-sm ${liveChatPartnerId === pat._id ? 'active bg-primary text-white' : ''}`}
                                onClick={() => setLiveChatPartnerId(pat._id)}
                              >
                                <div className="fw-bold small">{pat.name}</div>
                                <span className="text-muted d-block small" style={{ fontSize: '10px' }}>{pat.email}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Chat Box Column */}
                      <div className="col-md-8">
                        {liveChatPartnerId ? (
                          <LiveChatBox 
                            chatPartnerId={liveChatPartnerId} 
                            chatPartnerName={patients.find(p => p._id === liveChatPartnerId)?.name || 'Patient'} 
                            currentUserRole="doctor" 
                          />
                        ) : (
                          <div className="card border rounded-4 shadow-sm text-center py-5 bg-light my-auto h-100 d-flex flex-column justify-content-center" style={{ minHeight: '300px' }}>
                            <i className="fa fa-comments fa-3x mb-3 text-muted"></i>
                            <h5 className="fw-bold">No Patient Selected</h5>
                            <p className="text-muted small">Choose a patient from the roster on the left to start typing.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL STATUS & TIMELINE ================= */}
        <div 
          className="p-4"
          style={{ 
            width: '320px', 
            background: '#f8fafc', 
            borderLeft: '1px solid #e2e8f0',
            overflowY: 'auto',
            flexShrink: 0
          }}
        >
          {/* Pending Appointment Requests Section */}
          <div className="mb-4 text-start">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark m-0">Booking Requests</h6>
              <span className="badge bg-danger rounded-pill">
                {appointments.filter(a => a.status === 'Scheduled').length}
              </span>
            </div>
            {appointments.filter(a => a.status === 'Scheduled').length === 0 ? (
              <p className="text-muted small">No pending booking requests.</p>
            ) : (
              appointments.filter(a => a.status === 'Scheduled').slice(0, 3).map((app) => {
                const pat = patients.find(p => p._id === app.user);
                return (
                  <div key={app._id} className="p-3 border bg-white rounded-4 shadow-sm mb-2 position-relative">
                    <div className="fw-bold text-dark small">{pat?.name || 'Unknown Patient'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      {app.date} at {app.time}
                    </div>
                    <div className="mt-2 d-flex gap-2">
                      <button type="button" className="btn btn-xs btn-success rounded-pill px-3 py-1 fw-bold" onClick={() => updateStatus(app._id, 'Approved')}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-xs btn-outline-danger rounded-pill px-3 py-1" onClick={() => updateStatus(app._id, 'Cancelled')}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <hr className="my-4" />

          {/* Today's Schedule Timeline Section */}
          <div className="text-start">
            <h6 className="fw-bold text-dark mb-3">Today's Schedule</h6>
            {todayAppointments.length === 0 ? (
              <p className="text-muted small">No appointments scheduled for today.</p>
            ) : (
              todayAppointments.map((app) => {
                const pat = patients.find(p => p._id === app.user);
                return (
                  <div key={app._id} className="d-flex mb-3 align-items-start">
                    <div className="me-2 text-muted fw-bold small" style={{ minWidth: '60px', fontSize: '11px' }}>
                      {app.time}
                    </div>
                    <div className="ps-2 border-start border-2 border-primary flex-grow-1">
                      <div className="fw-semibold text-dark small m-0">{pat?.name || 'Unknown Patient'}</div>
                      <span className="text-muted d-block" style={{ fontSize: '10px' }}>{app.problem || 'General Checkup'}</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle mt-1" style={{ fontSize: '9px' }}>{app.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Always render the floating AI button (glowing and on top of all elements/footers) */}
      <button
        type="button"
        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center pulse-ai-btn shadow-lg"
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          width: '60px',
          height: '60px',
          zIndex: 9999, // Force to float above everything (footers, overlays)
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)'
        }}
        onClick={() => {
          // Auto-select first report if none is selected and a patient is active
          const activeUserId = selectedApp ? selectedApp.user : selectedPatientHistory?._id;
          if (activeUserId && !selectedReportForAI) {
            const activePat = patients.find(p => p._id === activeUserId);
            const doctorReports = activePat?.metadata?.reports?.filter((rep: any) => rep.doctorRef === user?.id) || [];
            if (doctorReports.length > 0) {
              setSelectedReportForAI(doctorReports[0]);
            }
          }
          setIsAICopilotOpen(!isAICopilotOpen);
        }}
      >
        <i className="fa fa-robot fs-3 text-white"></i>
      </button>

      {/* Slide-out AI Copilot Drawer */}
      <div 
        className="ai-copilot-drawer shadow-lg text-start" 
        style={{ 
          position: 'fixed',
          top: '105px',
          right: 0,
          height: 'calc(100vh - 105px)',
          width: '420px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000, // Above floating action button 
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isAICopilotOpen ? 'translateX(0)' : 'translateX(100%)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e2e8f0'
        }}
      >
        {/* Drawer Header */}
        <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
          <h5 className="mb-0 fw-bold text-white"><i className="fa fa-robot me-2 text-white"></i>Klinik AI Copilot</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setIsAICopilotOpen(false)}></button>
        </div>

        {/* Tab Controls */}
        <div className="d-flex border-bottom bg-light px-3">
          <button 
            type="button" 
            className={`btn btn-sm rounded-0 border-bottom border-2 px-3 py-2 fw-bold me-2 ${copilotTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
            onClick={() => setCopilotTab('summary')}
          >
            📋 Summary
          </button>
          <button 
            type="button" 
            className={`btn btn-sm rounded-0 border-bottom border-2 px-3 py-2 fw-bold ${copilotTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
            onClick={() => setCopilotTab('chat')}
          >
            💬 Chat Assistant
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 flex-grow-1 text-start d-flex flex-column h-100" style={{ overflowY: 'auto' }}>
          {(() => {
            const activeUserId = selectedApp ? selectedApp.user : selectedPatientHistory?._id;
            const activePat = activeUserId ? patients.find(p => p._id === activeUserId) : null;

            // If Chat tab is selected, render it immediately (even if no patient is active)
            if (copilotTab === 'chat') {
              const currentReport = selectedReportForAI;
              return (
                <div className="d-flex flex-column h-100 flex-grow-1" style={{ minHeight: '350px' }}>
                  {/* Chat Messages Logs */}
                  <div className="flex-grow-1 border rounded p-3 mb-3 bg-light animate__animated animate__fadeIn" style={{ overflowY: 'auto', maxHeight: '380px' }}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`mb-3 d-flex flex-column ${msg.sender === 'doctor' ? 'align-items-end' : 'align-items-start'}`}>
                        <span className="small text-muted mb-1 fw-bold">{msg.sender === 'doctor' ? 'You (Doctor)' : 'EMR Copilot'}</span>
                        <div 
                          className={`p-2 rounded-3 text-dark small ${msg.sender === 'doctor' ? 'bg-primary-subtle border border-primary-subtle' : 'bg-white border'}`}
                          style={{ maxWidth: '85%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="text-start mb-3">
                        <span className="small text-muted mb-1 fw-bold">EMR Copilot</span>
                        <div className="p-2 rounded-3 bg-white border text-muted small d-inline-block">
                          <span className="spinner-border spinner-border-sm me-2"></span> Thinking...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Group Form */}
                  <form onSubmit={(e) => handleSendChatMessage(e, currentReport?.extractedText || '')} className="input-group mt-auto">
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder={currentReport ? `Ask about "${currentReport.title}"...` : "Ask a general medical question..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={sendingChat}
                      required
                    />
                    <button className="btn btn-primary btn-sm" type="submit" disabled={sendingChat}>
                      <i className="fa fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              );
            }

            // Otherwise, for Summary tab: show standby screen if no patient is active
            if (!activePat) {
              return (
                <div className="text-center py-5 text-muted my-auto animate__animated animate__fadeIn">
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-light border mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="fa fa-robot fs-1 text-primary"></i>
                  </div>
                  <h5 className="fw-bold text-dark mt-2">AI Copilot Standby</h5>
                  <p className="small">Please start a patient checkup or open a patient history file to load clinical AI insights.</p>
                </div>
              );
            }

            const doctorReports = activePat?.metadata?.reports?.filter((rep: any) => rep.doctorRef === user?.id) || [];

            if (doctorReports.length === 0) {
              return (
                <div className="text-center py-5 text-muted my-auto">
                  <i className="fa fa-folder-open fa-3x mb-3 text-muted"></i>
                  <p>No test reports uploaded for you by this patient.</p>
                </div>
              );
            }

            const currentReport = selectedReportForAI && doctorReports.some(r => r._id === selectedReportForAI._id)
              ? selectedReportForAI
              : doctorReports[0];

            return (
              
              <>
                {/* Report Selector Dropdown */}
                <div className="mb-3 flex-shrink-0">
                  <label className="form-label fw-bold text-muted small">Select Report to Analyze</label>
                  <select 
                    className="form-select"
                    value={currentReport?._id || ''}
                    onChange={(e) => {
                      const rep = doctorReports.find(r => r._id === e.target.value);
                      if (rep) {
                        setSelectedReportForAI(rep);
                        // Reset chat context when swapping reports
                        setChatMessages([
                          { sender: 'ai', text: `Hi, I am your EMR Copilot. Ask me anything about the report: "${rep.title}"!` }
                        ]);
                      }
                    }}
                  >
                    {doctorReports.map((r: any) => (
                      <option key={r._id} value={r._id}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <hr className="my-2" />

                {/* TAB 1: SUMMARY DETAILS */}
                {copilotTab === 'summary' && (
                  <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                    <div className="mb-3">
                      <strong className="small text-danger d-block mb-1">AI Detected Condition:</strong>
                      <div className="p-2 bg-light border rounded fw-bold text-dark">{currentReport?.aiAnalysis?.condition || 'No condition flagged.'}</div>
                    </div>

                    <div className="mb-3">
                      <strong className="small text-warning-emphasis d-block mb-1">Critical Metric Alerts:</strong>
                      <div className="p-2 bg-light border rounded text-muted small">{currentReport?.aiAnalysis?.alerts || 'No critical metrics flagged.'}</div>
                    </div>

                    <div className="mb-3">
                      <strong className="small text-success d-block mb-1">Remedies & Overcome Plan:</strong>
                      <div className="p-2 bg-light border rounded text-muted small" style={{ whiteSpace: 'pre-wrap' }}>{currentReport?.aiAnalysis?.remedies || 'Standard rest and recovery recommended.'}</div>
                    </div>

                    <div className="alert alert-warning py-2 px-3 small border-0 mb-4 mt-3">
                      <i className="fa fa-info-circle me-1"></i> Verify all metrics manually.
                    </div>

                    {selectedApp && (
                      <button 
                        type="button" 
                        className="btn btn-success fw-bold w-100 py-3 mt-2 rounded shadow-sm"
                        onClick={() => {
                          setDiagnosis(currentReport?.aiAnalysis?.condition || '');
                          setTreatmentPlan(currentReport?.aiAnalysis?.remedies || '');
                          setIsAICopilotOpen(false);
                          triggerToast('success', 'AI recommendations copied to EMR!');
                        }}
                      >
                        <i className="fa fa-copy me-2"></i> Copy to EMR Form
                      </button>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
      
      {showWeeklyPlanner && selectedPlanPatientId && (
        <WeeklyDietPlanner
          patientId={selectedPlanPatientId}
          patientName={patients.find(p => p._id === selectedPlanPatientId)?.name || 'Patient'}
          onClose={() => setShowWeeklyPlanner(false)}
          onSuccess={() => {
            setToast({ type: 'success', text: 'Weekly diet plan saved successfully!' });
            loadWeeklyData();
          }}
        />
      )}

      {/* AI Assistant Custom CSS Styles */}
      <style>{`
        @keyframes pulse-ai {
          0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
          100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
        .pulse-ai-btn {
          animation: pulse-ai 2s infinite;
          transition: all 0.3s ease;
        }
        .pulse-ai-btn:hover {
          transform: scale(1.1);
        }
        .ai-copilot-drawer {
          position: fixed;
          top: 105px;
          right: 0;
          height: calc(100vh - 105px);
          width: 420px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          box-shadow: -5px 0 25px rgba(0,0,0,0.2);
          z-index: 10000;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        /* Premium Nav Links styles inside Sidebar */
        .premium-nav-link {
          transition: all 0.2s ease-in-out;
          color: #4b5563 !important;
          font-weight: 500;
          border-left: 4px solid transparent !important;
          border-radius: 0 8px 8px 0 !important;
          margin-bottom: 8px;
          text-decoration: none;
          background: transparent;
        }
        .premium-nav-link:hover {
          background: rgba(37, 99, 235, 0.04) !important;
          color: #2563eb !important;
        }
        .premium-nav-link.active-link {
          background: rgba(37, 99, 235, 0.08) !important;
          color: #2563eb !important;
          font-weight: 600;
          border-left: 4px solid #2563eb !important;
        }
        .premium-nav-link i {
          transition: transform 0.2s ease;
        }
        .premium-nav-link:hover i {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
