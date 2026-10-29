import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Hospital, Department } from '../types';

interface PatientListItem {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  metadata: {
    mobile: string;
    age: number | null;
    gender: string;
    bloodGroup: string;
    address: string;
    emergencyContact: string;
  };
}

interface DoctorListItem {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  metadata: {
    specialization: string;
    experience: number;
    fees: number;
    department: string;
    isVerified: boolean;
  };
}

interface PolicyListItem {
  _id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  totalChunks: number;
  createdAt: string;
}

interface AiSettingsData {
  _id?: string;
  hospitalName: string;
  address: string;
  emergencyPhone: string;
  supportEmail: string;
  operatingHours: string;
  botPersonality: string;
  welcomeGreeting: string;
  outOfScopeRules: string;
  customInstructions: string;
  updatedAt?: string;
}

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'doctors' | 'patients' | 'hospitals' | 'departments' | 'policies' | 'ai-settings'>('analytics');
  
  // Databases lists
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [policies, setPolicies] = useState<PolicyListItem[]>([]);
  
  // AI Assistant Settings State
  const [aiSettings, setAiSettings] = useState<AiSettingsData>({
    hospitalName: 'Amar Raho Hospital',
    address: 'Plot 404, Yamaraj Bypass Road, Near Swarg Lok U-Turn, Narak-Pur',
    emergencyPhone: '+91 98765-AMAR-1',
    supportEmail: 'support@amarraho.com',
    operatingHours: 'Monday to Friday, 09:00 AM to 12:00 PM',
    botPersonality: 'polite, empathetic, concise, and professional',
    welcomeGreeting: 'Welcome to Amar Raho Hospital! I am your AI Support & Navigational Guide. How can I help you today? You can ask me about our doctors, specializations, departments, timings, or online appointment booking!',
    outOfScopeRules: `You MUST STRICTLY REFUSE to answer questions unrelated to health, medicine, doctors, appointments, hospital policies, or hospital services.\nThis includes:\n- Computer programming, software development, web design, networking, APIs, or databases.\n- General trivia, pop culture, movies, music, sports, or gaming.\n- Mathematics, homework, finance, cryptocurrency, or politics.\nMandatory Refusal response:\n"I am the dedicated AI Assistant for Amar Raho Hospital. I specialize exclusively in healthcare, our clinical departments, doctor appointments, and hospital services. I cannot assist with technical or non-medical topics. Please let me know how I can assist with your health or hospital visits!"`,
    customInstructions: '',
  });
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  // Loading & Toast
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Forms state
  const [docForm, setDocForm] = useState({ name: '', email: '', password: '', specialization: '', experience: '', fees: '', department: '' });
  const [hospForm, setHospForm] = useState({ name: '', address: '', phone: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [policyForm, setPolicyForm] = useState({ title: '', category: 'General' });
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [uploadingPolicy, setUploadingPolicy] = useState(false);

  // Patient Profile Edit Modal state
  const [editingPatient, setEditingPatient] = useState<PatientListItem | null>(null);
  const [patForm, setPatForm] = useState({ mobile: '', age: '', gender: '', bloodGroup: '', address: '', emergencyContact: '' });

  const triggerToast = (type: 'success' | 'danger', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statRes = await axios.get(`${API_BASE_URL}/admin/stats`, { headers });
      setStats(statRes.data.stats);

      // Users
      const userRes = await axios.get(`${API_BASE_URL}/admin/users`, { headers });
      setUsers(userRes.data.data);

      // Doctors
      const docRes = await axios.get(`${API_BASE_URL}/admin/doctors`, { headers });
      setDoctors(docRes.data.data);

      // Patients
      const patRes = await axios.get(`${API_BASE_URL}/admin/patients`, { headers });
      setPatients(patRes.data.data);

      // Hospitals
      const hospRes = await axios.get(`${API_BASE_URL}/admin/hospitals`, { headers });
      setHospitals(hospRes.data.data);

      // Departments
      const deptRes = await axios.get(`${API_BASE_URL}/admin/departments`, { headers });
      setDepartments(deptRes.data.data);

      // Hospital Policies (RAG Vector Store)
      const polRes = await axios.get(`${API_BASE_URL}/admin/policies`, { headers });
      setPolicies(polRes.data.data);

      // AI Assistant Settings
      try {
        const aiRes = await axios.get(`${API_BASE_URL}/admin/ai-settings`, { headers });
        if (aiRes.data && aiRes.data.data) {
          setAiSettings(aiRes.data.data);
        }
      } catch (aiErr) {
        console.warn('Could not load AI Assistant settings:', aiErr);
      }

    } catch (err) {
      console.error('Failed to load admin dashboard tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save AI Settings
  const handleAiSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAiSettings(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const res = await axios.put(`${API_BASE_URL}/admin/ai-settings`, aiSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.data) {
        setAiSettings(res.data.data);
      }
      triggerToast('success', 'AI Assistant settings & system prompt directives updated successfully!');
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed to update AI Assistant settings.');
    } finally {
      setSavingAiSettings(false);
    }
  };

  // Doctors activations
  const toggleDoctorVerify = async (userId: string, isVerified: boolean) => {
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.put(`${API_BASE_URL}/admin/doctors/${userId}/verify`, { isVerified }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(doctors.map(d => d._id === userId ? { ...d, metadata: { ...d.metadata, isVerified } } : d));
      triggerToast('success', `Doctor account verification status updated.`);
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed to update verification status.');
    }
  };

  // Create Doctor Account
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.post(`${API_BASE_URL}/admin/doctors`, {
        name: docForm.name,
        email: docForm.email,
        password: docForm.password,
        specialization: docForm.specialization,
        experience: Number(docForm.experience),
        fees: Number(docForm.fees),
        department: docForm.department
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Doctor account registered and verified!');
      setDocForm({ name: '', email: '', password: '', specialization: '', experience: '', fees: '', department: '' });
      loadData();
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed to create Doctor account.');
    }
  };

  // Launch Patient Profile editor modal
  const openPatientEdit = (pat: PatientListItem) => {
    setEditingPatient(pat);
    setPatForm({
      mobile: pat.metadata?.mobile || '',
      age: pat.metadata?.age ? String(pat.metadata.age) : '',
      gender: pat.metadata?.gender || '',
      bloodGroup: pat.metadata?.bloodGroup || '',
      address: pat.metadata?.address || '',
      emergencyContact: pat.metadata?.emergencyContact || ''
    });
  };

  // Save Patient Profile details
  const savePatientProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.put(`${API_BASE_URL}/admin/patients/${editingPatient._id}`, {
        mobile: patForm.mobile,
        age: patForm.age ? Number(patForm.age) : null,
        gender: patForm.gender,
        bloodGroup: patForm.bloodGroup,
        address: patForm.address,
        emergencyContact: patForm.emergencyContact
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Patient clinical profile details saved successfully.');
      setEditingPatient(null);
      loadData();
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed saving patient details.');
    }
  };

  // Hospital management
  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.post(`${API_BASE_URL}/admin/hospitals`, hospForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Hospital branch added.');
      setHospForm({ name: '', address: '', phone: '' });
      loadData();
    } catch (err: any) {
      triggerToast('danger', 'Failed to add hospital branch.');
    }
  };

  const deleteHospital = async (id: string) => {
    if (!window.confirm('Delete hospital branch?')) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.delete(`${API_BASE_URL}/admin/hospitals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Hospital branch deleted.');
      loadData();
    } catch (err) {
      triggerToast('danger', 'Failed to delete hospital.');
    }
  };

  // Department management
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.post(`${API_BASE_URL}/admin/departments`, deptForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Department registered.');
      setDeptForm({ name: '', description: '' });
      loadData();
    } catch (err: any) {
      triggerToast('danger', 'Failed to register department.');
    }
  };

  const deleteDept = async (id: string) => {
    if (!window.confirm('Delete department?')) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.delete(`${API_BASE_URL}/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Department deleted.');
      loadData();
    } catch (err) {
      triggerToast('danger', 'Failed to delete department.');
    }
  };

  // Delete User credentials
  const deleteUserAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will remove all associated profiles and appointments.')) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'User account deleted successfully.');
      loadData();
    } catch (err) {
      triggerToast('danger', 'Failed to delete user.');
    }
  };

  // Upload and vectorize Hospital Policy PDF (Dual-write to MongoDB & PostgreSQL)
  const handlePolicyUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyFile) {
      triggerToast('danger', 'Please select a PDF file.');
      return;
    }
    setUploadingPolicy(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const formData = new FormData();
      formData.append('title', policyForm.title);
      formData.append('category', policyForm.category);
      formData.append('file', policyFile);

      const res = await axios.post(`${API_BASE_URL}/admin/policies`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      triggerToast('success', res.data.message || 'Policy uploaded and vector indexed!');
      setPolicyForm({ title: '', category: 'General' });
      setPolicyFile(null);
      const fileInput = document.getElementById('policyFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadData();
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed to upload and parse policy PDF.');
    } finally {
      setUploadingPolicy(false);
    }
  };

  // Delete policy and associated vector chunks from both databases
  const deletePolicy = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete policy "${title}"? This will remove all vector embeddings from both MongoDB and PostgreSQL.`)) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.delete(`${API_BASE_URL}/admin/policies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast('success', 'Policy and vector chunks deleted from MongoDB & PostgreSQL.');
      loadData();
    } catch (err: any) {
      triggerToast('danger', err.response?.data?.message || 'Failed to delete policy.');
    }
  };

  return (
    <div className="container-xxl py-5">
      <div className="container">
        
        {toast && (
          <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-4 shadow-lg`} style={{ zIndex: 1050, minWidth: '300px' }}>
            <i className="fa fa-info-circle me-2"></i> {toast.text}
          </div>
        )}

        <div className="row g-5">
          
          {/* Left Sidebar Layout */}
          <div className="col-lg-3 col-md-4">
            <div className="bg-light rounded-3 p-4 border shadow-sm text-center">
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <h3 className="m-0 text-white">AD</h3>
              </div>
              <h5 className="mb-1 fw-bold text-dark">Amar Raho Hospital</h5>
              <p className="text-muted small mb-4">Director Portal</p>
              
              <div className="nav flex-column nav-pills text-start">
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'analytics' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('analytics'); setEditingPatient(null); }}
                >
                  <i className="fa fa-chart-pie me-2"></i> Analytics
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'users' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('users'); setEditingPatient(null); }}
                >
                  <i className="fa fa-users-cog me-2"></i> Users
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'doctors' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('doctors'); setEditingPatient(null); }}
                >
                  <i className="fa fa-user-md me-2"></i> Doctors
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'patients' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('patients'); setEditingPatient(null); }}
                >
                  <i className="fa fa-id-card me-2"></i> Patients
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'hospitals' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('hospitals'); setEditingPatient(null); }}
                >
                  <i className="fa fa-hospital me-2"></i> Hospitals
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'departments' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('departments'); setEditingPatient(null); }}
                >
                  <i className="fa fa-folder-open me-2"></i> Departments
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'policies' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('policies'); setEditingPatient(null); }}
                >
                  <i className="fa fa-file-pdf me-2"></i> Hospital Policies
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'ai-settings' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('ai-settings'); setEditingPatient(null); }}
                >
                  <i className="fa fa-robot me-2"></i> AI Assistant Settings
                </button>
                <button 
                  className="nav-link border-0 text-start text-danger py-3 bg-transparent rounded mt-4"
                  onClick={logout}
                >
                  <i className="fa fa-sign-out-alt me-2"></i> Log Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Panels */}
          <div className="col-lg-9 col-md-8">
            <div className="bg-white p-4 border rounded-3 shadow-sm min-vh-50">
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Loading hospital metadata...</p>
                </div>
              ) : editingPatient ? (
                
                /* ================= EDIT PATIENT PROFILE SUB-FORM ================= */
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold m-0 text-dark">Edit Patient Medical Card</h3>
                    <button className="btn btn-outline-secondary" onClick={() => setEditingPatient(null)}>Cancel</button>
                  </div>

                  <form onSubmit={savePatientProfile}>
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="bg-light p-3 rounded">
                          <h6 className="fw-bold text-dark mb-1">Patient User: {editingPatient.name}</h6>
                          <small className="text-muted">{editingPatient.email}</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Mobile Number</label>
                        <input type="text" className="form-control py-3" value={patForm.mobile} onChange={(e) => setPatForm({ ...patForm, mobile: e.target.value })} required />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Age</label>
                        <input type="number" className="form-control py-3" value={patForm.age} onChange={(e) => setPatForm({ ...patForm, age: e.target.value })} required />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Gender</label>
                        <select className="form-select py-3" value={patForm.gender} onChange={(e) => setPatForm({ ...patForm, gender: e.target.value })} required>
                          <option value="">Choose</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Blood Group</label>
                        <select className="form-select py-3" value={patForm.bloodGroup} onChange={(e) => setPatForm({ ...patForm, bloodGroup: e.target.value })}>
                          <option value="">Select Blood Group</option>
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
                        <label className="form-label fw-bold">Emergency Contact Phone</label>
                        <input type="text" className="form-control py-3" value={patForm.emergencyContact} onChange={(e) => setPatForm({ ...patForm, emergencyContact: e.target.value })} />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold">Address</label>
                        <textarea className="form-control" rows={3} value={patForm.address} onChange={(e) => setPatForm({ ...patForm, address: e.target.value })} required></textarea>
                      </div>
                      <div className="col-12 mt-4">
                        <button className="btn btn-primary px-5 py-3 fw-bold rounded shadow-sm" type="submit">
                          Save Patient Profile details
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* TAB 1: ANALYTICS CARDS */}
                  {activeTab === 'analytics' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Hospital Directory Analytics</h3>
                      <div className="row g-4">
                        
                        <div className="col-md-4">
                          <div className="card border-0 bg-primary text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalUsers || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-id-card me-2"></i>Total Patients</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-success text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalDoctors || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-user-md me-2"></i>Verified Doctors</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-info text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalAppointments || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-calendar-check me-2"></i>Total Consultations</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-warning text-dark p-4 shadow-sm rounded-3">
                            <h2 className="text-dark fw-bold mb-1">{stats?.totalHospitals || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-hospital me-2"></i>Locations Branches</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-danger text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalDepartments || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-folder-open me-2"></i>Clinical Departments</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-secondary text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalContacts || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-envelope me-2"></i>Support Feedback</p>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card border-0 bg-dark text-white p-4 shadow-sm rounded-3">
                            <h2 className="text-white fw-bold mb-1">{stats?.totalPolicies || 0}</h2>
                            <p className="mb-0 small"><i className="fa fa-file-pdf me-2"></i>Hospital Policy</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: USERS MANAGEMENTS */}
                  {activeTab === 'users' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Registered Accounts Credentials</h3>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Account Role</th>
                              <th>Registered Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id}>
                                <td className="fw-bold text-dark">{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                  <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'doctor' ? 'bg-success' : 'bg-primary'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td>{new Date(u.createdAt || '').toLocaleDateString()}</td>
                                <td>
                                  {u.role !== 'admin' && (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUserAccount(u.id)}>
                                      Delete Account
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DOCTORS CONFIG AND ADDITION */}
                  {activeTab === 'doctors' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Manage Hospital Doctors</h3>
                      
                      <div className="card bg-light border-0 shadow-sm p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="fa fa-user-plus text-primary me-2"></i>Register New Doctor Account</h5>
                        <form onSubmit={handleDocSubmit}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <input type="text" className="form-control" placeholder="Physician Full Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required />
                            </div>
                            <div className="col-md-6">
                              <input type="email" className="form-control" placeholder="Doctor Login Email" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                              <input type="password" className="form-control" placeholder="Login Password (min 6)" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                              <input type="text" className="form-control" placeholder="Specialization (e.g. Cardiologist)" value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })} />
                            </div>
                            <div className="col-md-2">
                              <input type="number" className="form-control" placeholder="Exp (Years)" value={docForm.experience} onChange={(e) => setDocForm({ ...docForm, experience: e.target.value })} />
                            </div>
                            <div className="col-md-2">
                              <input type="number" className="form-control" placeholder="Fees (INR)" value={docForm.fees} onChange={(e) => setDocForm({ ...docForm, fees: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                              <select className="form-select" value={docForm.department} onChange={(e) => setDocForm({ ...docForm, department: e.target.value })} required>
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                  <option key={d._id} value={d.name}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <button className="btn btn-primary w-100 fw-bold" type="submit">Create Doctor Account</button>
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Doctor</th>
                              <th>Department</th>
                              <th>Consulting Fees</th>
                              <th>Availability</th>
                              <th>Verified</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doctors.map((doc) => (
                              <tr key={doc._id}>
                                <td>
                                  <div className="fw-bold text-dark">Dr. {doc.name}</div>
                                  <small className="text-muted">{doc.email} | Spec: {doc.metadata?.specialization}</small>
                                </td>
                                <td>{doc.metadata?.department}</td>
                                <td>₹ {doc.metadata?.fees}</td>
                                <td>
                                  <span className="badge bg-light text-dark">
                                    {doc.metadata?.experience} Years Exp
                                  </span>
                                </td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input 
                                      className="form-check-input" 
                                      type="checkbox" 
                                      checked={doc.metadata?.isVerified || false}
                                      onChange={(e) => toggleDoctorVerify(doc._id, e.target.checked)}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PATIENTS MANAGEMENTS */}
                  {activeTab === 'patients' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Manage Registered Patients</h3>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Patient Name</th>
                              <th>Age / Gender</th>
                              <th>Blood Group</th>
                              <th>Address Details</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patients.map((p) => (
                              <tr key={p._id}>
                                <td>
                                  <div className="fw-bold text-dark text-capitalize">{p.name}</div>
                                  <small className="text-muted">{p.email} | Mobile: {p.metadata?.mobile || 'Not set'}</small>
                                </td>
                                <td>{p.metadata?.age ? `${p.metadata.age} Yrs` : 'Not set'} / {p.metadata?.gender || 'Not set'}</td>
                                <td><span className="badge bg-danger">{p.metadata?.bloodGroup || 'Not set'}</span></td>
                                <td style={{ maxWidth: '200px', wordBreak: 'break-all' }}>{p.metadata?.address || 'Address missing'}</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => openPatientEdit(p)}>
                                    <i className="fa fa-edit me-1"></i> Card
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: HOSPITALS CONFIG */}
                  {activeTab === 'hospitals' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Configure Hospital Locations</h3>
                      
                      <div className="card bg-light border-0 shadow-sm p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="fa fa-plus-circle text-primary me-2"></i>Add Hospital Branch</h5>
                        <form onSubmit={handleHospitalSubmit}>
                          <div className="row g-3">
                            <div className="col-md-4">
                              <input type="text" className="form-control" placeholder="Hospital Branch Name" value={hospForm.name} onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })} required />
                            </div>
                            <div className="col-md-5">
                              <input type="text" className="form-control" placeholder="Address, City" value={hospForm.address} onChange={(e) => setHospForm({ ...hospForm, address: e.target.value })} required />
                            </div>
                            <div className="col-md-3">
                              <input type="text" className="form-control" placeholder="Contact Phone" value={hospForm.phone} onChange={(e) => setHospForm({ ...hospForm, phone: e.target.value })} required />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button className="btn btn-primary px-4" type="submit">Add Branch</button>
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Hospital Location</th>
                              <th>Address</th>
                              <th>Contact</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hospitals.map((h) => (
                              <tr key={h._id}>
                                <td className="fw-bold text-dark">{h.name}</td>
                                <td>{h.address}</td>
                                <td>{h.phone}</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteHospital(h._id)}>
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DEPARTMENTS CONFIG */}
                  {activeTab === 'departments' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Configure Hospital Departments</h3>
                      
                      <div className="card bg-light border-0 shadow-sm p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="fa fa-folder-plus text-primary me-2"></i>Register Department</h5>
                        <form onSubmit={handleDeptSubmit}>
                          <div className="row g-3">
                            <div className="col-md-4">
                              <input type="text" className="form-control" placeholder="Department Name (e.g. Cardiology)" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required />
                            </div>
                            <div className="col-md-8">
                              <input type="text" className="form-control" placeholder="Short description of department services..." value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} required />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button className="btn btn-primary px-4" type="submit">Register Department</button>
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Department</th>
                              <th>Description Details</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departments.map((d) => (
                              <tr key={d._id}>
                                <td className="fw-bold text-dark">{d.name}</td>
                                <td>{d.description}</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteDept(d._id)}>
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: HOSPITAL POLICIES (RAG VECTOR STORE) */}
                  {activeTab === 'policies' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                          <h3 className="fw-bold m-0 text-dark">Hospital Policies & RAG Knowledge Base</h3>
                          <p className="text-muted small mb-0">Upload official PDF policies. Text is automatically parsed, semantically chunked, vector-embedded via Gemini, and synchronized across <strong>MongoDB & PostgreSQL</strong> for live AI chat grounding.</p>
                        </div>
                        <span className="badge bg-primary px-3 py-2 fs-6">
                          <i className="fa fa-database me-1"></i> Dual-Database RAG
                        </span>
                      </div>
                      
                      <div className="card bg-light border-0 shadow-sm p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="fa fa-file-upload text-primary me-2"></i>Upload Hospital Policy (PDF)</h5>
                        <form onSubmit={handlePolicyUpload}>
                          <div className="row g-3">
                            <div className="col-md-5">
                              <label className="form-label fw-bold small">Policy Title</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="e.g. ICU Visiting Hours & Patient Safety" 
                                value={policyForm.title} 
                                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })} 
                                required 
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label fw-bold small">Category</label>
                              <select 
                                className="form-select" 
                                value={policyForm.category} 
                                onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                              >
                                <option value="General">General Policy</option>
                                <option value="Visiting Hours">Visiting Hours</option>
                                <option value="Insurance & Billing">Insurance & Billing</option>
                                <option value="Emergency & ICU">Emergency & ICU</option>
                                <option value="Admission & Discharge">Admission & Discharge</option>
                                <option value="Patient Rights">Patient Rights</option>
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-bold small">Select PDF File (max 5MB)</label>
                              <input 
                                id="policyFileInput"
                                type="file" 
                                className="form-control" 
                                accept=".pdf,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setPolicyFile(e.target.files[0]);
                                  }
                                }} 
                                required 
                              />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button 
                                className="btn btn-primary px-4 py-2" 
                                type="submit"
                                disabled={uploadingPolicy}
                              >
                                {uploadingPolicy ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Extracting & Vectorizing...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-cloud-upload-alt me-2"></i>
                                    Upload & Vectorize PDF
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Policy Title</th>
                              <th>Category</th>
                              <th>Vector Chunks</th>
                              <th>File Size</th>
                              <th>Uploaded On</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {policies.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                  <i className="fa fa-folder-open fa-2x mb-2 d-block"></i>
                                  No hospital policies uploaded yet. Upload a PDF above to enable AI RAG knowledge.
                                </td>
                              </tr>
                            ) : (
                              policies.map((p) => (
                                <tr key={p._id}>
                                  <td className="fw-bold text-dark">
                                    <i className="fa fa-file-pdf text-danger me-2"></i>
                                    {p.title}
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary">{p.category}</span>
                                  </td>
                                  <td>
                                    <span className="badge bg-info text-dark">
                                      <i className="fa fa-cubes me-1"></i> {p.totalChunks} Chunks
                                    </span>
                                  </td>
                                  <td>
                                    {(p.fileSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td>
                                    {new Date(p.createdAt).toLocaleDateString()}
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-danger" 
                                      onClick={() => deletePolicy(p._id, p.title)}
                                      title="Delete policy and chunks from both MongoDB and PostgreSQL"
                                    >
                                      <i className="fa fa-trash-alt me-1"></i> Delete
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ================= AI ASSISTANT SETTINGS & PROMPT EDITOR ================= */}
                  {activeTab === 'ai-settings' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                        <div>
                          <h3 className="fw-bold m-0 text-dark">
                            <i className="fa fa-robot text-primary me-2"></i>
                            AI Assistant & System Prompt Configuration
                          </h3>
                          <p className="text-muted small m-0 mt-1">
                            Customize hospital profile, emergency line, bot persona, out-of-scope refusal rules, and clinic directives. All changes are stored in MongoDB and applied in real time to the live AI engine.
                          </p>
                        </div>
                        {aiSettings.updatedAt && (
                          <span className="badge bg-light text-muted border px-3 py-2">
                            <i className="fa fa-history me-1"></i>
                            Last Updated: {new Date(aiSettings.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleAiSettingsSubmit}>
                        {/* 1. Core Hospital Details */}
                        <div className="card border mb-4 shadow-none">
                          <div className="card-header bg-light py-3">
                            <h6 className="m-0 fw-bold text-dark">
                              <i className="fa fa-hospital-alt text-primary me-2"></i>
                              Core Hospital Identity & Contact Info
                            </h6>
                            <small className="text-muted">Injected dynamically into the AI agent identity and appointment confirmations.</small>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-bold small text-muted">Hospital Official Name</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={aiSettings.hospitalName}
                                  onChange={(e) => setAiSettings({ ...aiSettings, hospitalName: e.target.value })}
                                  placeholder="e.g. Amar Raho Hospital"
                                  required
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold small text-muted">Operating Hours / OPD Timings</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={aiSettings.operatingHours}
                                  onChange={(e) => setAiSettings({ ...aiSettings, operatingHours: e.target.value })}
                                  placeholder="e.g. Monday to Friday, 09:00 AM to 12:00 PM"
                                  required
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold small text-muted">Emergency & Helpline Phone</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={aiSettings.emergencyPhone}
                                  onChange={(e) => setAiSettings({ ...aiSettings, emergencyPhone: e.target.value })}
                                  placeholder="e.g. +91 98765-AMAR-1"
                                  required
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold small text-muted">Official Support Email</label>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={aiSettings.supportEmail}
                                  onChange={(e) => setAiSettings({ ...aiSettings, supportEmail: e.target.value })}
                                  placeholder="e.g. support@amarraho.com"
                                  required
                                />
                              </div>
                              <div className="col-12">
                                <label className="form-label fw-bold small text-muted">Hospital Physical Address</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={aiSettings.address}
                                  onChange={(e) => setAiSettings({ ...aiSettings, address: e.target.value })}
                                  placeholder="e.g. Plot 404, Yamaraj Bypass Road, Near Swarg Lok U-Turn, Narak-Pur"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Persona & Welcome Greeting */}
                        <div className="card border mb-4 shadow-none">
                          <div className="card-header bg-light py-3">
                            <h6 className="m-0 fw-bold text-dark">
                              <i className="fa fa-comment-dots text-primary me-2"></i>
                              AI Personality & Welcome Greeting
                            </h6>
                            <small className="text-muted">Controls how the AI assistant greets patients and communicates.</small>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-12">
                                <label className="form-label fw-bold small text-muted">Persona & Tone of Voice</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={aiSettings.botPersonality}
                                  onChange={(e) => setAiSettings({ ...aiSettings, botPersonality: e.target.value })}
                                  placeholder="e.g. polite, empathetic, concise, and professional"
                                  required
                                />
                              </div>
                              <div className="col-12">
                                <label className="form-label fw-bold small text-muted">Welcome Greeting (Opening message to patients)</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={aiSettings.welcomeGreeting}
                                  onChange={(e) => setAiSettings({ ...aiSettings, welcomeGreeting: e.target.value })}
                                  placeholder="Welcome to Amar Raho Hospital! I am your AI Support & Navigational Guide..."
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Out-of-Scope Domain Boundaries */}
                        <div className="card border mb-4 shadow-none">
                          <div className="card-header bg-light py-3">
                            <h6 className="m-0 fw-bold text-dark">
                              <i className="fa fa-shield-alt text-danger me-2"></i>
                              Out-of-Scope Domain Boundary & Refusal Directives
                            </h6>
                            <small className="text-muted">Strict guardrails ensuring the AI refuses non-healthcare topics (programming, trivia, entertainment, etc.).</small>
                          </div>
                          <div className="card-body">
                            <label className="form-label fw-bold small text-muted">Refusal Directives & Strict Subject Restrictions</label>
                            <textarea
                              className="form-control font-monospace small"
                              rows={5}
                              value={aiSettings.outOfScopeRules}
                              onChange={(e) => setAiSettings({ ...aiSettings, outOfScopeRules: e.target.value })}
                              required
                            />
                            <div className="form-text small text-muted mt-2">
                              <i className="fa fa-info-circle me-1"></i>
                              Hospital policies, doctor rosters, and appointment booking flow remain protected and will always be accessible regardless of refusal text.
                            </div>
                          </div>
                        </div>

                        {/* 4. Custom Directives */}
                        <div className="card border mb-4 shadow-none">
                          <div className="card-header bg-light py-3">
                            <h6 className="m-0 fw-bold text-dark">
                              <i className="fa fa-pencil-alt text-primary me-2"></i>
                              Custom Operational Directives & Special Clinic Rules
                            </h6>
                            <small className="text-muted">Add temporary announcements, doctor schedules, specific triage tips, or clinic notices.</small>
                          </div>
                          <div className="card-body">
                            <label className="form-label fw-bold small text-muted">Custom Instructions (Optional)</label>
                            <textarea
                              className="form-control"
                              rows={4}
                              value={aiSettings.customInstructions}
                              onChange={(e) => setAiSettings({ ...aiSettings, customInstructions: e.target.value })}
                              placeholder="e.g. Note: Dr. Arjun Sharma will be on surgical rounds between 11 AM - 12 PM this Wednesday. Remind cardiac patients to bring their ECG reports."
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-between align-items-center pt-2">
                          <div className="text-muted small">
                            <i className="fa fa-bolt text-warning me-1"></i>
                            Saved changes reflect immediately for all new AI chats without restarting the server.
                          </div>
                          <button
                            type="submit"
                            className="btn btn-primary px-4 py-2 fw-bold"
                            disabled={savingAiSettings}
                          >
                            {savingAiSettings ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Saving Settings...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-save me-2"></i>
                                Save AI Assistant Settings
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;