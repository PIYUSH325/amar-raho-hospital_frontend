import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Features from './pages/Features';
import Team from './pages/Team';
import Testimonial from './pages/Testimonial';
import Appointment from './pages/Appointment';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

// Auth Imports
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HospitalAIChatbot from './components/HospitalAIChatbot';

// Stylesheets
import './assets/css/bootstrap.min.css';
import './assets/css/animate.min.css';
import './assets/css/style.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/features" element={<Features />} />
            <Route path="/team" element={<Team />} />
            <Route path="/testimonial" element={<Testimonial />} />
            <Route 
              path="/appointment" 
              element={
                <ProtectedRoute>
                  <Appointment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor-portal" 
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <HospitalAIChatbot />
      </Router>
    </AuthProvider>
  );
};

export default App;
