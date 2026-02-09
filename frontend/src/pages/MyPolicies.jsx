import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileText, Shield, Download, ExternalLink, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { handlePayment } from '../utils/paymentUtils';

const MyPolicies = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId && userId !== 'undefined') {
            fetchMyPolicies(userId);
        } else {
            console.error("User ID not found or invalid");
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            localStorage.removeItem('token');
            navigate('/login');
            setLoading(false);
        }
    }, []);

    const fetchMyPolicies = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            // We use getCustomerById to retrieve the purchase history
            const res = await fetch(`${API_BASE_URL}/customer/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                // The purchasedPolicies field contains the list
                // It populates policy and policyType nested
                setPolicies(data.data.purchasedPolicies || []);
            } else {
                console.error("Failed to fetch policies");
            }
        } catch (error) {
            console.error("Error fetching policies:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#10b981';
            case 'expired': return '#64748b';
            case 'cancelled': return '#ef4444';
            case 'claimed': return '#f59e0b';
            case 'matured': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    const getStatusBadge = (status) => {
        const color = getStatusColor(status);
        const bgColor = `${color}20`; // 20% opacity
        return (
            <span style={{ 
                backgroundColor: bgColor, 
                color: color, 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                textTransform: 'capitalize'
            }}>
                {status === 'active' && <CheckCircle size={12} />}
                {status === 'expired' && <Clock size={12} />}
                {status === 'cancelled' && <AlertCircle size={12} />}
                {status === 'matured' && <CheckCircle size={12} />}
                {status}
            </span>
        );
    };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield className="text-blue-600" /> My Policies
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Manage and view your insurance policies</p>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={() => navigate('/customer/shop')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        Buy New Policy
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading your policies...</div>
                ) : policies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <div style={{ backgroundColor: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <FileText size={32} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>No Active Policies</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>You haven't purchased any policies yet.</p>
                        <button className="btn-primary" onClick={() => navigate('/customer/shop')}>
                            Browse Policies
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {policies.map((p, index) => {
                             const policy = p.policy; // The populated policy object
                             if (!policy) return null; // Handle corrupted data
                             
                             return (
                                <div key={index} style={{ 
                                    backgroundColor: 'white', 
                                    borderRadius: '1rem', 
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Card Header */}
                                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ 
                                                padding: '0.5rem', 
                                                backgroundColor: '#eff6ff', 
                                                borderRadius: '0.5rem',
                                                color: '#3b82f6'
                                            }}>
                                                <Shield size={24} />
                                            </div>
                                            {getStatusBadge(p.status)}
                                        </div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                                            {policy.policyName}
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {policy.policyType?.name || 'General Insurance'}
                                        </p>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '1.5rem', flex: 1 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Premium</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                                                    ${policy.premiumAmount?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Coverage</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                                                    ${policy.coverageAmount?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Purchase Date</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} />
                                                    {new Date(p.purchaseDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Tenure</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
                                                    {policy.tenureValue} {policy.tenureUnit}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Next Premium</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb' }}>
                                                    {p.nextPaymentDate 
                                                        ? new Date(p.nextPaymentDate).toLocaleDateString() 
                                                        : new Date(new Date(p.purchaseDate).setMonth(new Date(p.purchaseDate).getMonth() + 1)).toLocaleDateString()
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {p.policyDocument && (
                                            <a 
                                                href={`${API_BASE_URL.replace('/api', '')}/${p.policyDocument}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn-outline"
                                                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                                            >
                                                <Download size={16} /> Download Policy
                                            </a>
                                        )}

                                        <button 
                                            onClick={() => navigate(`/customer/payments?policyId=${policy._id}`)}
                                            style={{ 
                                                width: '100%', 
                                                marginTop: '0.75rem',
                                                padding: '0.5rem',
                                                background: 'none',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '0.5rem',
                                                color: '#64748b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Clock size={16} /> View Payment History
                                        </button>
                                    </div>

                                    {/* Card Footer */}
                                    <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        {(p.status === 'active' || p.status === 'matured') && (
                                            <button 
                                                onClick={() => navigate(`/customer/claims/new?policyId=${policy._id}`)}
                                                style={{ 
                                                    flex: 1,
                                                    padding: '0.5rem', 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #cbd5e1', 
                                                    borderRadius: '0.5rem',
                                                    color: '#475569',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                File a Claim <ExternalLink size={14} />
                                            </button>
                                        )}
                                        
                                        {p.status === 'claimed' && (
                                            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                               <CheckCircle size={16} /> Claim Submitted
                                            </div>
                                        )}
                                        
                                        {p.status === 'active' && (
                                            (() => {
                                                const isDue = !p.nextPaymentDate || new Date() >= new Date(p.nextPaymentDate);
                                                
                                                if (isDue) {
                                                    return (
                                                        <button 
                                                            onClick={() => {
                                                                const token = localStorage.getItem('token');
                                                                handlePayment({
                                                                    policyId: policy._id,
                                                                    token,
                                                                    API_BASE_URL,
                                                                    onSuccess: () => {
                                                                        alert("Payment Successful!");
                                                                        const userId = localStorage.getItem('userId');
                                                                        fetchMyPolicies(userId); // Refresh dates
                                                                    },
                                                                    onError: (err) => alert("Payment Failed: " + err.message)
                                                                });
                                                            }}
                                                            style={{ 
                                                                flex: 1,
                                                                padding: '0.5rem', 
                                                                backgroundColor: '#2563eb', 
                                                                border: 'none', 
                                                                borderRadius: '0.5rem',
                                                                color: 'white',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                                fontSize: '0.875rem',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                                            }}
                                                        >
                                                            Pay Premium
                                                        </button>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle size={14} /> Up to Date
                                                        </div>
                                                    );
                                                }
                                            })()
                                        )}

                                        {p.status === 'matured' && (
                                             <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={16} /> Fully Paid
                                             </div>
                                        )}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyPolicies;
