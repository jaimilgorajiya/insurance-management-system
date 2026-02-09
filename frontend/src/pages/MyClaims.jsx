import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileText, Plus, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle, Info } from 'lucide-react';

const MyClaims = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Check if we were redirected here with a specific policy filter
    const searchParams = new URLSearchParams(location.search);
    const policyIdFilter = searchParams.get('policyId');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [policyName, setPolicyName] = useState('');

    useEffect(() => {
        fetchClaims();
        if (policyIdFilter) fetchPolicyDetails();
    }, []);

    const fetchPolicyDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/policies/${policyIdFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPolicyName(data.data.policyName);
            }
        } catch (error) {
            console.error("Error fetching policy details:", error);
        }
    };

    const fetchClaims = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/claims`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setClaims(data.data);
            } else {
                console.error("Failed to fetch claims");
            }
        } catch (error) {
            console.error("Error fetching claims:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        let color = '#64748b';
        let icon = <Info size={14} />;
        
        switch (status) {
            case 'Approved':
            case 'Settled':
                color = '#10b981';
                icon = <CheckCircle size={14} />;
                break;
            case 'Rejected':
                color = '#ef4444';
                icon = <XCircle size={14} />;
                break;
            case 'Submitted':
            case 'Under Review':
                color = '#f59e0b';
                icon = <Clock size={14} />;
                break;
            case 'Info Required':
                color = '#3b82f6';
                icon = <AlertCircle size={14} />;
                break;
        }

        return (
            <span style={{ 
                backgroundColor: `${color}20`, 
                color: color, 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                {icon} {status}
            </span>
        );
    };

    const filteredClaims = claims.filter(claim => {
        if (statusFilter !== 'All' && claim.status !== statusFilter) return false;
        if (policyIdFilter && claim.policy?._id !== policyIdFilter) return false;
        return true;
    });

    const handleFileNewClaim = () => {
        let url = '/customer/claims/new';
        if (policyIdFilter) {
            url += `?policyId=${policyIdFilter}`;
        }
        navigate(url);
    };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText className="text-blue-600" /> My Claims
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Track the status of your insurance claims</p>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleFileNewClaim}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} /> File New Claim
                    </button>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <select 
                            className="form-select" 
                            style={{ paddingLeft: '2.5rem' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Settled">Settled</option>
                        </select>
                    </div>
                    {policyIdFilter && (
                         <div style={{ padding: '0.5rem 1rem', backgroundColor: '#eff6ff', borderRadius: '999px', color: '#3b82f6', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             Filter: {policyName || 'Specific Policy'}
                             <button onClick={() => navigate('/customer/claims')} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}>
                                 <XCircle size={16} color="#3b82f6" />
                             </button>
                         </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading claims...</div>
                ) : filteredClaims.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <div style={{ backgroundColor: '#f0f9ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <FileText size={32} color="#0ea5e9" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>No Claims Found</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            {statusFilter !== 'All' ? 'No claims match the selected filter.' : 'You haven\'t filed any claims yet.'}
                        </p>
                        {statusFilter === 'All' && (
                            <button className="btn-primary" onClick={handleFileNewClaim}>
                                File Your First Claim
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="claims-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredClaims.map((claim) => (
                            <div key={claim._id} style={{ 
                                backgroundColor: 'white', 
                                padding: '1.5rem', 
                                borderRadius: '1rem', 
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div style={{ minWidth: '200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{claim.claimNumber}</h3>
                                        {getStatusBadge(claim.status)}
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        {claim.policy?.policyName || 'Unknown Policy'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        Incident: {new Date(claim.incidentDate).toLocaleDateString()}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Type</p>
                                        <p style={{ fontWeight: 500, color: '#334155' }}>{claim.type}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Amount</p>
                                        <p style={{ fontWeight: 600, color: '#0f172a' }}>${claim.requestedAmount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Date Filed</p>
                                        <p style={{ fontSize: '0.875rem', color: '#334155' }}>{new Date(claim.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <button 
                                    className="btn-outline" 
                                    onClick={() => navigate(`/customer/claims/${claim._id}`)}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyClaims;
