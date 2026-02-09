import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showConfirmAction } from '../utils/swalUtils';
import { Shield, Heart, Home, Car, Plane, Briefcase, Umbrella, Activity, Building, ShoppingBag } from 'lucide-react';

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

const ShopPolicies = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [filteredPolicies, setFilteredPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState([]);
    const [customerAge, setCustomerAge] = useState(0);
    const [selectedType, setSelectedType] = useState(null);
    const [userId, setUserId] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        source: 'All',
        provider: 'All'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId && storedUserId !== 'undefined') {
            setUserId(storedUserId);
            fetchMyDetails(storedUserId);
        } else {
            console.error("Invalid User ID in storage");
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            localStorage.removeItem('token');
            navigate('/login');
        }
        fetchPolicies();
        fetchPolicyTypes();
        fetchProviders();
    }, []);

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

    const fetchMyDetails = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.data.dateOfBirth) {
                    setCustomerAge(calculateAge(data.data.dateOfBirth));
                }
            }
        } catch (error) {
            console.error("Error fetching my details");
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
            `Are you sure you want to purchase ${policy.policyName}?`,
            'Yes, Buy Now',
            '#2563eb'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ selectedPolicy: policy._id })
            });

            if (!res.ok) throw new Error('Failed to purchase policy');

            await showSuccessAlert('Policy purchased successfully! Check "My Policies" for details.');
            navigate('/customer/policies');
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
            <div className="customers-page">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                Browse Policies
                            </h1>
                            <p className="page-subtitle">Find and purchase the perfect protection for you.</p>
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
                    <div className="text-center p-8">Loading available policies...</div>
                ) : (
                    <div className="policy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                        {(() => {
                            if (filteredPolicies.length === 0) {
                                return (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>No policies found</h3>
                                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>Try adjusting your search filters.</p>
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
                                        opacity: isEligible ? 1 : 0.7
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
                                            </div>
                                        </div>

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

export default ShopPolicies;
