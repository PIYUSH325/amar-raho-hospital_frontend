import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Appointment, PatientProfile, MedicalRecord, Prescription, DietPlanTask } from '../types';
import { LiveChatBox } from '../components/LiveChatBox';
import { WeeklyDietCalendar } from '../components/WeeklyDietCalendar';


export const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [showChatNotifications, setShowChatNotifications] = useState(false);
  const [unreadChats, setUnreadChats] = useState<string[]>([]);
  const [unreadChatNotifications, setUnreadChatNotifications] = useState<Array<{
    senderId: string;
    senderName: string;
    text: string;
    createdAt: Date;
  }>>([]);
  const [chatAlert, setChatAlert] = useState<{ senderName: string; text: string } | null>(null);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      navigate('/doctor-portal', { replace: true });
    } else if (user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'chats') {
      setActiveTab('chats');
    }
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'records' | 'todo' | 'nutrition' | 'fitness' | 'General Habits' | 'chats'>('bookings');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [todoChecklist, setTodoChecklist] = useState<DietPlanTask[]>([]);
  
  const [reportTitle, setReportTitle] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedDoctorRef, setSelectedDoctorRef] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
  const [chatPartnerId, setChatPartnerId] = useState(''); // Selected Doctor ID


  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Profile
      try {
        const profRes = await axios.get(`${API_BASE_URL}/patients/me`, { headers });
        setProfile(profRes.data.data);
        
        // Fetch checklist & trigger missed task alerts
        try {
          const checkRes = await axios.post(`${API_BASE_URL}/patients/todo/check-missed`, {}, { headers });
          setTodoChecklist(checkRes.data.data || []);
        } catch (err) {
          setTodoChecklist(profRes.data.data?.dietPlan || []);
        }
      } catch (err) {
        console.error('Failed to load profile details');
      }

      // Fetch Bookings
      try {
        const appRes = await axios.get(`${API_BASE_URL}/appointments/my`, { headers });
        setAppointments(appRes.data.data);
      } catch (err) {
        console.error('Failed to load bookings');
      }

      // Fetch Records
      try {
        const recRes = await axios.get(`${API_BASE_URL}/medical-records`, { headers });
        setRecords(recRes.data.data);
      } catch (err) {
        console.error('Failed to load medical records');
      }

      // Fetch Prescriptions
      try {
        const presRes = await axios.get(`${API_BASE_URL}/prescriptions`, { headers });
        setPrescriptions(presRes.data.data);
      } catch (err) {
        console.error('Failed to load prescriptions');
      }

    } catch (error) {
      console.error('Failed loading patient data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const registerUser = () => {
      socket.emit('register', { userId: user.id });
    };

    // Register immediately if already connected
    if (socket.connected) {
      registerUser();
    }

    // Bind to connect event for future reconnections
    socket.on('connect', registerUser);

    // Listen for incoming notifications
    socket.on('receive_message_notification', ({ msg, senderName }) => {
      // If user is actively viewing the chat room with this sender, skip notifications
      const activeRoom = sessionStorage.getItem('active_chat_room');
      const msgRoom = `chat_${msg.patient}_${msg.doctor}`;
      if (activeRoom === msgRoom) {
        return;
      }

      setUnreadChats((prev) => prev.includes(msg.sender) ? prev : [...prev, msg.sender]);

      // Add to unread chat notifications list
      setUnreadChatNotifications((prev) => [
        {
          senderId: msg.sender,
          senderName: senderName || 'Someone',
          text: msg.text,
          createdAt: new Date()
        },
        ...prev
      ]);

      setChatAlert({ senderName, text: msg.text });
      setTimeout(() => setChatAlert(null), 4000);
    });

    return () => {
      socket.off('connect', registerUser);
      socket.off('receive_message_notification');
    };
  }, [socket, user?.id]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('hospital_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(`${API_BASE_URL}/patients/todo/toggle`, { taskId }, { headers });
      if (res.data.success) {
        setTodoChecklist(res.data.data);
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || 'Failed to toggle task');
    }
  };




    const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !reportTitle.trim() || !selectedDoctorRef) {
      triggerError('Please enter a title, select a target doctor, and choose a report file.');
      return;
    }

    setUploadingReport(true);
    const formData = new FormData();
    formData.append('title', reportTitle);
    formData.append('reportFile', reportFile);
    formData.append('doctorRef', selectedDoctorRef);

    try {
      const token = localStorage.getItem('hospital_token');
      await axios.post(`${API_BASE_URL}/patients/upload-report`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Lab report uploaded successfully!');
      setReportTitle('');
      setReportFile(null);
      setSelectedDoctorRef('');
      fetchData(); // Refresh patient profile metadata to fetch new reports list
    } catch (err: any) {
      triggerError(err.response?.data?.message || 'Failed to upload report file.');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled appointment?')) return;
    try {
      const token = localStorage.getItem('hospital_token');
      await axios.put(`${API_BASE_URL}/appointments/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(appointments.map(app => app._id === id ? { ...app, status: 'Cancelled' } : app));
    } catch (error: any) {
      triggerError(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const isProfileIncomplete = !profile?.mobile || !profile?.age || !profile?.gender;

  return (
    <div className="container-fluid py-5 px-4 px-lg-5">
        
        {errorToast && (
          <div className="alert alert-danger position-fixed top-0 end-0 m-4 shadow-lg" style={{ zIndex: 1050 }}>
            <i className="fa fa-exclamation-circle me-2"></i> {errorToast}
          </div>
        )}

        <div className="row g-5">
          
          {/* Left Sidebar Layout */}
          <div className="col-lg-3 col-md-4">
            <div className="bg-light rounded-3 p-4 border shadow-sm text-center">
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <h3 className="m-0 text-white">{user?.name ? user.name.slice(0,2).toUpperCase() : 'PT'}</h3>
              </div>
              <h5 className="mb-1 fw-bold text-dark">{user?.name}</h5>
              <p className="text-muted small mb-4">{user?.email}</p>

              {/* Envelope Dropdown inside Patient sidebar card */}
              <div className="d-flex justify-content-center mb-3">
                <div className="position-relative">
                  <button 
                    type="button"
                    className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative shadow-sm" 
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => setShowChatNotifications(!showChatNotifications)}
                  >
                    <i className="fa fa-envelope text-muted"></i>
                    {unreadChatNotifications.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', marginTop: '8px', marginLeft: '-8px' }}>
                        {unreadChatNotifications.length}
                      </span>
                    )}
                  </button>

                  {showChatNotifications && (
                    <div 
                      className="position-absolute start-50 translate-middle-x mt-2 bg-white border shadow-lg rounded-4 p-3 animate__animated animate__fadeIn"
                      style={{ zIndex: 1050, width: '280px', maxHeight: '300px', overflowY: 'auto' }}
                    >
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                        <h6 className="fw-bold text-dark m-0 small text-start"><i className="fa fa-envelope text-primary me-2"></i>Messages</h6>
                        <button 
                          type="button" 
                          className="btn btn-link text-muted p-0 small text-decoration-none"
                          style={{ fontSize: '11px' }}
                          onClick={() => setUnreadChatNotifications([])}
                        >
                          Clear
                        </button>
                      </div>
                      {unreadChatNotifications.length === 0 ? (
                        <p className="text-muted small text-center my-3">No new messages.</p>
                      ) : (
                        <div className="d-flex flex-column gap-2 text-start">
                          {unreadChatNotifications.map((notif, idx) => (
                            <div 
                              key={idx} 
                              className="p-2 bg-light border-start border-3 border-success rounded small text-dark cursor-pointer transition-all"
                              onClick={() => {
                                setActiveTab('chats');
                                setChatPartnerId(notif.senderId);
                                setShowChatNotifications(false);
                                setUnreadChatNotifications(prev => prev.filter(n => n.senderId !== notif.senderId));
                              }}
                            >
                              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '10px' }}>
                                <span className="fw-bold text-success-emphasis">{notif.senderName}</span>
                                <span className="text-muted">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', lineHeight: '1.3' }} className="text-truncate">{notif.text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="nav flex-column nav-pills text-start">
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'bookings' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('bookings')}
                >
                  <i className="fa fa-calendar-alt me-2"></i> My Bookings
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'profile' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fa fa-id-card me-2"></i> My Profile
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'records' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('records')}
                >
                  <i className="fa fa-notes-medical me-2"></i> Medical Records
                </button>
                {/* <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'todo' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('todo')}
                >
                  <i className="fa fa-apple-alt me-2"></i> Daily Checklist
                </button> */}
                {/* 🍏 Nutrition Plans Sidebar Link */}
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'nutrition' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  <i className="fa fa-apple-alt me-2"></i> Nutrition Plans
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'General Habits' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('General Habits')}
                >
                  <i className="fa fa-running me-2"></i> General Habits 
                </button>

                {/* 🏃 Fitness Plans Sidebar Link */}
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'fitness' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => setActiveTab('fitness')}
                >
                  <i className="fa fa-running me-2"></i> Fitness Plans
                </button>
                <button 
                  className={`nav-link border-0 text-start py-3 mb-2 rounded ${activeTab === 'chats' ? 'active bg-primary text-white' : 'bg-transparent text-dark'}`}
                  onClick={() => { setActiveTab('chats'); setChatPartnerId(''); setUnreadChats([]); }}
                >
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <span>
                      <i className="fa fa-comments me-2"></i>
                      Messages
                    </span>
                    {unreadChats.length > 0 && (
                      <span className="badge bg-danger rounded-pill px-2 py-0.5 small">
                        {unreadChats.length}
                      </span>
                    )}
                  </div>
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

          {/* Right Main Panel */}
          <div className="col-lg-9 col-md-8">
            <div className="bg-white p-4 border rounded-3 shadow-sm min-vh-50">
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Loading your portal details...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: BOOKINGS LIST & CALENDAR */}
                  {activeTab === 'bookings' && (
                    <div>
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
                        <h3 className="fw-bold text-dark m-0">My Booked Appointments</h3>
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
                          <div className="text-center py-5 text-muted">
                            <i className="fa fa-calendar-times fa-3x mb-3 text-muted"></i>
                            <p>You have not booked any appointments yet.</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle">
                              <thead className="table-light">
                                <tr>
                                  <th>Doctor</th>
                                  <th>Date / Time</th>
                                  <th>Problem</th>
                                  <th>Status</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {appointments.map((app) => (
                                  <tr key={app._id}>
                                    <td><span className="badge bg-light text-dark text-capitalize">{app.doctor}</span></td>
                                    <td>
                                      <div>{app.date}</div>
                                      <small className="text-muted">{app.time}</small>
                                    </td>
                                    <td style={{ maxWidth: '250px', wordBreak: 'break-all' }}>{app.problem}</td>
                                    <td>
                                      <span className={`badge ${app.status === 'Approved' ? 'bg-success' : app.status === 'Scheduled' ? 'bg-primary' : app.status === 'Completed' ? 'bg-info' : 'bg-secondary'}`}>
                                        {app.status}
                                      </span>
                                    </td>
                                    <td>
                                      {(app.status === 'Scheduled' || app.status === 'Approved') && (
                                        <button 
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => handleCancelBooking(app._id)}
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : (
                        /* 📅 REACT CALENDAR GRID */
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
                            {/* Empty offset padding cells */}
                            {Array(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()).fill(null).map((_, idx) => (
                              <div key={`empty-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '90px', opacity: 0.4 }}></div>
                            ))}

                            {/* Month Days */}
                            {Array(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).fill(null).map((_, idx) => {
                              const dayNum = idx + 1;
                              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              
                              // Find appointments matching this date
                              const dayApps = appointments.filter(app => app.date === dateStr);

                              return (
                                <div key={dayNum} className="col border-bottom border-end p-2 position-relative bg-white" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '90px' }}>
                                  <span className="fw-bold text-muted small position-absolute top-1 start-2">{dayNum}</span>
                                  <div className="mt-3 overflow-y-auto" style={{ maxHeight: '65px', scrollbarWidth: 'none' }}>
                                    {dayApps.map(app => (
                                      <div 
                                        key={app._id}
                                        className={`p-1 mb-1 rounded text-white text-truncate`}
                                        style={{ 
                                          fontSize: '9px', 
                                          cursor: 'pointer',
                                          lineHeight: '1.2',
                                          backgroundColor: app.status === 'Approved' ? '#198754' : app.status === 'Cancelled' ? '#6c757d' : '#0d6efd'
                                        }}
                                        title={`${app.doctor} - ${app.time} (${app.status})`}
                                      >
                                        <strong className="d-block">{app.time}</strong>
                                        <span>{app.doctor}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {/* End offset padding cells to fill the last week row */}
                            {Array((7 - ((new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()) % 7)) % 7).fill(null).map((_, idx) => (
                              <div key={`empty-end-${idx}`} className="col border-bottom border-end bg-light" style={{ width: '14.28%', flex: '0 0 14.28%', minHeight: '90px', opacity: 0.4 }}></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: READ ONLY PROFILE */}
                  {activeTab === 'profile' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark"><i className="fa fa-id-card text-primary me-2"></i>My Medical Card</h3>
                      
                      {isProfileIncomplete ? (
                        <div className="alert alert-info py-4 rounded-3 border-0 shadow-sm mb-0">
                          <h5 className="alert-heading fw-bold"><i className="fa fa-info-circle me-2"></i>Profile Pending Setup</h5>
                          <p className="mb-0">Your demographic and vitals data card (Age, Blood Group, Address) will be filled out and verified by the hospital administrator or doctor during your consultation check-in.</p>
                        </div>
                      ) : (
                        <div className="bg-light rounded-3 p-4 border">
                          <div className="row g-4">
                            <div className="col-md-6">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-user text-primary me-2"></i>Full Name</div>
                              <h5 className="fw-bold text-dark mb-0">{user?.name}</h5>
                            </div>
                            <div className="col-md-6">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-envelope text-primary me-2"></i>Email Address</div>
                              <h5 className="fw-bold text-dark mb-0">{user?.email}</h5>
                            </div>
                            <div className="col-md-6">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-phone text-primary me-2"></i>Phone Number</div>
                              <h5 className="fw-bold text-dark mb-0">{profile?.mobile}</h5>
                            </div>
                            <div className="col-md-3">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-birthday-cake text-primary me-2"></i>Age</div>
                              <h5 className="fw-bold text-dark mb-0">{profile?.age} Years</h5>
                            </div>
                            <div className="col-md-3">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-venus-mars text-primary me-2"></i>Gender</div>
                              <h5 className="fw-bold text-dark mb-0">{profile?.gender}</h5>
                            </div>
                            <div className="col-md-6">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-tint text-primary me-2"></i>Blood Group</div>
                              <h5 className="fw-bold text-dark mb-0">{profile?.bloodGroup || 'Not specified'}</h5>
                            </div>
                            <div className="col-md-6">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-ambulance text-primary me-2"></i>Emergency Contact</div>
                              <h5 className="fw-bold text-dark mb-0">{profile?.emergencyContact || 'Not specified'}</h5>
                            </div>
                            <div className="col-12">
                              <div className="text-muted small fw-medium mb-1"><i className="fa fa-map-marker-alt text-primary me-2"></i>Home Address</div>
                              <p className="fw-bold text-dark mb-0" style={{ whiteSpace: 'pre-line' }}>{profile?.address}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: MEDICAL HISTORY AND PRESCRIPTIONS */}
                  {activeTab === 'records' && (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark">Consultation & Prescriptions Log</h3>
                      
                      <div className="row g-4">
                        
                        {/* EMR Checkups */}
                        <div className="col-lg-6">
                          <h5 className="fw-bold text-primary mb-3"><i className="fa fa-file-medical me-2"></i>Consultation History</h5>
                          {records.length === 0 ? (
                            <p className="text-muted bg-light p-3 rounded">No consultation summaries recorded.</p>
                          ) : (
                            records.map((rec) => (
                              <div key={rec._id} className="card border shadow-sm mb-3">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between mb-2">
                                    <span className="badge bg-primary">Visit Checkup</span>
                                    <small className="text-muted">{new Date(rec.visitDate).toLocaleDateString()}</small>
                                  </div>
                                  <h6 className="fw-bold text-dark mb-1">Diagnosis: {rec.diagnosis}</h6>
                                  <p className="small text-muted mb-2">Treatment: {rec.treatmentPlan}</p>
                                  {rec.notes && <div className="bg-light p-2 small text-muted rounded">Notes: {rec.notes}</div>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Prescriptions */}
                        {prescriptions.map((pres) => {
                          const isUpdated = pres.updatedAt && pres.createdAt !== pres.updatedAt;
                          return (
                            <div key={pres._id} className="card border shadow-sm mb-3">
                              <div className="card-body">
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="badge bg-success">Rx Prescription</span>
                                  <div className="text-end">
                                    <small className="text-muted d-block">Issued: {new Date(pres.createdAt).toLocaleDateString()} at {new Date(pres.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                    {isUpdated && (
                                      <small className="text-danger fw-bold d-block">
                                        <i className="fa fa-history me-1"></i> Updated: {new Date(pres.updatedAt).toLocaleDateString()} at {new Date(pres.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="table-responsive mb-2">
                                  <table className="table table-sm table-borderless small mb-0">
                                    <thead>
                                      <tr className="border-bottom text-muted">
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Freq</th>
                                        <th>Duration</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pres.medicines.map((med, index) => (
                                        <tr key={index}>
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
                        })}
                        
                        {/* LAB REPORTS CARD */}
                        <div className="card border-0 shadow-sm p-4 mb-4">
                          <h5 className="fw-bold mb-3 text-primary"><i className="fa fa-file-medical me-2"></i>My Lab Test Reports</h5>
                          
                          {/* Upload Form */}
                          <form onSubmit={handleReportUpload} className="row g-3 mb-4 pb-4 border-bottom">
                            <div className="col-md-4">
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Report Title (e.g. Blood Test)" 
                                value={reportTitle} 
                                onChange={(e) => setReportTitle(e.target.value)} 
                                required 
                              />
                            </div>
                            <div className="col-md-3">
                              {/* Unique Booked Doctors Selector */}
                              <select 
                                className="form-select"
                                value={selectedDoctorRef}
                                onChange={(e) => setSelectedDoctorRef(e.target.value)}
                                required
                              >
                                <option value="">Select Target Doctor...</option>
                                {(() => {
                                  const bookedDoctors = Array.from(
                                    new Map(
                                      appointments
                                        .filter(app => app.doctorRef && app.doctor)
                                        .map(app => [app.doctorRef, app.doctor])
                                    ).entries()
                                  ).map(([id, name]) => ({ id, name }));
                                  return bookedDoctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                  ));
                                })()}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <input 
                                type="file" 
                                className="form-control" 
                                accept=".pdf,.png,.jpg,.jpeg" 
                                onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)} 
                                required 
                              />
                            </div>
                            <div className="col-md-2">
                              <button className="btn btn-primary w-100" type="submit" disabled={uploadingReport}>
                                {uploadingReport ? 'Uploading...' : 'Upload'}
                              </button>
                            </div>
                          </form>

                          {/* File List */}
                          {profile?.reports?.length === 0 ? (
                            <p className="text-muted small">No test reports uploaded yet.</p>
                          ) : (
                            <div className="list-group">
                              {profile?.reports?.map((rep: any) => (
                                <a 
                                  key={rep._id} 
                                  href={`${API_BASE_URL.replace('/api', '')}${rep.filePath}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <h6 className="mb-0 fw-bold text-dark">{rep.title}</h6>
                                    <div className="d-flex align-items-center mt-1">
                                      <small className="text-muted">Uploaded: {new Date(rep.uploadedAt).toLocaleDateString()}</small>
                                      {rep.doctorRef && (
                                        <span className="badge bg-light text-primary border border-primary-subtle ms-3 small">
                                          <i className="fa fa-user-md me-1"></i>
                                          For: {(() => {
                                            const matchedDoc = appointments.find(app => app.doctorRef === rep.doctorRef);
                                            return matchedDoc ? matchedDoc.doctor : 'Assigned Doctor';
                                          })()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="badge bg-primary px-3 py-2 rounded-pill">View PDF / Image</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: NUTRITION PLANS */}
                  {activeTab === 'nutrition' && (
                    <div className="animate__animated animate__fadeIn text-start">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0 text-dark">
                          <i className="fa fa-apple-alt text-success me-2"></i>My Nutrition Plans
                        </h3>
                        <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={fetchData}>
                          <i className="fa fa-sync-alt me-1"></i> Refresh Tasks
                        </button>
                      </div>

                      {todoChecklist.filter(t => t.type === 'nutrition').length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-4 bg-light">
                          <i className="fa fa-clipboard-list fa-3x mb-3 text-muted"></i>
                          <p className="m-0 fw-semibold">No nutrition plan assigned.</p>
                          <p className="small text-muted mt-1">Your doctor has not yet configured a nutrition schedule for you.</p>
                        </div>
                      ) : (
                        <div className="list-group shadow-sm rounded-4">
                          {todoChecklist.filter(t => t.type === 'nutrition').map((item) => {
                            const isMissed = (() => {
                              if (item.isCompleted) return false;
                              const now = new Date();
                              const currentHours = now.getHours();
                              const currentMinutes = now.getMinutes();
                              const currentTimeVal = currentHours * 60 + currentMinutes;
                              
                              const parts = item.targetTime.split(':');
                              const targetHours = parseInt(parts[0], 10);
                              const targetMinutes = parseInt(parts[1], 10);
                              const targetTimeVal = targetHours * 60 + targetMinutes;
                              
                              return currentTimeVal > targetTimeVal;
                            })();

                            return (
                              <div 
                                key={item._id} 
                                className="list-group-item d-flex align-items-center py-3 border-light justify-content-between"
                                style={{ background: item.isCompleted ? '#f0fdf4' : isMissed ? '#fef2f2' : '#ffffff' }}
                              >
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input border-secondary fs-5" 
                                    type="checkbox" 
                                    id={item._id}
                                    checked={item.isCompleted} 
                                    disabled={isMissed}
                                    onChange={() => item._id && handleToggleTask(item._id)}
                                  />
                                  <label 
                                    className={`form-check-label ms-2 small text-dark ${item.isCompleted ? 'text-decoration-line-through text-muted fw-bold' : isMissed ? 'text-muted' : 'fw-semibold'}`}
                                    htmlFor={item._id}
                                  >
                                    {item.task}
                                    {item.doctorName && (
                                      <span className="ms-2 badge bg-light text-muted border fw-normal" style={{ fontSize: '9px', textDecoration: 'none' }}>
                                        by {item.doctorName}
                                      </span>
                                    )}
                                  </label>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                                    <i className="fa fa-clock me-1"></i>by {item.targetTime}
                                  </span>
                                  {isMissed && (
                                    <span className="badge bg-danger rounded-pill px-2" style={{ fontSize: '9px' }}>Missed</span>
                                  )}
                                  {item.isCompleted && (
                                    <span className="badge bg-success rounded-pill px-2" style={{ fontSize: '9px' }}>Completed</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 7-DAY WEEKLY MEALS & ADHERENCE LOGS */}
                      <WeeklyDietCalendar />
                    </div>
                  )}

                  {/* TAB 5: FITNESS PLANS */}
                  {activeTab === 'fitness' && (
                    <div className="animate__animated animate__fadeIn text-start">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0 text-dark">
                          <i className="fa fa-running text-primary me-2"></i>My Fitness Plans
                        </h3>
                        <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={fetchData}>
                          <i className="fa fa-sync-alt me-1"></i> Refresh Tasks
                        </button>
                      </div>

                      {todoChecklist.filter(t => t.type === 'fitness').length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-4 bg-light">
                          <i className="fa fa-clipboard-list fa-3x mb-3 text-muted"></i>
                          <p className="m-0 fw-semibold">No fitness plan assigned.</p>
                          <p className="small text-muted mt-1">Your doctor has not yet configured a physical exercise schedule for you.</p>
                        </div>
                      ) : (
                        <div className="list-group shadow-sm rounded-4">
                          {todoChecklist.filter(t => t.type === 'fitness').map((item) => {
                            const isMissed = (() => {
                              if (item.isCompleted) return false;
                              const now = new Date();
                              const currentHours = now.getHours();
                              const currentMinutes = now.getMinutes();
                              const currentTimeVal = currentHours * 60 + currentMinutes;
                              
                              const parts = item.targetTime.split(':');
                              const targetHours = parseInt(parts[0], 10);
                              const targetMinutes = parseInt(parts[1], 10);
                              const targetTimeVal = targetHours * 60 + targetMinutes;
                              
                              return currentTimeVal > targetTimeVal;
                            })();

                            return (
                              <div 
                                key={item._id} 
                                className="list-group-item d-flex align-items-center py-3 border-light justify-content-between"
                                style={{ background: item.isCompleted ? '#ecfdf5' : isMissed ? '#fef2f2' : '#ffffff' }}
                              >
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input border-secondary fs-5" 
                                    type="checkbox" 
                                    id={item._id}
                                    checked={item.isCompleted} 
                                    disabled={isMissed}
                                    onChange={() => item._id && handleToggleTask(item._id)}
                                  />
                                  <label 
                                    className={`form-check-label ms-2 small text-dark ${item.isCompleted ? 'text-decoration-line-through text-muted fw-bold' : isMissed ? 'text-muted' : 'fw-semibold'}`}
                                    htmlFor={item._id}
                                  >
                                    {item.task}
                                    {item.doctorName && (
                                      <span className="ms-2 badge bg-light text-muted border fw-normal" style={{ fontSize: '9px', textDecoration: 'none' }}>
                                        by {item.doctorName}
                                      </span>
                                    )}
                                  </label>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                                    <i className="fa fa-clock me-1"></i>by {item.targetTime}
                                  </span>
                                  {isMissed && (
                                    <span className="badge bg-danger rounded-pill px-2" style={{ fontSize: '9px' }}>Missed</span>
                                  )}
                                  {item.isCompleted && (
                                    <span className="badge bg-success rounded-pill px-2" style={{ fontSize: '9px' }}>Completed</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: GENERAL HABITS */}
                  {activeTab === 'General Habits' && (
                    <div className="animate__animated animate__fadeIn text-start">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0 text-dark">
                          <i className="fa fa-running text-info me-2"></i>My General Habits
                        </h3>
                        <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={fetchData}>
                          <i className="fa fa-sync-alt me-1"></i> Refresh Tasks
                        </button>
                      </div>

                      {todoChecklist.filter(t => t.type === 'general').length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-4 bg-light">
                          <i className="fa fa-clipboard-list fa-3x mb-3 text-muted"></i>
                          <p className="m-0 fw-semibold">No general habit tasks assigned.</p>
                          <p className="small text-muted mt-1">Your doctor has not yet configured general habit targets for you today.</p>
                        </div>
                      ) : (
                        <div className="list-group shadow-sm rounded-4">
                          {todoChecklist.filter(t => t.type === 'general').map((item) => {
                            const isMissed = (() => {
                              if (item.isCompleted) return false;
                              const now = new Date();
                              const currentHours = now.getHours();
                              const currentMinutes = now.getMinutes();
                              const currentTimeVal = currentHours * 60 + currentMinutes;
                              
                              const parts = item.targetTime.split(':');
                              const targetHours = parseInt(parts[0], 10);
                              const targetMinutes = parseInt(parts[1], 10);
                              const targetTimeVal = targetHours * 60 + targetMinutes;
                              
                              return currentTimeVal > targetTimeVal;
                            })();

                            return (
                              <div 
                                key={item._id} 
                                className="list-group-item d-flex align-items-center py-3 border-light justify-content-between"
                                style={{ background: item.isCompleted ? '#e0f2fe' : isMissed ? '#fef2f2' : '#ffffff' }}
                              >
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input border-secondary fs-5" 
                                    type="checkbox" 
                                    id={item._id}
                                    checked={item.isCompleted} 
                                    disabled={isMissed}
                                    onChange={() => item._id && handleToggleTask(item._id)}
                                  />
                                  <label 
                                    className={`form-check-label ms-2 small text-dark ${item.isCompleted ? 'text-decoration-line-through text-muted fw-bold' : isMissed ? 'text-muted' : 'fw-semibold'}`}
                                    htmlFor={item._id}
                                  >
                                    {item.task}
                                    {item.doctorName && (
                                      <span className="ms-2 badge bg-light text-muted border fw-normal" style={{ fontSize: '9px', textDecoration: 'none' }}>
                                        by {item.doctorName}
                                      </span>
                                    )}
                                  </label>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                                    <i className="fa fa-clock me-1"></i>by {item.targetTime}
                                  </span>
                                  {isMissed && (
                                    <span className="badge bg-danger rounded-pill px-2" style={{ fontSize: '9px' }}>Missed</span>
                                  )}
                                  {item.isCompleted && (
                                    <span className="badge bg-success rounded-pill px-2" style={{ fontSize: '9px' }}>Completed</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: PATIENT-DOCTOR PRIVATE CHAT */}
                  {activeTab === 'chats' && (
                    <div className="animate__animated animate__fadeIn text-start">
                      <h3 className="fw-bold mb-4 text-dark"><i className="fa fa-comments text-primary me-2"></i>My Consultations Chat</h3>
                      <div className="row g-4">
                        {/* Doctors List Column */}
                        <div className="col-md-4">
                          <div className="card border rounded-4 p-3 shadow-sm bg-light">
                            <h6 className="fw-bold mb-3 text-muted">Select a Doctor</h6>
                            <div className="list-group">
                              {/* Fetch unique doctors the patient has appointments with */}
                              {Array.from(new Set(appointments.map(a => a.doctorRef))).map((docId) => {
                                const appointment = appointments.find(a => a.doctorRef === docId);
                                if (!docId || !appointment) return null;
                                return (
                                  <button
                                    key={docId}
                                    type="button"
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 py-3 shadow-sm ${chatPartnerId === docId ? 'active bg-primary text-white' : ''}`}
                                    onClick={() => setChatPartnerId(docId)}
                                  >
                                    <div className="fw-bold small">{appointment.doctor}</div>
                                    <span className="text-muted d-block small" style={{ fontSize: '10px' }}>Consulting Physician</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Chat Box Column */}
                        <div className="col-md-8">
                          {chatPartnerId ? (
                            <LiveChatBox 
                              chatPartnerId={chatPartnerId} 
                              chatPartnerName={appointments.find(a => a.doctorRef === chatPartnerId)?.doctor || 'Doctor'} 
                              currentUserRole="patient" 
                            />
                          ) : (
                            <div className="card border rounded-4 shadow-sm text-center py-5 bg-light my-auto h-100 d-flex flex-column justify-content-center" style={{ minHeight: '300px' }}>
                              <i className="fa fa-comments fa-3x mb-3 text-muted"></i>
                              <h5 className="fw-bold">No Doctor Selected</h5>
                              <p className="text-muted small">Choose a doctor from the list on the left to load the conversation.</p>
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

      {/* Real-time floating Chat Alert notification card */}
      {chatAlert && (
        <div className="position-fixed bottom-0 end-0 m-4 p-3 bg-primary text-white rounded-3 shadow-lg animate__animated animate__slideInUp" style={{ zIndex: 1100, maxWidth: '300px' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="fa fa-comments fs-4"></i>
            <div className="text-start">
              <h6 className="fw-bold m-0 text-white" style={{ fontSize: '13px' }}>New Chat Message</h6>
              <p className="small m-0 text-white-50 text-truncate" style={{ fontSize: '12px', maxWidth: '200px' }}>
                <strong>{chatAlert.senderName}:</strong> "{chatAlert.text}"
              </p>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  );
};

export default PatientDashboard;