import React from 'react';
import PageHeader from '../components/PageHeader';
import AboutSection from '../components/AboutSection';
import FeatureSection from '../components/FeatureSection';
import TeamSection from '../components/TeamSection';

export const About: React.FC = () => {
  return (
    <>
      <PageHeader title="About Us" currentPage="About" />
      <AboutSection />
      <FeatureSection />
      <TeamSection />
    </>
  );
};

export default About;
