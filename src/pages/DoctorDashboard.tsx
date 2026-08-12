import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Appointment, DoctorProfile, PatientProfile, MedicalRecord, Prescription } from '../types';

interface PatientListItem {
  _id: string;
  name: string;
  email: string;
  metadata: PatientProfile;
}

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'appointments' | 'history' | 'profile'>('today');
  
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

  // Doctor profile settings state
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    experience: '',
    fees: '',
    bio: '',
    department: '',
    availability: [] as string[]
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

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

    } catch (error) {
      console.error('Failed to load portal databases');
    } finally {
      setLoading(false);
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
    } else {
      setPatientMobile(app.mobile || '');
      setPatientAge('');
      setPatientGender('');
      setPatientBloodGroup('');
      setPatientAddress('');
      setPatientEmergency('');
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
        emergencyContact: patientEmergency
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
              <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa fa-envelope text-muted"></i>
              </button>
              <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative" style={{ width: '40px', height: '40px' }}>
                <i className="fa fa-bell text-muted"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', marginTop: '8px', marginLeft: '-8px' }}>
                  {appointments.filter(a => a.status === 'Scheduled').length}
                </span>
              </button>
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
                    <h5 className="fw-bold mb-4 text-dark text-start"><i className="fa fa-calendar-alt text-primary me-2"></i>Consultations & Bookings Hub</h5>
                    {appointments.length === 0 ? (
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
