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
      <div className="container-fluid header bg-primary p-0 mb-5">
        <div className="row g-0 align-items-center flex-column-reverse flex-lg-row">
          <ScrollReveal animation="fadeIn" delay="0.1s" className="col-lg-6 p-5">
            <h1 className="display-4 text-white mb-5">Good Health Is The Root Of All Happiness</h1>
            <div className="row g-4">
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1">
                    <Counter end={123} />
                  </h2>
                  <p className="text-light mb-0">Expert Doctors</p>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1">
                    <Counter end={1234} />
                  </h2>
                  <p className="text-light mb-0">Medical Stuff</p>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="border-start border-light ps-4">
                  <h2 className="text-white mb-1">
                    <Counter end={12345} />
                  </h2>
                  <p className="text-light mb-0">Total Patients</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeIn" delay="0.5s" className="col-lg-6">
            <HeaderCarousel />
          </ScrollReveal>
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
