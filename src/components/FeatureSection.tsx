import React from 'react';
import ScrollReveal from './ScrollReveal';
import featureImg from '../assets/img/feature.jpg';

export const FeatureSection: React.FC = () => {
  return (
    <div className="container-xxl py-5 my-5">
      <div className="container bg-primary rounded-5 shadow-lg overflow-hidden position-relative p-0">
        <div className="row g-0 align-items-stretch">
          {/* Left Text & Features Column */}
          <ScrollReveal animation="fadeInLeft" delay="0.1s" className="col-lg-6 feature-text py-5 px-4 px-lg-5 d-flex flex-column justify-content-center">
            <div className="py-lg-3">
              <span className="badge bg-white text-primary rounded-pill py-2 px-4 mb-3 fw-semibold shadow-sm">
                <i className="fa fa-star me-2"></i>Features
              </span>
              <h1 className="text-white mb-3 fw-bold display-5">Why Choose Us</h1>
              <p className="text-white-50 mb-4 pb-2 fs-5" style={{ lineHeight: '1.6' }}>
                Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet.
              </p>
              
              {/* 4 Feature Items Grid with High-Contrast Text & 3D Hover Effect */}
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-center bg-white p-3 rounded-4 shadow-sm hover-3d-card h-100" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary me-3 shadow-sm" style={{ width: '52px', height: '52px', background: 'rgba(37, 99, 235, 0.12)' }}>
                      <i className="fa fa-user-md text-primary fs-4"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0 small fw-semibold">Experience</p>
                      <h6 className="text-dark mb-0 fw-bold fs-6">Doctors</h6>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-center bg-white p-3 rounded-4 shadow-sm hover-3d-card h-100" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary me-3 shadow-sm" style={{ width: '52px', height: '52px', background: 'rgba(37, 99, 235, 0.12)' }}>
                      <i className="fa fa-check text-primary fs-4"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0 small fw-semibold">Quality</p>
                      <h6 className="text-dark mb-0 fw-bold fs-6">Services</h6>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-center bg-white p-3 rounded-4 shadow-sm hover-3d-card h-100" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary me-3 shadow-sm" style={{ width: '52px', height: '52px', background: 'rgba(37, 99, 235, 0.12)' }}>
                      <i className="fa fa-comment-medical text-primary fs-4"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0 small fw-semibold">Positive</p>
                      <h6 className="text-dark mb-0 fw-bold fs-6">Consultation</h6>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-center bg-white p-3 rounded-4 shadow-sm hover-3d-card h-100" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary me-3 shadow-sm" style={{ width: '52px', height: '52px', background: 'rgba(37, 99, 235, 0.12)' }}>
                      <i className="fa fa-headphones text-primary fs-4"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0 small fw-semibold">24 Hours</p>
                      <h6 className="text-dark mb-0 fw-bold fs-6">Support</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Image Column with Pixel-Perfect Clipping & Height Matching */}
          <ScrollReveal animation="fadeInRight" delay="0.3s" className="col-lg-6 position-relative d-none d-lg-block">
            <div className="h-100 w-100 overflow-hidden" style={{ minHeight: '450px' }}>
              <img 
                className="w-100 h-100" 
                src={featureImg} 
                style={{ objectFit: 'cover', objectPosition: 'center' }} 
                alt="Why Choose Us Feature" 
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
