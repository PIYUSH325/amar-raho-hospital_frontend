import React from 'react';

export const Topbar: React.FC = () => {
  return (
    <div className="container-fluid bg-light p-0 border-bottom wow fadeIn" data-wow-delay="0.1s" style={{ fontSize: '12.5px' }}>
      <div className="row gx-0 d-none d-lg-flex align-items-center" style={{ minHeight: '34px' }}>
        <div className="col-lg-7 px-4 px-lg-5 text-start d-flex align-items-center">
          <div className="d-inline-flex align-items-center py-1 me-4">
            <small className="fa fa-map-marker-alt text-primary me-2"></small>
            <small className="text-secondary">Plot 404, Yamaraj Bypass Road, Near Swarg Lok U-Turn, Narak-Pur</small>
          </div>
          <div className="d-inline-flex align-items-center py-1">
            <small className="far fa-clock text-primary me-2"></small>
            <small className="text-secondary">Mon - Fri : 09:00 AM - 12:00 PM</small>
          </div>
        </div>
        <div className="col-lg-5 px-4 px-lg-5 text-end d-flex align-items-center justify-content-end">
          <div className="d-inline-flex align-items-center py-1 me-4">
            <small className="fa fa-phone-alt text-primary me-2"></small>
            <small className="fw-semibold text-secondary">+91 98765-AMAR-1</small>
          </div>
          <div className="d-inline-flex align-items-center py-1">
            <a 
              className="rounded-circle bg-white text-primary me-1 d-inline-flex align-items-center justify-content-center shadow-sm text-decoration-none" 
              style={{ width: '22px', height: '22px', fontSize: '10px' }} 
              href="#"
              title="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a 
              className="rounded-circle bg-white text-primary me-1 d-inline-flex align-items-center justify-content-center shadow-sm text-decoration-none" 
              style={{ width: '22px', height: '22px', fontSize: '10px' }} 
              href="#"
              title="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a 
              className="rounded-circle bg-white text-primary me-1 d-inline-flex align-items-center justify-content-center shadow-sm text-decoration-none" 
              style={{ width: '22px', height: '22px', fontSize: '10px' }} 
              href="#"
              title="LinkedIn"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a 
              className="rounded-circle bg-white text-primary me-0 d-inline-flex align-items-center justify-content-center shadow-sm text-decoration-none" 
              style={{ width: '22px', height: '22px', fontSize: '10px' }} 
              href="#"
              title="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
