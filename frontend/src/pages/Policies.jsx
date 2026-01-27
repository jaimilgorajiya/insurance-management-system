import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmAction, showConfirmDelete } from '../utils/swalUtils';
import { Eye, SquarePen, Trash2, Shield, Heart, Home, Car, Plane, Briefcase, Umbrella, Activity, Building, BriefcaseBusiness, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
// import ProvidersModal from '../components/ProvidersModal';

const Policies = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [policies, setPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
    const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
    const [providers, setProviders] = useState([]);
    const [currentPolicy, setCurrentPolicy] = useState(null);
    const [isCommissionOpen, setIsCommissionOpen] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [policyStats, setPolicyStats] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [selectForCustomer, setSelectForCustomer] = useState(null);
    const [customerName, setCustomerName] = useState('');

    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        source: 'All',
        provider: 'All'
    });

    const [formData, setFormData] = useState({
        policyName: '',
        policyType: '',
        planName: '',
        description: '',
        premiumAmount: '',
        agentCommission: '',
        coverageAmount: '',
        tenureValue: '',
        tenureUnit: '',
        minAge: 18,
        maxAge: 70,
        renewable: true,
        status: 'active',
        policySource: 'IN_HOUSE',
        provider: '',
        companyCommissionValue: '',
        companyCommissionType: 'PERCENTAGE',
        adminCommissionValue: '',
        adminCommissionType: 'PERCENTAGE'
    });

    const [formErrors, setFormErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const customerId = params.get('selectFor');
        if (customerId) {
            setSelectForCustomer(customerId);
            fetchCustomerName(customerId);
        }

        fetchPolicies();
        fetchPolicyTypes();
        fetchPolicies();
        fetchPolicyTypes();
        fetchProviders();
        fetchPolicyStats();
    }, [location.search]);

    const fetchCustomerName = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/details/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCustomerName(data.data.customer.name);
            }
        } catch (error) {
            console.error("Error fetching customer name");
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

    const fetchPolicyStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/policies/stats/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPolicyStats(data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
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

    const handleOpenModal = (policy = null, viewOnly = false) => {
        setIsViewOnly(viewOnly);
        if (policy) {
            setCurrentPolicy(policy);
            setFormData({
                policyName: policy.policyName,
                policyType: policy.policyType?._id || policy.policyType || '', 
                planName: policy.planName,
                description: policy.description || '',
                premiumAmount: policy.premiumAmount,
                agentCommission: policy.agentCommission || 0,
                coverageAmount: policy.coverageAmount,
                tenureValue: policy.tenureValue,
                tenureUnit: policy.tenureUnit || '',
                minAge: policy.minAge,
                maxAge: policy.maxAge,
                renewable: policy.renewable,
                status: policy.status,
                policySource: policy.policySource || 'IN_HOUSE',
                provider: policy.provider?._id || '',
                companyCommissionValue: policy.companyCommission?.value || '',
                companyCommissionType: policy.companyCommission?.type || 'PERCENTAGE',
                adminCommissionValue: policy.adminCommission?.value || '',
                adminCommissionType: policy.adminCommission?.type || 'PERCENTAGE'
            });
            setIsCommissionOpen(false); // Default closed in edit potentially, or keep user preference? User requested default closed.
        } else {
            setCurrentPolicy(null);
            setFormData({
                policyName: '',
                policyType: '',
                planName: '',
                description: '',
                premiumAmount: '',
                agentCommission: '',
                coverageAmount: '',
                tenureValue: '',
                tenureUnit: '',
                minAge: 18,
                maxAge: 70,
                renewable: true,
                renewable: true,
                status: 'active',
                policySource: 'IN_HOUSE',
                provider: '',
                companyCommissionValue: '',
                companyCommissionType: 'PERCENTAGE',
                adminCommissionValue: '',
                adminCommissionType: 'PERCENTAGE'
            });
            setIsCommissionOpen(false); // Default closed in new
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    const validateField = (name, value, currentData) => {
        let error = '';
        const data = { ...currentData, [name]: value };

        if (name === 'minAge' || name === 'maxAge') {
            if (Number(data.minAge) > Number(data.maxAge)) {
                error = 'Min age cannot be greater than max age';
            }
        }

        if (name === 'premiumAmount' || name === 'coverageAmount') {
            if (Number(data.coverageAmount) <= Number(data.premiumAmount) && data.coverageAmount !== '' && data.premiumAmount !== '') {
                error = 'Coverage must be greater than premium';
            }
        }

        if (name === 'tenureValue') {
            if (Number(value) <= 0) {
                error = 'Tenure must be at least 1';
            }
        }

        if (name === 'agentCommission') {
            if (Number(value) < 0 || Number(value) > 100) {
                error = 'Commission must be between 0% and 100%';
            }
        }

        setFormErrors(prev => {
            const newErrors = { ...prev };
            
            // Clear or set error for age group
            if (name === 'minAge' || name === 'maxAge') {
                if (error) {
                    newErrors.minAge = error;
                    newErrors.maxAge = error;
                } else {
                    delete newErrors.minAge;
                    delete newErrors.maxAge;
                }
            } 
            // Clear or set error for financial group
            else if (name === 'premiumAmount' || name === 'coverageAmount') {
                if (error) {
                    newErrors.premiumAmount = error;
                    newErrors.coverageAmount = error;
                } else {
                    delete newErrors.premiumAmount;
                    delete newErrors.coverageAmount;
                }
            }
            // Direct error for others
            else if (error) {
                newErrors[name] = error;
            } else {
                delete newErrors[name];
            }

            return newErrors;
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        
        if (type !== 'checkbox') {
            validateField(name, val, formData);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = currentPolicy 
                ? `${API_BASE_URL}/policies/${currentPolicy._id}`
                : `${API_BASE_URL}/policies`;
            const method = currentPolicy ? 'PUT' : 'POST';

            // map flat form fields back to nested structure if needed, or backend handles it?
            // Backend expects flat mostly but let's see. 
            // My backend controller expects: companyCommission: { value, type } but I'm sending flat values from state?
            // Actually the controller destructs `companyCommission` which is an object.
            // So I need to structure the payload.
            
            const payload = {
                ...formData,
                companyCommission: {
                    value: formData.companyCommissionValue || 0,
                    type: formData.companyCommissionType
                },
                adminCommission: {
                    value: formData.adminCommissionValue || 0,
                    type: formData.adminCommissionType
                }
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Operation failed');

            showSuccessAlert(currentPolicy ? 'Policy updated' : 'Policy created');
            setIsModalOpen(false);
            fetchPolicies();
            fetchPolicyStats();
        } catch (error) {
            console.error(error);
            showErrorAlert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';
        
        const confirmed = await showConfirmAction(
            'Confirm Status Change',
            `Are you sure you want to ${action} this policy?`,
            `Yes, ${action} it`,
            newStatus === 'active' ? '#10b981' : '#f59e0b'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/policies/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            
            showSuccessAlert(`Policy successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchPolicies();
        } catch (error) {
            showErrorAlert('Failed to update status');
        }
    };

    const handleDeletePolicy = async (id) => {
        const confirmed = await showConfirmDelete('policy');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/policies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete policy');
            
            showSuccessAlert('Policy deleted successfully');
            fetchPolicies();
            fetchPolicyStats();
        } catch (error) {
            showErrorAlert(error.message);
        }
    };

    const getBadgeStyle = (id, name = '') => {
        const premiumPalettes = [
            { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' }, // Blue
            { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' }, // Green
            { bg: '#faf5ff', text: '#6b21a8', dot: '#a855f7' }, // Purple
            { bg: '#fffbeb', text: '#92400e', dot: '#eab308' }, // Yellow
            { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' }, // Red
            { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' }, // Cyan
            { bg: '#f5f3ff', text: '#5b21b6', dot: '#8b5cf6' }, // Violet
            { bg: '#fff7ed', text: '#9a3412', dot: '#f97316' }  // Orange
        ];
        
        // Use a simple hash of the ID to consistently pick a color
        const seed = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
        return premiumPalettes[seed % premiumPalettes.length];
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

    const handleSelectPolicy = async (policy) => {
        const confirmed = await showConfirmAction(
            'Confirm Policy Selection',
            `Assign ${policy.policyName} to ${customerName}?`,
            'Yes, Assign Policy',
            '#2563eb'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer/update/${selectForCustomer}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ selectedPolicy: policy._id })
            });

            if (!res.ok) throw new Error('Failed to assign policy');

            await showSuccessAlert('Policy assigned successfully');
            navigate(`/admin/customers/${selectForCustomer}`);
        } catch (error) {
            console.error(error);
            showErrorAlert('Failed to assign policy');
        }
    };

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Policies</h1>
                        <p className="page-subtitle">Manage insurance policies and plans</p>
                    </div>
                    {selectForCustomer ? (
                         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                Selecting policy for: <strong>{customerName}</strong>
                            </div>
                            <button className="btn-outline" onClick={() => navigate(`/admin/customers/${selectForCustomer}`)}>Cancel</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-outline" onClick={() => navigate('/admin/policy-types')} style={{ backgroundColor: 'white' }}>
                                Policy Types
                            </button>
                            <button className="btn-outline" onClick={() => navigate('/admin/providers')} style={{ backgroundColor: 'white' }}>
                                Providers
                            </button>
                            <button className="btn-primary" onClick={() => handleOpenModal()}>
                                + Add Policy
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="filters-section" style={{ marginBottom: '1.5rem', background: 'transparent', padding: 0, border: 'none' }}>
                    <div className="search-filter" style={{ 
                        flex: 1, 
                        position: 'relative', 
                        padding: 0, 
                        border: 'none', 
                        backgroundColor: 'transparent' 
                    }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search by name, plan, or type..." 
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="form-input"
                                style={{ 
                                    paddingLeft: '40px',
                                    width: '100%',
                                    backgroundColor: 'white'
                                }}
                            />
                        </div>
                    </div>
                    <select 
                        className="form-select"
                        style={{ width: '150px', backgroundColor: 'white' }}
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
                            style={{ width: '180px', backgroundColor: 'white' }}
                            value={filters.provider}
                            onChange={(e) => setFilters({...filters, provider: e.target.value})}
                        >
                            <option value="All">All Providers</option>
                            {providers.filter(p => p.status === 'active').map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    )}

                    <select 
                        className="form-select"
                        style={{ width: '150px', backgroundColor: 'white' }}
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="All">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button 
                        className="btn-outline" 
                        onClick={() => setFilters({ search: '', status: 'All', source: 'All', provider: 'All' })}
                        style={{ height: '38px', backgroundColor: 'white' }}
                    >
                        Reset
                    </button>
                </div>

                {/* Dynamic Summary Cards */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div 
                        className="stat-card"
                        onClick={() => setSelectedType(null)}
                        style={{ 
                            cursor: 'pointer', 
                            padding: '1rem',
                            borderLeft: !selectedType ? '4px solid #2563eb' : '1px solid var(--border-color)',
                            backgroundColor: !selectedType ? '#eff6ff' : 'white',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: !selectedType ? 'translateY(-2px)' : 'none',
                            boxShadow: !selectedType ? '0 10px 15px -3px rgba(37, 99, 235, 0.1)' : 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-label" style={{ color: !selectedType ? '#1e40af' : '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Overall Policies</div>
                                <div className="stat-value" style={{ color: !selectedType ? '#1e40af' : '#0f172a', fontSize: '1.5rem' }}>{policies.length}</div>
                            </div>
                            <div style={{ 
                                padding: '6px', 
                                borderRadius: '8px', 
                                backgroundColor: !selectedType ? '#dbeafe' : '#f1f5f9',
                                color: !selectedType ? '#2563eb' : '#94a3b8'
                            }}>
                                <Shield size={18} />
                            </div>
                        </div>
                    </div>

                    {policyStats.map((stat) => {
                        const badge = getBadgeStyle(stat._id, stat.type);
                        const isActive = selectedType === stat._id;
                        return (
                            <div 
                                key={stat._id} 
                                className="stat-card"
                                onClick={() => setSelectedType(stat._id)}
                                style={{ 
                                    cursor: 'pointer', 
                                    padding: '1rem',
                                    borderLeft: isActive ? `4px solid ${badge.dot}` : '1px solid var(--border-color)',
                                    backgroundColor: isActive ? badge.bg : 'white',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isActive ? 'translateY(-2px)' : 'none',
                                    boxShadow: isActive ? `0 10px 15px -3px ${badge.dot}20` : 'var(--shadow-sm)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="stat-label" style={{ color: isActive ? badge.text : '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{stat.type}</div>
                                        <div className="stat-value" style={{ color: isActive ? badge.text : '#0f172a', fontSize: '1.5rem' }}>{stat.count}</div>
                                    </div>
                                    <div style={{ 
                                        padding: '6px', 
                                        borderRadius: '8px', 
                                        backgroundColor: isActive ? `${badge.dot}20` : '#f1f5f9',
                                        color: isActive ? badge.dot : '#94a3b8'
                                    }}>
                                        {getIconForPolicyType(stat.type)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    <div className="table-container">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Policy Name</th>
                                    <th>Type</th>
                                    <th>Premium</th>
                                    <th>Coverage</th>
                                    <th>Tenure</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {policies
                                    .filter(p => !selectedType || p.policyType?._id === selectedType)
                                    .filter(p => filters.status === 'All' || p.status === filters.status)
                                    .filter(p => filters.source === 'All' || p.policySource === filters.source)
                                    .filter(p => filters.provider === 'All' || p.provider?._id === filters.provider)
                                    .filter(p => {
                                        const search = filters.search.toLowerCase();
                                        return (
                                            p.policyName.toLowerCase().includes(search) ||
                                            p.planName.toLowerCase().includes(search) ||
                                            (p.policyType?.name || '').toLowerCase().includes(search)
                                        );
                                    })
                                    .map(policy => {
                                    const badge = getBadgeStyle(policy.policyType?._id, policy.policyType?.name);
                                    return (
                                        <tr key={policy._id}>
                                            <td style={{ fontWeight: 600 }}>
                                                <div>{policy.policyName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    {policy.policySource === 'THIRD_PARTY' ? (
                                                        <>
                                                            <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>3rd Party</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <Building size={10} />
                                                                {policy.provider?.name || 'Unknown Provider'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8' }}>In-House</span>
                                                    )}
                                                    <span>•</span>
                                                    {policy.planName}
                                                </div>
                                            </td>
                                            <td>
                                                {policy.policyType ? (
                                                    <span style={{ 
                                                        padding: '4px 10px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        backgroundColor: badge.bg,
                                                        color: badge.text,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.dot }}></span>
                                                        {policy.policyType.name}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="font-medium">${policy.premiumAmount?.toLocaleString()}</td>
                                           
                                            <td className="font-medium">${policy.coverageAmount?.toLocaleString()}</td>
                                            <td style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
                                                {policy.tenureValue} {policy.tenureUnit}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <label className="switch">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={policy.status === 'active'}
                                                            onChange={() => handleToggleStatus(policy._id, policy.status)}
                                                        />
                                                        <span className="slider-round"></span>
                                                    </label>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 600,
                                                        color: policy.status === 'active' ? '#10b981' : '#64748b',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {policy.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {selectForCustomer ? (
                                                        <button 
                                                            onClick={() => handleSelectPolicy(policy)}
                                                            className="btn-primary"
                                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem' }}
                                                            title="Select this policy"
                                                        >
                                                            <CheckCircle size={14} /> Select
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => navigate(`/admin/policies/${policy._id}`)}
                                                                className="action-btn view"
                                                                title="View"
                                                                style={{ color: '#2563eb' }}
                                                            >
                                                                <Eye size={18} strokeWidth={2} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOpenModal(policy)}
                                                                className="action-btn edit"
                                                                title="Edit"
                                                                style={{ color: '#64748b' }}
                                                            >
                                                                <SquarePen size={18} strokeWidth={2} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeletePolicy(policy._id)}
                                                                className="action-btn delete"
                                                                title="Delete"
                                                                style={{ color: '#ef4444' }}
                                                            >
                                                                <Trash2 size={18} strokeWidth={2} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {policies.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center" style={{ padding: '3rem' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '2rem' }}>📋</div>
                                            <div style={{ fontWeight: 600, color: '#64748b' }}>No policies found</div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Start by creating your first insurance policy.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {isViewOnly ? 'Policy Details' : currentPolicy ? 'Edit Policy' : 'New Policy'}
                                </h3>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={isViewOnly ? (e) => e.preventDefault() : handleSubmit} className="modal-body">
                                <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                                    
                                    {/* Source Selection */}
                                    <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <label className="form-label" style={{ marginBottom: '0.75rem' }}>Policy Source</label>
                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input 
                                                    type="radio" 
                                                    name="policySource" 
                                                    value="IN_HOUSE"
                                                    checked={formData.policySource === 'IN_HOUSE'}
                                                    onChange={handleInputChange}
                                                />
                                                <span style={{ fontWeight: 500 }}>In-House Policy</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input 
                                                    type="radio" 
                                                    name="policySource" 
                                                    value="THIRD_PARTY"
                                                    checked={formData.policySource === 'THIRD_PARTY'}
                                                    onChange={handleInputChange}
                                                />
                                                <span style={{ fontWeight: 500 }}>Third-Party Policy</span>
                                            </label>
                                        </div>
                                    
                                        {formData.policySource === 'THIRD_PARTY' && (
                                            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                                <label className="form-label">Insurance Company (Provider)</label>
                                                <select 
                                                    className="form-select"
                                                    name="provider"
                                                    value={formData.provider}
                                                    onChange={handleInputChange}
                                                    required={formData.policySource === 'THIRD_PARTY'}
                                                >
                                                    <option value="">Select Provider</option>
                                                    {providers.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                {providers.length === 0 && <div className="form-helper" style={{ color: '#ea580c' }}>No providers found. Please add one first from "Providers" button.</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 2: Core Policy Details */}
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        Policy Details
                                    </h4>
                                    <div className="form-grid">
                                        <div className="form-group form-group-full">
                                            <label className="form-label">Policy Name</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                name="policyName"
                                                value={formData.policyName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Comprehensive Term Life"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Policy Type</label>
                                            <select 
                                                className="form-select"
                                                name="policyType"
                                                value={formData.policyType}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {policyTypes.map(type => (
                                                    <option key={type._id} value={type._id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Plan Name</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                name="planName"
                                                value={formData.planName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Gold Plan"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Premium Amount ($)</label>
                                            <input 
                                                type="number" 
                                                className={`form-input ${formErrors.premiumAmount ? 'border-error' : ''}`}
                                                name="premiumAmount"
                                                value={formData.premiumAmount}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                            />
                                            {formErrors.premiumAmount && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.premiumAmount}</div>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Coverage Amount ($)</label>
                                            <input 
                                                type="number" 
                                                className={`form-input ${formErrors.coverageAmount ? 'border-error' : ''}`}
                                                name="coverageAmount"
                                                value={formData.coverageAmount}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                            />
                                            {formErrors.coverageAmount && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.coverageAmount}</div>}
                                        </div>
                                    </div>

                                    {/* Section 3: Eligibility & Duration */}
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        Eligibility & Duration
                                    </h4>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Tenure Value</label>
                                            <input 
                                                type="number" 
                                                className={`form-input ${formErrors.tenureValue ? 'border-error' : ''}`}
                                                name="tenureValue"
                                                value={formData.tenureValue}
                                                onChange={handleInputChange}
                                                required
                                                min="1"
                                                placeholder="e.g. 1"
                                            />
                                            {formErrors.tenureValue && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.tenureValue}</div>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Tenure Unit</label>
                                            <select 
                                                className="form-select"
                                                name="tenureUnit"
                                                value={formData.tenureUnit}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="" disabled>Select Unit</option>
                                                <option value="days">Days</option>
                                                <option value="months">Months</option>
                                                <option value="years">Years</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Min Age</label>
                                            <input 
                                                type="number" 
                                                className={`form-input ${formErrors.minAge ? 'border-error' : ''}`}
                                                name="minAge"
                                                value={formData.minAge}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {formErrors.minAge && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.minAge}</div>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Max Age</label>
                                            <input 
                                                type="number" 
                                                className={`form-input ${formErrors.maxAge ? 'border-error' : ''}`}
                                                name="maxAge"
                                                value={formData.maxAge}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {formErrors.maxAge && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.maxAge}</div>}
                                        </div>
                                    </div>
                                    
                                    {/* Section 4: Commission Details (Collapsible) */}
                                    <div style={{ marginTop: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div 
                                            onClick={() => setIsCommissionOpen(!isCommissionOpen)}
                                            style={{ 
                                                padding: '1rem', 
                                                backgroundColor: '#f8fafc', 
                                                cursor: 'pointer', 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center' 
                                            }}
                                        >
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                <BriefcaseBusiness size={16} /> Commission Details (Internal Use Only)
                                            </h4>
                                            {isCommissionOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                                        </div>
                                        
                                        {isCommissionOpen && (
                                            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                               
                                                
                                                <div className="form-grid">
                                                    {formData.policySource === 'THIRD_PARTY' && (
                                                        <>
                                                            <div className="form-group">
                                                                <label className="form-label">Company Commission (%)</label>
                                                                <input 
                                                                    type="number" 
                                                                    className="form-input" 
                                                                    name="companyCommissionValue"
                                                                    value={formData.companyCommissionValue}
                                                                    onChange={handleInputChange}
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="Company %"
                                                                />
                                                            </div>

                                                            <div className="form-group">
                                                                <label className="form-label">Additional Commission (%) <span style={{ fontWeight: 400, color: '#94a3b8', userId: 'select-none' }}>(Optional)</span></label>
                                                                <input 
                                                                    type="number" 
                                                                    className="form-input" 
                                                                    name="adminCommissionValue"
                                                                    value={formData.adminCommissionValue}
                                                                    onChange={handleInputChange}
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="Admin %"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="form-group">
                                                        <label className="form-label">Agent Commission (%)</label>
                                                        <input 
                                                            type="number" 
                                                            className={`form-input ${formErrors.agentCommission ? 'border-error' : ''}`}
                                                            name="agentCommission"
                                                            value={formData.agentCommission}
                                                            onChange={handleInputChange}
                                                            required
                                                            min="0"
                                                            max="100"
                                                            placeholder="Payable to Agent"
                                                        />
                                                        {formErrors.agentCommission && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '4px' }}>{formErrors.agentCommission}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 5: Additional Information */}
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        Additional Information
                                    </h4>
                                    <div className="form-group form-group-full">
                                        <label className="form-label">Description</label>
                                        <textarea 
                                            className="form-input" 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Write a brief overview of the policy benefits..."
                                        />
                                    </div>
                                    <div className="form-grid">
                                        {currentPolicy && (
                                            <div className="form-group">
                                                <label className="form-label">Status</label>
                                                <select 
                                                    className="form-select"
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label className="form-label" style={{ visibility: 'hidden' }}>Renewable</label>
                                            <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                                                <label className="inline-flex items-center" style={{ cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        name="renewable"
                                                        checked={formData.renewable}
                                                        onChange={handleInputChange}
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                                                    />
                                                    <span style={{ marginLeft: '10px', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Renewable Policy</span>
                                                </label>
                                            </div>
                                            <div className="form-helper">Allows renewal after policy expiry</div>
                                        </div>
                                    </div>
                                </fieldset>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ marginRight: '1rem' }}>
                                        {isViewOnly ? 'Close' : 'Cancel'}
                                    </button>
                                    {!isViewOnly && (
                                        <button 
                                            type="submit" 
                                            className="btn-primary" 
                                            disabled={
                                                isSubmitting || 
                                                Object.keys(formErrors).length > 0 ||
                                                !formData.policyName || 
                                                !formData.policyType || 
                                                !formData.tenureValue || 
                                                !formData.tenureUnit ||
                                                Number(formData.premiumAmount) <= 0 ||
                                                Number(formData.coverageAmount) <= 0
                                            }
                                        >
                                            {isSubmitting ? 'Saving...' : currentPolicy ? 'Update Policy' : 'Create Policy'}
                                        </button>
                                    )}
                                </div>
                                {(!formData.tenureValue || !formData.tenureUnit || Number(formData.coverageAmount) <= Number(formData.premiumAmount)) && (
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'right', fontWeight: 500 }}>
                                        * Please ensure Tenure is set and Coverage is greater than Premium.
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </div>
            {/* <ProvidersModal 
                isOpen={isProvidersModalOpen} 
                onClose={() => setIsProvidersModalOpen(false)} 
                onUpdate={(updatedProviders) => setProviders(updatedProviders)}
            /> */}
        </Layout>
    );
};

export default Policies;
