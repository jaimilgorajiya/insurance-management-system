import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showErrorAlert } from '../utils/swalUtils';
import { Shield, Clock, DollarSign, User, Activity, AlertCircle, ArrowLeft, CheckCircle2, Building, Briefcase } from 'lucide-react';

const PolicyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/policies/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setPolicy(data.data);
                } else {
                    throw new Error(data.message || 'Failed to fetch policy');
                }
            } catch (error) {
                console.error(error);
                showErrorAlert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [id, API_BASE_URL]);

    if (loading) return <Layout><div className="center-screen">Loading policy details...</div></Layout>;
    if (!policy) return <Layout><div className="center-screen">Policy not found</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <button onClick={() => navigate('/admin/policies')} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.375rem', 
                            marginBottom: '1rem', 
                            padding: 0, 
                            color: '#64748b',
                            background: 'none',
                            border: 'none',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.9375rem'
                        }}>
                            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>←</span> Back to Policies
                        </button>
                        <h1 className="page-title">{policy.policyName}</h1>
                        <p className="page-subtitle">{policy.planName} • ID: {policy._id}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <span className={`badge-status ${policy.status}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            {policy.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="form-grid">
                    {/* Core Information */}
                    <div className="review-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <Shield className="text-primary" size={24} />
                            <h3 className="review-section-title" style={{ marginBottom: 0 }}>Core Policy Details</h3>
                        </div>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Policy Name</span>
                                <span className="review-value">{policy.policyName}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Plan Version</span>
                                <span className="review-value">{policy.planName}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Category</span>
                                <span className="review-value">
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '6px', 
                                        fontSize: '0.75rem',
                                        backgroundColor: '#eff6ff',
                                        color: '#1e40af',
                                        fontWeight: 600
                                    }}>
                                        {policy.policyType?.name || 'Uncategorized'}
                                    </span>
                                </span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Source</span>
                                <span className="review-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {policy.policySource === 'THIRD_PARTY' ? (
                                        <>
                                            <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Third-Party</span>
                                        </>
                                    ) : (
                                        <span style={{ color: '#64748b' }}>In-House</span>
                                    )}
                                </span>
                            </div>
                            {policy.policySource === 'THIRD_PARTY' && (
                                <div className="review-item">
                                    <span className="review-label">Insurance Provider</span>
                                    <span className="review-value" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0f172a' }}>
                                        <Building size={16} /> 
                                        {policy.provider?.name || 'Unknown Provider'}
                                    </span>
                                </div>
                            )}
                            <div className="review-item">
                                <span className="review-label">Renewable</span>
                                <span className="review-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {policy.renewable ? (
                                        <><CheckCircle2 size={16} className="text-success" /> Yes</>
                                    ) : (
                                        <><AlertCircle size={16} className="text-error" /> No</>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="review-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <DollarSign className="text-primary" size={24} />
                            <h3 className="review-section-title" style={{ marginBottom: 0 }}>Financial Breakdown</h3>
                        </div>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Premium Amount</span>
                                <span className="review-value" style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.25rem' }}>
                                    ${policy.premiumAmount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Sum Insured (Coverage)</span>
                                <span className="review-value" style={{ color: '#10b981', fontWeight: 700, fontSize: '1.25rem' }}>
                                    ${policy.coverageAmount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Benefit Multiplier</span>
                                <span className="review-value">
                                    {(policy.coverageAmount / policy.premiumAmount).toFixed(1)}x Premium
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Commission Structure */}
                    <div className="review-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <Briefcase className="text-primary" size={24} />
                            <h3 className="review-section-title" style={{ marginBottom: 0 }}>Commission Structure</h3>
                        </div>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Agent Commission</span>
                                <span className="review-value" style={{ color: '#ea580c', fontWeight: 700, fontSize: '1.25rem' }}>
                                    {policy.agentCommission || 0}%
                                    <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: '8px', fontWeight: 500 }}>
                                        (${((policy.agentCommission || 0) * policy.premiumAmount / 100).toLocaleString()})
                                    </span>
                                </span>
                            </div>
                            {policy.policySource === 'THIRD_PARTY' && (
                                <>
                                    <div className="review-item">
                                        <span className="review-label">Company Commission</span>
                                        <span className="review-value">
                                            {policy.companyCommission?.type === 'PERCENTAGE' 
                                                ? `${policy.companyCommission.value}%`
                                                : `$${policy.companyCommission?.value}`}
                                        </span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">Additional Commission</span>
                                        <span className="review-value">
                                            {policy.adminCommission?.type === 'PERCENTAGE' 
                                                ? `${policy.adminCommission.value}%`
                                                : `$${policy.adminCommission?.value}`}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tenure & Eligibility */}
                    <div className="review-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <Clock className="text-primary" size={24} />
                            <h3 className="review-section-title" style={{ marginBottom: 0 }}>Tenure & Eligibility</h3>
                        </div>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Standard Tenure</span>
                                <span className="review-value">{policy.tenureValue} {policy.tenureUnit}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Age Eligibility</span>
                                <span className="review-value">{policy.minAge} - {policy.maxAge} Years</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="review-section" style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <Activity className="text-primary" size={24} />
                            <h3 className="review-section-title" style={{ marginBottom: 0 }}>Policy Description & Benefits</h3>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', color: '#475569', lineHeight: 1.6 }}>
                            {policy.description || 'No additional description provided for this policy.'}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PolicyDetails;
