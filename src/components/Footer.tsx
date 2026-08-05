import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Subscribed email: ${email}`);
    setEmail('');
  };

  return (
    <div className="container-fluid bg-dark text-light footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
      <div className="container py-5">
        <div className="row g-5">
          <div className="col-lg-3 col-md-6">
            <h5 className="text-light mb-4">Address</h5>
            <p className="mb-2"><i className="fa fa-map-marker-alt me-3"></i>Amar Raho HospitalPlot 404, Yamaraj Bypass Road,Near Swarg Lok U-Turn,Narak-Pur</p>
            <p className="mb-2"><i className="fa fa-phone-alt me-3"></i>+91 98765-AMAR-1</p>
            <p className="mb-2"><i className="fa fa-envelope me-3"></i>no.google.docs@amarrahohospital.com </p>
            <div className="d-flex pt-2">
              <a className="btn btn-outline-light btn-social rounded-circle" href=""><i className="fab fa-twitter"></i></a>
              <a className="btn btn-outline-light btn-social rounded-circle" href=""><i className="fab fa-facebook-f"></i></a>
              <a className="btn btn-outline-light btn-social rounded-circle" href=""><i className="fab fa-youtube"></i></a>
              <a className="btn btn-outline-light btn-social rounded-circle" href=""><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <h5 className="text-light mb-4">Services</h5>
            <Link className="btn btn-link" to="/services">Cardiology</Link>
            <Link className="btn btn-link" to="/services">Pulmonary</Link>
            <Link className="btn btn-link" to="/services">Neurology</Link>
            <Link className="btn btn-link" to="/services">Orthopedics</Link>
            <Link className="btn btn-link" to="/services">Laboratory</Link>
          </div>
          <div className="col-lg-3 col-md-6">
            <h5 className="text-light mb-4">Quick Links</h5>
            <Link className="btn btn-link" to="/about">About Us</Link>
            <Link className="btn btn-link" to="/contact">Contact Us</Link>
            <Link className="btn btn-link" to="/services">Our Services</Link>
            <a className="btn btn-link" href="">Terms & Condition</a>
            <a className="btn btn-link" href="">Support</a>
          </div>
          <div className="col-lg-3 col-md-6">
            <h5 className="text-light mb-4">Newsletter</h5>
            <p>The Truth: Subscribe to our newsletter to receive weekly medical articles that you will scroll past, fitness tips you will ignore, and constant reminders that your internet search history cannot cure a stomach ache..</p>
            <form onSubmit={handleSubscribe} className="position-relative mx-auto" style={{ maxWidth: '400px' }}>
              <input 
                className="form-control border-0 w-100 py-3 ps-4 pe-5" 
                type="email" 
                placeholder="Your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2">SignUp</button>
            </form>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="copyright">
          <div className="row">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              &copy; <Link className="border-bottom" to="/">Amar Raho Hospital</Link>, All Right Reserved.
            </div>
            <div className="col-md-6 text-center text-md-end">
              Designed By <a className="border-bottom" href="/">Two broke college students on 4 cups of cutting chai.</a>
              <br />
              Distributed By <a className="border-bottom" href="/" target="_blank" rel="noopener noreferrer">Amar Raho Tech Support </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
