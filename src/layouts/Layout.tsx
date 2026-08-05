import React from 'react';
import Spinner from '../components/Spinner';
import Topbar from '../components/Topbar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Spinner />
      <Topbar />
      <Navbar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
};

export default Layout;
