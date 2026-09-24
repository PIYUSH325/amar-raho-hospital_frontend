import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import Counter from '../components/Counter';
import HeaderCarousel from '../components/HeaderCarousel';
import AboutSection from '../components/AboutSection';
import ServiceSection from '../components/ServiceSection';
import FeatureSection from '../components/FeatureSection';
import TeamSection from '../components/TeamSection';
import AppointmentForm from '../components/AppointmentForm';
import TestimonialSection from '../components/TestimonialSection';

export const Home: React.FC = () => {
  return (
    <>
      {/* Header / Carousel / Facts Start */}
      <div className="container-fluid header bg-primary position-relative overflow-hidden p-0 mb-5">
        <div className="row g-0 align-items-center flex-column-reverse flex-lg-row pb-5">
          <ScrollReveal animation="fadeIn" delay="0.1s" className="col-lg-6 p-5">
            <h1 className="display-4 text-white mb-5 fw-bold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
              Good Health Is The Root Of All Happiness
            </h1>
            <div className="row g-4">
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1 fw-bold">
                    <Counter end={123} />
                  </h2>
                  <p className="text-light mb-0 fw-medium">Expert Doctors</p>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1 fw-bold">
                    <Counter end={1234} />
                  </h2>
                  <p className="text-light mb-0 fw-medium">Medical Staff</p>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1 fw-bold">
                    <Counter end={12345} />
                  </h2>
                  <p className="text-light mb-0 fw-medium">Total Patients</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeIn" delay="0.5s" className="col-lg-6">
            <HeaderCarousel />
          </ScrollReveal>
        </div>

        {/* Continuous Full-Width Organic Wave Divider */}
        <div className="wavy-svg-divider position-absolute bottom-0 start-0 w-100" style={{ zIndex: 10, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height: '60px', display: 'block' }}>
            <path fill="#ffffff" fillOpacity="1" d="M0,32L60,42.7C120,53,240,75,360,80C480,85,600,75,720,58.7C840,43,960,21,1080,21.3C1200,21,1320,43,1380,53.3L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </div>
      </div>
      {/* Header / Carousel / Facts End */}

      <AboutSection />
      <ServiceSection />
      <FeatureSection />
      <TeamSection />
      <AppointmentForm />
      <TestimonialSection />
    </>
  );
};

export default Home;
