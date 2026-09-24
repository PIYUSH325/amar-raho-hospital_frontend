import React from 'react';
import ScrollReveal from './ScrollReveal';

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  delay: string;
}

export const ServiceSection: React.FC = () => {
  const services: ServiceItem[] = [
    {
      icon: 'fa-heartbeat',
      title: 'Cardiology',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.1s',
    },
    {
      icon: 'fa-x-ray',
      title: 'Pulmonary',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.3s',
    },
    {
      icon: 'fa-brain',
      title: 'Neurology',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.5s',
    },
    {
      icon: 'fa-wheelchair',
      title: 'Orthopedics',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.1s',
    },
    {
      icon: 'fa-tooth',
      title: 'Dental Surgery',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.3s',
    },
    {
      icon: 'fa-vials',
      title: 'Laboratory',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo duo eos lorem sed diam stet diam sed stet.',
      delay: '0.5s',
    },
  ];

  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '600px' }}>
          <span className="badge bg-light text-primary border border-primary-subtle rounded-pill py-2 px-4 mb-3 fw-semibold">
            <i className="fa fa-stethoscope me-2"></i>Services
          </span>
          <h1 className="fw-bold">Health Care Solutions</h1>
        </div>
        <div className="row g-4">
          {services.map((service, index) => (
            <ScrollReveal 
              key={index} 
              animation="fadeInUp" 
              delay={service.delay} 
              className="col-lg-4 col-md-6"
            >
              <div className="curved-card service-item bg-white h-100 p-4 p-xl-5">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-4 shadow-sm" style={{ width: '70px', height: '70px', background: 'rgba(4, 99, 250, 0.08)' }}>
                  <i className={`fa ${service.icon} text-primary fs-3`}></i>
                </div>
                <h4 className="mb-3 fw-bold">{service.title}</h4>
                <p className="mb-4 text-muted">{service.description}</p>
                <a className="btn btn-pill-outline btn-sm py-2 px-4" href="#/service-details"><i className="fa fa-arrow-right me-2"></i>Read More</a>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceSection;
