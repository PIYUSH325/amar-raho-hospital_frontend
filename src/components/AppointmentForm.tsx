import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScrollReveal from './ScrollReveal';
import { submitAppointment, API_BASE_URL } from '../services/api';
import { AppointmentData } from '../types';
import { useAuth } from '../context/AuthContext';

export const AppointmentForm: React.FC = () => {
  const [formData, setFormData] = useState<AppointmentData>({
    name: '',
    email: '',
    mobile: '',
    doctor: 'Choose Doctor',
    doctorRef: '',
    date: '',
    time: '',
    problem: '',
  });

  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const { user } = useAuth();

  // Fetch verified doctors dynamically from the backend database
  useEffect(() => {
    axios.get(`${API_BASE_URL}/doctors`)
      .then((res) => {
        setDoctorsList(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load doctors list:', err);
      });
  }, []);

  // Pre-fill fields if user is already logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        // mobile: user.mobile || prev.mobile
      }));
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handles updating both doctor name string and doctor user ID Reference
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDocName = e.target.value;
    const selectedDoc = doctorsList.find((d) => d.user.name === selectedDocName);
    setFormData((prev) => ({
      ...prev,
      doctor: selectedDocName,
      doctorRef: selectedDoc ? selectedDoc.user._id : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.doctor === 'Choose Doctor') {
      setStatusMsg({ type: 'danger', text: 'Please choose a valid doctor.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      await submitAppointment(formData);
      setStatusMsg({ type: 'success', text: 'Appointment booked successfully!' });
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        mobile:  '',
        doctor: 'Choose Doctor',
        doctorRef: '',
        date: '',
        time: '',
        problem: '',
      });
    } catch (err) {
      setStatusMsg({ type: 'danger', text: 'Failed to book appointment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="row g-5 align-items-center">
          <ScrollReveal animation="fadeInUp" delay="0.1s" className="col-lg-6">
            <span className="badge bg-light text-primary border border-primary-subtle rounded-pill py-2 px-4 mb-3 fw-semibold">
              <i className="fa fa-calendar-check me-2"></i>Appointment
            </span>
            <h1 className="mb-4 fw-bold">Make An Appointment To Visit Our Doctor</h1>
            <p className="mb-4 text-muted fs-5">Look, don’t sit there reading meaningless Latin filler text while your fever hits 104°F. Your local neighborhood WhatsApp group cannot cure that weird rash. Stop scrolling Google Docs, put down the turmeric milk, and book an appointment before your family starts eyeing your property.</p>
            <div className="curved-card d-flex align-items-center p-4 mb-4 bg-white shadow-sm">
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary" style={{ width: '60px', height: '60px', background: 'rgba(4, 99, 250, 0.1)' }}>
                <i className="fa fa-phone-alt text-primary fs-4"></i>
              </div>
              <div className="ms-4">
                <p className="mb-1 text-muted small">Call Us Now</p>
                <h5 className="mb-0 fw-bold text-dark">+91 98765-AMAR-1</h5>
              </div>
            </div>
            <div className="curved-card d-flex align-items-center p-4 bg-white shadow-sm">
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary" style={{ width: '60px', height: '60px', background: 'rgba(4, 99, 250, 0.1)' }}>
                <i className="fa fa-envelope-open text-primary fs-4"></i>
              </div>
              <div className="ms-4">
                <p className="mb-1 text-muted small">Mail Us Now</p>
                <h5 className="mb-0 fw-bold text-dark">no.google.docs@amarrahohospital.com </h5>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeInUp" delay="0.5s" className="col-lg-6">
            <div className="curved-card bg-white p-4 p-xl-5 shadow-lg">
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                {statusMsg && (
                  <div className={`alert alert-${statusMsg.type} rounded-4 mb-4`} role="alert">
                    {statusMsg.text}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <input 
                      type="text" 
                      name="name"
                      className="form-control rounded-4 bg-light border-0 px-3" 
                      placeholder="Your Name" 
                      style={{ height: '55px' }}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input 
                      type="email" 
                      name="email"
                      className="form-control rounded-4 bg-light border-0 px-3" 
                      placeholder="Your Email" 
                      style={{ height: '55px' }}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input 
                      type="text" 
                      name="mobile"
                      className="form-control rounded-4 bg-light border-0 px-3" 
                      placeholder="Your Mobile" 
                      style={{ height: '55px' }}
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <select 
                      name="doctor"
                      className="form-select rounded-4 bg-light border-0 px-3 text-capitalize" 
                      style={{ height: '55px' }}
                      value={formData.doctor}
                      onChange={handleDoctorChange}
                    >
                      <option disabled value="Choose Doctor">Choose Doctor</option>
                      {doctorsList.map((doc) => (
                        <option key={doc._id} value={doc.user.name}>
                          {doc.user.name} ({doc.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <input 
                      type="date" 
                      name="date"
                      className="form-control rounded-4 bg-light border-0 px-3" 
                      style={{ height: '55px' }}
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input 
                      type="time" 
                      name="time"
                      className="form-control rounded-4 bg-light border-0 px-3" 
                      style={{ height: '55px' }}
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <textarea 
                      name="problem"
                      className="form-control rounded-4 bg-light border-0 p-3" 
                      rows={4} 
                      placeholder="Describe your problem"
                      value={formData.problem}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <button 
                      className="btn btn-pill-primary w-100 py-3 shadow" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Booking...' : 'Book Appointment'} <i className="fa fa-paper-plane ms-2"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;