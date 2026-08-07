import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScrollReveal from './ScrollReveal';
import { submitAppointment } from '../services/api';
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
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
        <div className="row g-5">
          <ScrollReveal animation="fadeInUp" delay="0.1s" className="col-lg-6">
            <p className="d-inline-block border rounded-pill py-1 px-4">Appointment</p>
            <h1 className="mb-4">Make An Appointment To Visit Our Doctor</h1>
            <p className="mb-4">Look, don’t sit there reading meaningless Latin filler text while your fever hits 104°F. Your local neighborhood WhatsApp group cannot cure that weird rash. Stop scrolling Google Docs, put down the turmeric milk, and book an appointment before your family starts eyeing your property.</p>
            <div className="bg-light rounded d-flex align-items-center p-5 mb-4">
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-white" style={{ width: '55px', height: '55px' }}>
                <i className="fa fa-phone-alt text-primary"></i>
              </div>
              <div className="ms-4">
                <p className="mb-2">Call Us Now</p>
                <h5 className="mb-0">+91 98765-AMAR-1</h5>
              </div>
            </div>
            <div className="bg-light rounded d-flex align-items-center p-5">
              <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-white" style={{ width: '55px', height: '55px' }}>
                <i className="fa fa-envelope-open text-primary"></i>
              </div>
              <div className="ms-4">
                <p className="mb-2">Mail Us Now</p>
                <h5 className="mb-0">no.google.docs@amarrahohospital.com </h5>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeInUp" delay="0.5s" className="col-lg-6">
            <div className="bg-light rounded h-100 d-flex align-items-center p-5">
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                {statusMsg && (
                  <div className={`alert alert-${statusMsg.type} mb-4`} role="alert">
                    {statusMsg.text}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <input 
                      type="text" 
                      name="name"
                      className="form-control border-0" 
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
                      className="form-control border-0" 
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
                      className="form-control border-0" 
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
                      className="form-select border-0 text-capitalize" 
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
                      className="form-control border-0" 
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
                      className="form-control border-0" 
                      style={{ height: '55px' }}
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <textarea 
                      name="problem"
                      className="form-control border-0" 
                      rows={5} 
                      placeholder="Describe your problem"
                      value={formData.problem}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <button 
                      className="btn btn-primary w-100 py-3" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Booking...' : 'Book Appointment'}
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