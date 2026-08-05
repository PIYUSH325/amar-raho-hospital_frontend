import React from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  currentPage: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, currentPage }) => {
  return (
    <div className="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
      <div className="container py-5">
        <h1 className="display-3 text-white mb-3 animated slideInDown">{title}</h1>
        <nav aria-label="breadcrumb animated slideInDown">
          <ol className="breadcrumb text-uppercase mb-0">
            <li className="breadcrumb-item"><Link className="text-white" to="/">Home</Link></li>
            <li className="breadcrumb-item"><span className="text-white">Pages</span></li>
            <li className="breadcrumb-item text-primary active" aria-current="page">{currentPage}</li>
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default PageHeader;
