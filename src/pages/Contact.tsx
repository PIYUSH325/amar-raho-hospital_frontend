import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import ScrollReveal from '../components/ScrollReveal';
import { submitContactMessage } from '../services/api';
import { ContactData } from '../types';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      await submitContactMessage(formData);
      setStatusMsg({ type: 'success', text: 'Message sent successfully!' });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setStatusMsg({ type: 'danger', text: 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Contact Us" currentPage="Contact" />
      
      {/* Contact Start */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="h-100 bg-light rounded d-flex align-items-center p-5">
                <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-white" style={{ width: '55px', height: '55px' }}>
                  <i className="fa fa-map-marker-alt text-primary"></i>
                </div>
                <div className="ms-4">
                  <p className="mb-2">Address</p>
                  <h5 className="mb-0">123 Street, New York, USA</h5>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="h-100 bg-light rounded d-flex align-items-center p-5">
                <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-white" style={{ width: '55px', height: '55px' }}>
                  <i className="fa fa-phone-alt text-primary"></i>
                </div>
                <div className="ms-4">
                  <p className="mb-2">Call Us Now</p>
                  <h5 className="mb-0">+012 345 6789</h5>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="h-100 bg-light rounded d-flex align-items-center p-5">
                <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-white" style={{ width: '55px', height: '55px' }}>
                  <i className="fa fa-envelope-open text-primary"></i>
                </div>
                <div className="ms-4">
                  <p className="mb-2">Mail Us Now</p>
                  <h5 className="mb-0">info@example.com</h5>
                </div>
              </div>
            </div>
            <ScrollReveal animation="fadeIn" delay="0.1s" className="col-lg-6">
              <div className="bg-light rounded p-5">
                <p className="d-inline-block border rounded-pill py-1 px-4">Contact Us</p>
                <h1 className="mb-4">Have Any Query? Please Contact Us!</h1>
                <p className="mb-4">The contact form is currently inactive. Get a functional and working contact form with Ajax & PHP in a few minutes. Just copy and paste the files, add a little code and you're done.</p>
                <form onSubmit={handleSubmit}>
                  {statusMsg && (
                    <div className={`alert alert-${statusMsg.type} mb-4`} role="alert">
                      {statusMsg.text}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          name="name"
                          className="form-control" 
                          id="name" 
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="name">Your Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="email" 
                          name="email"
                          className="form-control" 
                          id="email" 
                          placeholder="Your Email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="email">Your Email</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          name="subject"
                          className="form-control" 
                          id="subject" 
                          placeholder="Subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="subject">Subject</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <textarea 
                          name="message"
                          className="form-control" 
                          placeholder="Leave a message here" 
                          id="message" 
                          style={{ height: '100px' }}
                          value={formData.message}
                          onChange={handleChange}
                          required
                        ></textarea>
                        <label htmlFor="message">Message</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <button 
                        className="btn btn-primary w-100 py-3" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fadeIn" delay="0.5s" className="col-lg-6" style={{ minHeight: '400px' }}>
              <div className="h-100">
                <iframe 
                  className="rounded w-100 h-100"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3001156.4288297426!2d-78.01371936852176!3d42.72876761954724!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4ccc4bf0f123a5a9%3A0xddcfc6c1de189567!2sNew%20York%2C%20USA!5e0!3m2!1sen!2sbd!4v1603794290143!5m2!1sen!2sbd"
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  aria-hidden="false"
                  tabIndex={0}
                  title="Google Maps Location"
                ></iframe>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
      {/* Contact End */}
    </>
  );
};

export default Contact;
