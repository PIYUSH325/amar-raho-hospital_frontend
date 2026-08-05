import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setIsCollapsed(true);
    setIsDropdownOpen(false);
    setIsUserDropdownOpen(false);
  };

  return (
    <nav 
      className={`navbar navbar-expand-lg bg-white navbar-light sticky-top p-0 ${isSticky ? 'shadow-sm' : ''}`}
      style={{ top: isSticky ? '0px' : '-100px', zIndex: 999 }}
    >
      <Link to="/" className="navbar-brand d-flex align-items-center px-4 px-lg-5" onClick={closeMenu}>
        <h1 className="m-0 text-primary"><i className="far fa-hospital me-3"></i>Amar Raho Hospital</h1>
      </Link>
      <button 
        type="button" 
        className="navbar-toggler me-4" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-controls="navbarCollapse"
        aria-expanded={!isCollapsed}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className={`collapse navbar-collapse ${!isCollapsed ? 'show' : ''}`} id="navbarCollapse">
        <div className="navbar-nav ms-auto p-4 p-lg-0">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-item nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => `nav-item nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            About
          </NavLink>
          <NavLink 
            to="/services" 
            className={({ isActive }) => `nav-item nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Service
          </NavLink>
          <div 
            className={`nav-item dropdown ${isDropdownOpen ? 'show' : ''}`}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <a 
              href="#" 
              className="nav-link dropdown-toggle" 
              onClick={(e) => {
                e.preventDefault();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              Pages
            </a>
            <div className={`dropdown-menu rounded-0 rounded-bottom m-0 ${isDropdownOpen ? 'show' : ''}`}>
              <NavLink to="/features" className="dropdown-item" onClick={closeMenu}>Feature</NavLink>
              <NavLink to="/team" className="dropdown-item" onClick={closeMenu}>Our Doctor</NavLink>
              <NavLink to="/appointment" className="dropdown-item" onClick={closeMenu}>Appointment</NavLink>
              <NavLink to="/testimonial" className="dropdown-item" onClick={closeMenu}>Testimonial</NavLink>
              <NavLink to="/404" className="dropdown-item" onClick={closeMenu}>404 Page</NavLink>
            </div>
          </div>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => `nav-item nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Contact
          </NavLink>

          {/* Authentication Links */}
          {user ? (
            <div 
              className={`nav-item dropdown ${isUserDropdownOpen ? 'show' : ''}`}
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={() => setIsUserDropdownOpen(false)}
            >
              <a 
                href="#" 
                className="nav-link dropdown-toggle text-primary fw-medium" 
                onClick={(e) => {
                  e.preventDefault();
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                }}
              >
                <i className="fa fa-user-circle me-1"></i> {user.name}
              </a>
              <div className={`dropdown-menu rounded-0 rounded-bottom m-0 ${isUserDropdownOpen ? 'show' : ''}`}>
                <button 
                  className="dropdown-item text-danger border-0 bg-transparent" 
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  <i className="fa fa-sign-out-alt me-2"></i> Logout
                </button>
              </div>
            </div>
          ) : (
            <NavLink 
              to="/login" 
              className={({ isActive }) => `nav-item nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <i className="fa fa-sign-in-alt me-1"></i> Sign In
            </NavLink>
          )}
        </div>
        <Link 
          to="/appointment" 
          className="btn btn-primary rounded-0 py-4 px-lg-5 d-none d-lg-block"
          onClick={closeMenu}
        >
          Appointment<i className="fa fa-arrow-right ms-3"></i>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
