import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

interface HospitalPolicyItem {
  _id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  extractedText: string;
  createdAt: string;
}

export const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<HospitalPolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const defaultHost = isLocal ? 'http://localhost:5001/api' : `http://${window.location.hostname}:5001/api`;
      const rawApiUrl = isLocal ? 'http://localhost:5001/api' : (import.meta.env.VITE_API_BASE_URL || defaultHost);
      const cleanBase = rawApiUrl.replace('/api', '');

      const res = await axios.get(`${cleanBase}/api/ai/policies`);
      if (res.data?.success) {
        setPolicies(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(policies.map(p => p.category)))];

  const filteredPolicies = policies.filter(policy => {
    const matchesCategory = selectedCategory === 'All' || policy.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = 
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.extractedText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('visiting') || cat.includes('ward') || cat.includes('icu')) return 'bg-info text-dark';
    if (cat.includes('insurance') || cat.includes('cashless') || cat.includes('tpa')) return 'bg-success text-white';
    if (cat.includes('refund') || cat.includes('opd')) return 'bg-warning text-dark';
    if (cat.includes('emergency') || cat.includes('ambulance')) return 'bg-danger text-white';
    return 'bg-primary text-white';
  };

  return (
    <div>
      <PageHeader title="Hospital Policies" currentPage="Policies" />

      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '700px' }}>
            <p className="d-inline-block border rounded-pill py-1 px-4 text-primary fw-bold">Official Regulations & Guidelines</p>
            <h1 className="mb-4">Amar Raho Hospital Policies</h1>
            <p className="text-muted">
              Transparent, patient-first hospital guidelines. Browse visiting hours, cashless insurance procedures, refund terms, and clinical protocols below.
            </p>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="card border-0 shadow-sm p-4 mb-5 rounded-4 bg-light">
            <div className="row g-3 align-items-center">
              <div className="col-md-7">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fa fa-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 shadow-none"
                    placeholder="Search policy titles, terms, or clause topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-5">
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1 ${
                        selectedCategory === cat ? 'btn-primary' : 'btn-outline-primary bg-white'
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading Policies...</span>
              </div>
              <p className="mt-3 text-muted">Retrieving hospital policy database...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-5 card border-0 shadow-sm rounded-4">
              <i className="fa fa-file-alt fa-3x text-muted mb-3"></i>
              <h4>No policies match your search</h4>
              <p className="text-muted mb-3">Try clearing search filters or searching for terms like "visiting", "insurance", "refund", or "emergency".</p>
              <div>
                <button 
                  className="btn btn-primary rounded-pill px-4"
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                >
                  Reset Search Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {filteredPolicies.map((policy) => {
                const isExpanded = expandedPolicyId === policy._id;
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const defaultHost = isLocal ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`;
                const rawApiUrl = isLocal ? 'http://localhost:5001' : (import.meta.env.VITE_API_BASE_URL || defaultHost);
                const baseUrl = rawApiUrl.replace('/api', '');
                const pdfLink = `${baseUrl}${policy.fileUrl}`;

                return (
                  <div key={policy._id} className="col-lg-6">
                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                      <div className="card-body p-4 d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span className={`badge ${getCategoryBadgeClass(policy.category)} px-3 py-2 rounded-pill fw-normal`}>
                            <i className="fa fa-shield-alt me-1"></i> {policy.category}
                          </span>
                          <span className="small text-muted">
                            <i className="far fa-calendar-alt me-1"></i>
                            {new Date(policy.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="card-title fw-bold text-dark mb-3">{policy.title}</h4>

                        {/* Policy Preview Text */}
                        <div className="text-secondary small mb-4 flex-grow-1" style={{ lineHeight: '1.7' }}>
                          {isExpanded ? (
                            <div className="bg-light p-3 rounded-3 border mb-3" style={{ maxHeight: '320px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                              {policy.extractedText}
                            </div>
                          ) : (
                            <p className="mb-0">
                              {policy.extractedText.slice(0, 220)}...
                            </p>
                          )}
                        </div>

                        {/* Action Toolbar */}
                        <div className="d-flex align-items-center justify-content-between pt-3 border-top gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => setExpandedPolicyId(isExpanded ? null : policy._id)}
                          >
                            <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-align-left'} me-1`}></i>
                            {isExpanded ? 'Hide Details' : 'Read Clauses'}
                          </button>

                          <a
                            href={pdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary rounded-pill px-3"
                          >
                            <i className="fa fa-file-pdf me-1"></i> Open PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Assistance Banner */}
          <div className="mt-5 card border-0 bg-primary text-white rounded-4 shadow-lg p-4 p-md-5">
            <div className="row align-items-center">
              <div className="col-lg-8 mb-3 mb-lg-0">
                <h3 className="text-white fw-bold mb-2">Have specific questions about hospital policies?</h3>
                <p className="mb-0 text-white-50">
                  Ask our AI Assistant! It is dynamically connected to the live database and can answer queries about clause details, insurance approval timelines, or visiting rules in seconds.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <button
                  type="button"
                  className="btn btn-light text-primary fw-bold px-4 py-3 rounded-pill shadow-sm"
                  onClick={() => {
                    const aiBtn = document.querySelector('.pulse-ai-btn') as HTMLElement;
                    if (aiBtn) aiBtn.click();
                  }}
                >
                  <i className="fa fa-robot me-2 text-primary"></i> Ask AI Assistant
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Policies;
