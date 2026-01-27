import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showConfirmAction } from '../utils/swalUtils';
import { Shield, Heart, Home, Car, Plane, Briefcase, Umbrella, Activity, Building, CheckCircle, ArrowLeft } from 'lucide-react';

const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const BuyPolicy = () => {
    const navigate = useNavigate();
    const { customerId } = useParams(); // Get customer ID from URL route
    const [policies, setPolicies] = useState([]);
    const [filteredPolicies, setFilteredPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerAge, setCustomerAge] = useState(0);
    const [selectedType, setSelectedType] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        source: 'All',
        provider: 'All'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (customerId) {
            fetchCustomerDetails(customerId);
        }
        fetchPolicies();
        fetchPolicyTypes();
        fetchProviders();
    }, [customerId]);

    // Filter effect
    useEffect(() => {
        let result = policies.filter(p => p.status === 'active'); // Only show active policies

        if (selectedType) {
            result = result.filter(p => p.policyType?._id === selectedType);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(p => 
                p.policyName.toLowerCase().includes(search) ||
                p.planName.toLowerCase().includes(search) ||
                (p.policyType?.name || '').toLowerCase().includes(search)
            );
        }

        if (filters.source !== 'All') {
            result = result.filter(p => p.policySource === filters.source);
        }

        if (filters.provider !== 'All') {
            result = result.filter(p => p.provider?._id === filters.provider);
        }

        setFilteredPolicies(result);
    }, [policies, selectedType, filters]);

    const fetchCustomerDetails = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/details/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCustomerName(data.data.customer.name);
                if (data.data.customer.dateOfBirth) {
                    setCustomerAge(calculateAge(data.data.customer.dateOfBirth));
                }
            }
        } catch (error) {
            console.error("Error fetching customer details");
        }
    };

    const fetchProviders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setProviders(data.data);
        } catch (error) {
            console.error("Error fetching providers");
        }
    };

    const fetchPolicies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/policies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPolicies(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPolicyTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/policy-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPolicyTypes(data.data.filter(t => t.status === 'active'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBuyPolicy = async (policy) => {
        const confirmed = await showConfirmAction(
            'Confirm Purchase',
            `Purchase ${policy.policyName} for ${customerName}?`,
            'Yes, Buy Policy',
            '#2563eb'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            // Using the update endpoint for now, or a specialized purchase endpoint if created
            const res = await fetch(`${API_BASE_URL}/customer/update/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ selectedPolicy: policy._id })
            });

            if (!res.ok) throw new Error('Failed to purchase policy');

            await showSuccessAlert('Policy purchased successfully');
            navigate(`/admin/customers/${customerId}`);
        } catch (error) {
            console.error(error);
            showErrorAlert('Failed to purchase policy');
        }
    };

    const getIconForPolicyType = (typeName = '') => {
        const name = typeName.toLowerCase();
        if (name.includes('health') || name.includes('medical')) return <Heart size={20} />;
        if (name.includes('home') || name.includes('house') || name.includes('property')) return <Home size={20} />;
        if (name.includes('car') || name.includes('motor') || name.includes('vehicle')) return <Car size={20} />;
        if (name.includes('travel') || name.includes('tour')) return <Plane size={20} />;
        if (name.includes('life')) return <Shield size={20} />;
        if (name.includes('accident') || name.includes('critical')) return <Activity size={20} />;
        if (name.includes('business')) return <Briefcase size={20} />;
        return <Umbrella size={20} />;
    };

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="btn-outline" 
                            style={{ padding: '0.5rem', border: 'none', backgroundColor: 'transparent' }}
                            onClick={() => navigate(`/admin/customers/${customerId}`)}
                        >
                            <ArrowLeft size={24} color="#64748b" />
                        </button>
                        <div>
                            <h1 className="page-title">Buy Policy</h1>
                            <p className="page-subtitle">Select a policy for <strong>{customerName}</strong></p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section" style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input 
                            type="text" 
                            placeholder="Search policies..." 
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <select 
                        className="form-select"
                        style={{ width: '150px' }}
                        value={filters.source}
                        onChange={(e) => setFilters({...filters, source: e.target.value, provider: 'All'})}
                    >
                        <option value="All">All Sources</option>
                        <option value="IN_HOUSE">In-House</option>
                        <option value="THIRD_PARTY">Third-Party</option>
                    </select>

                    {filters.source === 'THIRD_PARTY' && (
                        <select 
                            className="form-select"
                            style={{ width: '180px' }}
                            value={filters.provider}
                            onChange={(e) => setFilters({...filters, provider: e.target.value})}
                        >
                            <option value="All">All Providers</option>
                            {providers.filter(p => p.status === 'active').map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                    
                    <button 
                        className="btn-outline" 
                        onClick={() => {
                            setFilters({ search: '', source: 'All', provider: 'All' });
                            setSelectedType(null);
                        }}
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Policy Types Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => setSelectedType(null)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            border: !selectedType ? '1px solid #2563eb' : '1px solid #e2e8f0',
                            backgroundColor: !selectedType ? '#eff6ff' : 'white',
                            color: !selectedType ? '#2563eb' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        All Types
                    </button>
                    {policyTypes.map(type => (
                        <button
                            key={type._id}
                            onClick={() => setSelectedType(type._id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                border: selectedType === type._id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                backgroundColor: selectedType === type._id ? '#eff6ff' : 'white',
                                color: selectedType === type._id ? '#2563eb' : '#64748b',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                            }}
                        >
                            {getIconForPolicyType(type.name)}
                            {type.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center p-8">Loading policies...</div>
                ) : (
                    <div className="policy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                        {(() => {
                            if (filteredPolicies.length === 0) {
                                return (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>No policies found</h3>
                                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>No policies match your search or filter criteria.</p>
                                        <button className="btn-outline" onClick={() => { setFilters({ search: '', source: 'All', provider: 'All' }); setSelectedType(null); }}>Clear all filters</button>
                                    </div>
                                );
                            }

                            const hasEligible = filteredPolicies.some(p => customerAge >= (p.minAge || 0) && customerAge <= (p.maxAge || 100));
                            
                            if (!hasEligible && filteredPolicies.length > 0) {
                                return (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#fff1f2', borderRadius: '12px', border: '1px dashed #fecaca' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e11d48', marginBottom: '0.5rem' }}>No Eligible Policies Found</h3>
                                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>
                                            Based on the customer's age (<strong>{customerAge} years</strong>), no policies in this category are eligible.
                                        </p>
                                        <button className="btn-outline" onClick={() => setSelectedType(null)}>View All Categories</button>
                                    </div>
                                );
                            }

                            return filteredPolicies.map(policy => {
                                const isEligible = customerAge >= (policy.minAge || 0) && customerAge <= (policy.maxAge || 100);
                                return (
                                    <div key={policy._id} style={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '16px', 
                                        border: '1px solid #e2e8f0',
                                        padding: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        opacity: isEligible ? 1 : 0.7,
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '9999px', 
                                                    backgroundColor: policy.policySource === 'THIRD_PARTY' ? '#fff7ed' : '#f0fdf4',
                                                    color: policy.policySource === 'THIRD_PARTY' ? '#c2410c' : '#15803d',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    border: `1px solid ${policy.policySource === 'THIRD_PARTY' ? '#fdba74' : '#86efac'}`
                                                }}>
                                                    {policy.policySource === 'THIRD_PARTY' ? 'Third-Party' : 'In-House'}
                                                </div>
                                                
                                                {!isEligible && (
                                                    <div style={{ 
                                                        padding: '0.25rem 0.75rem', 
                                                        borderRadius: '9999px', 
                                                        backgroundColor: '#fef2f2',
                                                        color: '#ef4444',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        border: '1px solid #fecaca'
                                                    }}>
                                                        Age Ineligible
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ 
                                                color: '#64748b', 
                                                fontSize: '0.875rem', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.25rem',
                                                fontWeight: 500
                                            }}>
                                                {getIconForPolicyType(policy.policyType?.name)}
                                                {policy.policyType?.name}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                                            {policy.policyName}
                                        </h3>
                                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{policy.planName}</p>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>${policy.premiumAmount?.toLocaleString()}</span>
                                                <span style={{ color: '#64748b' }}>/ {policy.tenureValue} {policy.tenureUnit}</span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Coverage up to <strong style={{ color: '#334155' }}>${policy.coverageAmount?.toLocaleString()}</strong></span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                                Eligible Age: <strong style={{ color: isEligible ? '#64748b' : '#ef4444' }}>{policy.minAge} - {policy.maxAge} years</strong>
                                                {!isEligible && ` (Customer: ${customerAge})`}
                                            </div>
                                        </div>

                                        {policy.provider && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                                <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                    <Building size={16} color="#64748b" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Provider</div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>{policy.provider.name}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 'auto' }}>
                                            <button 
                                                className={isEligible ? "btn-primary" : "btn-secondary disabled"} 
                                                style={{ width: '100%', justifyContent: 'center', cursor: isEligible ? 'pointer' : 'not-allowed' }}
                                                onClick={() => isEligible && handleBuyPolicy(policy)}
                                                disabled={!isEligible}
                                            >
                                                {isEligible ? 'Buy Policy' : 'Age Ineligible'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BuyPolicy;
