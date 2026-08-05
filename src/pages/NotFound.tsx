import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ScrollReveal from '../components/ScrollReveal';

export const NotFound: React.FC = () => {
  return (
    <>
      <PageHeader title="404 Error" currentPage="404 Error" />
      
      {/* 404 Start */}
      <ScrollReveal animation="fadeInUp" delay="0.1s" className="container-xxl py-5">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <i className="bi bi-exclamation-triangle display-1 text-primary"></i>
              <h1 className="display-1">404</h1>
              <h1 className="mb-4">Page Not Found</h1>
              <p className="mb-4">We’re sorry, the page you have looked for does not exist in our website! Maybe go to our home page or try to use a search?</p>
              <Link className="btn btn-primary rounded-pill py-3 px-5" to="/">Go Back To Home</Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
      {/* 404 End */}
    </>
  );
};

export default NotFound;
