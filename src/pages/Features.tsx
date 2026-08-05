import React from 'react';
import PageHeader from '../components/PageHeader';
import FeatureSection from '../components/FeatureSection';

export const Features: React.FC = () => {
  return (
    <>
      <PageHeader title="Features" currentPage="Features" />
      <FeatureSection />
    </>
  );
};

export default Features;
