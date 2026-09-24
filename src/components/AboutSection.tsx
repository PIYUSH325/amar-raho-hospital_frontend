import React from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import about1 from '../assets/img/about-1.jpg';
import about2 from '../assets/img/about-2.jpg';

export const AboutSection: React.FC = () => {
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="row g-5 align-items-center">
          <ScrollReveal animation="fadeIn" delay="0.1s" className="col-lg-6">
            <div className="d-flex flex-column position-relative">
              <img className="img-fluid rounded-4 shadow-lg w-75 align-self-end hover-elevate" src={about1} alt="About 1" style={{ transition: 'transform 0.4s ease' }} />
              <img className="img-fluid rounded-4 shadow-lg w-50 bg-white p-2 glass-card" src={about2} alt="About 2" style={{ marginTop: '-25%', zIndex: 1, border: '4px solid #ffffff' }} />
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeIn" delay="0.5s" className="col-lg-6">
            <span className="badge bg-light text-primary border border-primary-subtle rounded-pill py-2 px-4 mb-3 fw-semibold">
              <i className="fa fa-info-circle me-2"></i>About Us
            </span>
            <h1 className="mb-4 fw-bold">Why You Should Trust Us? Get Know About Us!</h1>
            <p className="text-muted fs-5">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo magna dolore erat amet</p>
            <p className="mb-4 text-secondary">Stet no et lorem dolor et diam, amet duo ut dolore vero eos. No stet est diam rebum amet diam ipsum. Clita clita labore, dolor duo nonumy clita sit at, sed sit sanctus dolor eos.</p>
            <div className="row g-3 mb-4">
              <div className="col-sm-6">
                <p className="fw-medium"><i className="far fa-check-circle text-primary me-2"></i>Quality health care</p>
                <p className="fw-medium"><i className="far fa-check-circle text-primary me-2"></i>Only Qualified Doctors</p>
              </div>
              <div className="col-sm-6">
                <p className="fw-medium"><i className="far fa-check-circle text-primary me-2"></i>24/7 Emergency Support</p>
                <p className="fw-medium"><i className="far fa-check-circle text-primary me-2"></i>Medical Research Professionals</p>
              </div>
            </div>
            <Link className="btn btn-pill-primary py-3 px-5 mt-2" to="/about">Read More <i className="fa fa-arrow-right ms-2"></i></Link>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
