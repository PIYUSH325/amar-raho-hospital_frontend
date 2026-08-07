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

  return (
    <div className="container-xxl py-5">
      <div className="container">
        
        {/* Toast Notifier */}
        {toast && (
          <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-4 shadow-lg`} style={{ zIndex: 1050, minWidth: '300px' }}>
            <i className={`fa ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
            {toast.text}
          </div>
        )}

        <div className="row g-5">
          
          {/* Left Sidebar Menu */}
          <div className="col-lg-3 col-md-4">
            <div className="bg-light rounded-3 p-4 border shadow-sm text-center">
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <h3 className="m-0 text-white">{user?.name ? user.name.slice(0,2).toUpperCase() : 'DR'}</h3>
              </div>
              <h5 className="mb-1 fw-bold text-dark">Dr. {user?.name}</h5>
              <p className="text-muted small mb-0">{doctorProfile?.specialization || 'Department Doctor'}</p>
              <span className={`badge ${doctorProfile?.isVerified ? 'bg-success' : 'bg-warning'} mb-4`}>
                {doctorProfile?.isVerified ? 'Verified Account' : 'Pending Verification'}
              </span>
              
              <div className="nav flex-column nav-pills text-start">
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'today' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('today'); setSelectedApp(null); setSelectedPatientHistory(null); }}
                >
                  <i className="fa fa-user-clock me-2"></i> Today's Patients
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'appointments' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('appointments'); setSelectedApp(null); setSelectedPatientHistory(null); }}
                >
                  <i className="fa fa-calendar-alt me-2"></i> Manage Bookings
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'history' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('history'); setSelectedApp(null); setSelectedPatientHistory(null); }}
                >
                  <i className="fa fa-notes-medical me-2"></i> Patient History
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'profile' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('profile'); setSelectedApp(null); setSelectedPatientHistory(null); }}
                >
                  <i className="fa fa-user-md me-2"></i> Profile Settings
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
                  <p className="mt-2 text-muted">Loading doctor portal databases...</p>
                </div>
              ) : selectedApp ? (
                
                /* ================= ACTIVE CHECKUP CONSULTATION PANEL ================= */
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold m-0 text-dark">Patient Checkup & EMR</h3>
                    <button className="btn btn-outline-secondary" onClick={() => setSelectedApp(null)}>
                      Back to List
                    </button>
                  </div>

                  <form onSubmit={submitCheckup} onKeyDown={handleKeyDown}>
                    <div className="card bg-light border-0 shadow-sm p-3 mb-4">
                      <h5 className="fw-bold mb-3"><i className="fa fa-user-shield text-primary me-2"></i>Verify & Set Patient Profile</h5>
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
                    <h5 className="fw-bold mb-3"><i className="fa fa-file-medical text-primary me-2"></i>Consultation Records</h5>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Diagnosis / Condition *</label>
                        <input type="text" className="form-control py-2" placeholder="e.g., Acute Migraine, Viral Fever" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Treatment Plan / Recommendation *</label>
                        <input type="text" className="form-control py-2" placeholder="e.g., Rest 3 days, avoid screen time" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Clinical Notes</label>
                        <textarea className="form-control" rows={2} placeholder="Optional physician checkup findings..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                      </div>
                    </div>

                    {/* Prescription Builder */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold m-0"><i className="fa fa-prescription-bottle-alt text-success me-2"></i>Issue Medicines (Rx)</h5>
                      <button type="button" className="btn btn-sm btn-outline-success" onClick={handleAddMedicine}>
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
                          <input type="text" className="form-control" placeholder="e.g., 1 Tab" value={med.dosage} onChange={(e) => handleMedChange(index, 'dosage', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className="small text-muted">Frequency</label>
                          <input type="text" className="form-control" placeholder="e.g., Twice daily (1-0-1)" value={med.frequency} onChange={(e) => handleMedChange(index, 'frequency', e.target.value)} />
                        </div>
                        <div className="col-md-2">
                          <label className="small text-muted">Duration</label>
                          <input type="text" className="form-control" placeholder="e.g., 5 Days" value={med.duration} onChange={(e) => handleMedChange(index, 'duration', e.target.value)} />
                        </div>
                        <div className="col-md-1 text-end">
                          {medicines.length > 1 && (
                            <button type="button" className="btn btn-outline-danger btn-sm mb-1" onClick={() => handleRemoveMedicine(index)}>
                              <i className="fa fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="col-12 mt-3">
                      <label className="form-label fw-semibold">Special Instructions for Prescription</label>
                      <input type="text" className="form-control py-2" placeholder="e.g., Take after food" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                    </div>
                                        {/* Patient Uploaded Reports Section */}
                    <div className="col-12 mt-4 bg-light p-3 rounded border">
                      <h6 className="fw-bold mb-2 text-danger"><i className="fa fa-file-pdf me-2"></i>Patient Uploaded Test Reports (Lal PathLabs etc.)</h6>
                      {(() => {
                        const activePat = patients.find(p => p._id === selectedApp?.user);
                        if (!activePat?.metadata?.reports || activePat.metadata.reports.length === 0) {
                          return <small className="text-muted d-block">No test reports uploaded by this patient.</small>;
                        }
                        return (
                          <div className="list-group list-group-flush mt-2">
                            {activePat.metadata.reports.map((rep: any) => (
                              <a 
                                key={rep._id} 
                                href={`${API_BASE_URL.replace('/api', '')}${rep.filePath}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="list-group-item list-group-item-action py-2 d-flex justify-content-between align-items-center bg-transparent border-0 small px-0"
                              >
                                <span><i className="fa fa-file-medical me-2 text-primary"></i>{rep.title}</span>
                                <span className="badge bg-primary px-3 py-2">View File</span>
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-12 mt-4 pt-3 border-top">
                      <button className="btn btn-success px-5 py-3 fw-bold rounded shadow-sm" type="submit">
                        Complete Consultation & Check out
                      </button>
                    </div>

                  </form>
                </div>
              ) : selectedPatientHistory ? (
                
                /* ================= PATIENT HISTORY CLINICAL DETAILS VIEW ================= */
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold m-0 text-dark">Medical File: {selectedPatientHistory.name}</h3>
                    <button className="btn btn-outline-secondary" onClick={() => setSelectedPatientHistory(null)}>
                      Back to Patients
                    </button>
                  </div>

                  {loadingHistoryDetails ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                    </div>
                  ) : editingPrescriptionId ? (
                    <div>
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
                            <div className="col-md-1 text-end">
                              {medicines.length > 1 && (
                                <button type="button" className="btn btn-outline-danger btn-sm mb-1" onClick={() => handleRemoveMedicine(index)}>
                                  <i className="fa fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="col-12 mt-3 text-end">
                          <button type="button" className="btn btn-sm btn-outline-success px-3" onClick={handleAddMedicine}>
                            + Add Medicine
                          </button>
                        </div>

                        <div className="col-12 mt-3">
                          <label className="form-label fw-semibold">Special Instructions</label>
                          <input type="text" className="form-control py-2" placeholder="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                        </div>

                        <div className="col-12 mt-4 pt-3 border-top">
                          <button className="btn btn-primary px-4 py-2 me-2" type="submit">Save Changes</button>
                          <button className="btn btn-outline-secondary px-4 py-2" type="button" onClick={() => setEditingPrescriptionId(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    
                    /* NORMAL CLINICAL VIEW PANEL */
                    <div className="row g-4">
                      
                      {/* Clinical records list */}
                      <div className="col-md-6">
                        <h5 className="fw-bold text-primary mb-3"><i className="fa fa-file-medical me-2"></i>Consultation Checkups</h5>
                        {patientRecords.length === 0 ? (
                          <p className="text-muted bg-light p-3 rounded">No consultation summaries recorded for this patient.</p>
                        ) : (
                          patientRecords.map((rec) => (
                            <div key={rec._id} className="card border shadow-sm mb-3">
                              <div className="card-body">
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="badge bg-light text-dark">Checkup Log</span>
                                  <small className="text-muted">{new Date(rec.visitDate).toLocaleDateString()}</small>
                                </div>
                                <h6 className="fw-bold mb-1">Diagnosis: {rec.diagnosis}</h6>
                                <p className="small text-muted mb-2">Treatment: {rec.treatmentPlan}</p>
                                {rec.notes && <div className="bg-light p-2 small text-muted rounded">Notes: {rec.notes}</div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Prescriptions lists */}
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold text-success m-0"><i className="fa fa-prescription-bottle-alt me-2"></i>Issued Prescriptions (Rx)</h5>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            onClick={startNewPrescription}
                          >
                            <i className="fa fa-plus me-1"></i> Add Rx
                          </button>
                        </div>
                        {patientPrescriptions.length === 0 ? (
                          <p className="text-muted bg-light p-3 rounded">No prescriptions issued for this patient.</p>
                        ) : (
                          patientPrescriptions.map((pres) => {
                            const isUpdated = pres.updatedAt && pres.createdAt !== pres.updatedAt;
                            const isAuthor = typeof pres.doctor === 'object' 
                              ? pres.doctor._id === user?.id 
                              : pres.doctor === user?.id;

                            return (
                              <div key={pres._id} className="card border shadow-sm mb-3">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <span className="badge bg-success mb-1">Prescription Log</span>
                                      <small className="text-muted d-block">Issued: {new Date(pres.createdAt).toLocaleDateString()}</small>
                                      {isUpdated && <small className="text-danger fw-bold d-block">Updated: {new Date(pres.updatedAt).toLocaleDateString()}</small>}
                                    </div>
                                    
                                    {isAuthor && (
                                      <button 
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => startEditingPrescription(pres)}
                                      >
                                        <i className="fa fa-edit me-1"></i> Edit
                                      </button>
                                    )}
                                  </div>

                                  <div className="table-responsive">
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
                                    <div className="bg-light p-2 small text-muted rounded mt-2">
                                      <strong>Instructions:</strong> {pres.instructions}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                                            {/* Patient Uploaded Test Reports in History */}
                      <div className="col-12 mt-4 pt-3 border-top">
                        <h5 className="fw-bold text-danger mb-3"><i className="fa fa-file-pdf me-2"></i>Patient Uploaded Test Reports</h5>
                        {!selectedPatientHistory?.metadata?.reports || selectedPatientHistory.metadata.reports.length === 0 ? (
                          <p className="text-muted bg-light p-3 rounded small m-0">No lab reports uploaded by this patient.</p>
                        ) : (
                          <div className="list-group">
                            {selectedPatientHistory.metadata.reports.map((rep: any) => (
                              <a 
                                key={rep._id} 
                                href={`${API_BASE_URL.replace('/api', '')}${rep.filePath}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
                              >
                                <div>
                                  <h6 className="mb-0 fw-bold text-dark">{rep.title}</h6>
                                  <small className="text-muted">Uploaded on: {new Date(rep.uploadedAt).toLocaleDateString()}</small>
                                </div>
                                <span className="badge bg-light text-dark border px-3 py-2">View Document</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* TAB 1: TODAY'S PATIENTS QUEUE */}
                  {activeTab === 'today' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Today's Patient Consultation Queue</h3>
                      {todayAppointments.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="fa fa-user-check fa-3x mb-3 text-muted"></i>
                          <p>No active scheduled patients in your queue today.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Patient Name</th>
                                <th>Schedule Time</th>
                                <th>Vitals/Problem</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {todayAppointments.map((app) => (
                                <tr key={app._id}>
                                  <td>
                                    <div className="fw-bold text-dark">{app.name}</div>
                                    <small className="text-muted">{app.mobile}</small>
                                  </td>
                                  <td>{app.date} at <span className="fw-semibold">{app.time}</span></td>
                                  <td style={{ maxWidth: '250px', wordBreak: 'break-all' }}>{app.problem}</td>
                                  <td>
                                    <span className={`badge ${app.status === 'Approved' ? 'bg-success' : 'bg-primary'}`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td>
                                    <button className="btn btn-sm btn-primary" onClick={() => startCheckup(app)}>
                                      <i className="fa fa-stethoscope me-1"></i> Checkup
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MANAGE ALL APPOINTMENTS */}
                  {activeTab === 'appointments' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Appointments History Log</h3>
                      {appointments.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="fa fa-calendar-times fa-3x mb-3 text-muted"></i>
                          <p>No appointments recorded on database.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Patient</th>
                                <th>Date / Time</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointments.map((app) => (
                                <tr key={app._id}>
                                  <td>
                                    <div className="fw-bold text-dark">{app.name}</div>
                                    <small className="text-muted">{app.mobile}</small>
                                  </td>
                                  <td>
                                    <div>{app.date}</div>
                                    <small className="text-muted">{app.time}</small>
                                  </td>
                                  <td style={{ maxWidth: '200px', wordBreak: 'break-all' }}>{app.problem}</td>
                                  <td>
                                    <span className={`badge ${app.status === 'Completed' ? 'bg-info' : app.status === 'Approved' ? 'bg-success' : app.status === 'Scheduled' ? 'bg-primary' : 'bg-secondary'}`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td>
                                    {app.status === 'Scheduled' && (
                                      <div className="btn-group btn-group-sm">
                                        <button className="btn btn-success" onClick={() => updateStatus(app._id, 'Approved')}>Approve</button>
                                        <button className="btn btn-danger" onClick={() => updateStatus(app._id, 'Cancelled')}>Cancel</button>
                                      </div>
                                    )}
                                    {app.status === 'Approved' && (
                                      <button className="btn btn-sm btn-outline-primary" onClick={() => startCheckup(app)}>Start Checkup</button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PATIENTS DATABASE HISTORY */}
                  {activeTab === 'history' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Registered Patients Database</h3>
                      {myPatients.length === 0 ? (
                        <p className="text-muted">No patient accounts on file.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Name</th>
                                <th>Age/Gender</th>
                                <th>Blood</th>
                                <th>Contact Details</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {myPatients.map((pat) => (
                                <tr key={pat._id}>
                                  <td>
                                    <div className="fw-bold text-dark text-capitalize">{pat.name}</div>
                                    <small className="text-muted">{pat.email}</small>
                                  </td>
                                  <td>
                                    {pat.metadata?.age ? `${pat.metadata.age} Yrs` : 'Not set'} / {pat.metadata?.gender || 'Not set'}
                                  </td>
                                  <td><span className="badge bg-danger">{pat.metadata?.bloodGroup || 'Not set'}</span></td>
                                  <td>
                                    <div>Phone: {pat.metadata?.mobile || 'Not set'}</div>
                                    <small className="text-muted">Address: {pat.metadata?.address || 'Not set'}</small>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => selectPatientHistory(pat)}
                                    >
                                      <i className="fa fa-folder-open me-1"></i> View EMR & Rx
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: PROFILE SETTINGS */}
                  {activeTab === 'profile' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Physician Profile Settings</h3>
                      <form onSubmit={handleProfileSubmit}>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Specialization Area</label>
                            <input type="text" className="form-control py-3" placeholder="e.g. Cardiology Specialist" value={profileForm.specialization} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })} required />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-bold">Experience (Years)</label>
                            <input type="number" className="form-control py-3" value={profileForm.experience} onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })} required />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-bold">Consultation Fees (INR)</label>
                            <input type="number" className="form-control py-3" value={profileForm.fees} onChange={(e) => setProfileForm({ ...profileForm, fees: e.target.value })} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Medical Department</label>
                            <input type="text" className="form-control py-3" placeholder="Cardiology, Pediatrics, etc." value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} required />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold">Physician Bio Summary</label>
                            <textarea className="form-control" rows={3} placeholder="Write a short summary about your medical practice..." value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}></textarea>
                          </div>
                          
                          <div className="col-12">
                            <label className="form-label fw-bold d-block">Weekly Availability Days</label>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                              const active = profileForm.availability.includes(day);
                              return (
                                <button 
                                  key={day}
                                  type="button" 
                                  className={`btn btn-sm me-2 mb-2 px-3 py-2 ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  onClick={() => toggleDay(day)}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>

                          <div className="col-12 mt-4">
                            <button className="btn btn-primary px-5 py-3 fw-bold rounded shadow-sm" type="submit">
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

        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
