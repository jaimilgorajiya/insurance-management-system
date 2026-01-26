import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmAction, showConfirmDelete } from '../utils/swalUtils';
import { Eye, SquarePen, Trash2 } from 'lucide-react';

const Policies = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [policyStats, setPolicyStats] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    const [formData, setFormData] = useState({
        policyName: '',
        policyType: '',
        planName: '',
        description: '',
        premiumAmount: '',
        coverageAmount: '',
        tenureValue: '',
        tenureUnit: '',
        minAge: 18,
        maxAge: 70,
        renewable: true,
        status: 'active'
    });

    const [formErrors, setFormErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchPolicies();
        fetchPolicyTypes();
        fetchPolicyStats();
    }, []);

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
                coverageAmount: policy.coverageAmount,
                tenureValue: policy.tenureValue,
                tenureUnit: policy.tenureUnit || '',
                minAge: policy.minAge,
                maxAge: policy.maxAge,
                renewable: policy.renewable,
                status: policy.status
            });
        } else {
            setCurrentPolicy(null);
            setFormData({
                policyName: '',
                policyType: '',
                planName: '',
                description: '',
                premiumAmount: '',
                coverageAmount: '',
                tenureValue: '',
                tenureUnit: '',
                minAge: 18,
                maxAge: 70,
                renewable: true,
                status: 'active'
            });
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

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
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

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Policies</h1>
                        <p className="page-subtitle">Manage insurance policies and plans</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-outline" onClick={() => navigate('/admin/policy-types')} style={{ backgroundColor: 'white' }}>
                            Manage Policy Types
                        </button>
                        <button className="btn-primary" onClick={() => handleOpenModal()}>
                            + Add Policy
                        </button>
                    </div>
                </div>

                {/* Dynamic Summary Cards */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div 
                        className="stat-card"
                        onClick={() => setSelectedType(null)}
                        style={{ 
                            cursor: 'pointer', 
                            borderLeft: !selectedType ? '4px solid #2563eb' : '1px solid var(--border-color)',
                            backgroundColor: !selectedType ? '#f8fafc' : 'white',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div className="stat-label">Overall Policies</div>
                        <div className="stat-value">{policies.length}</div>
                        <div className="stat-trend" style={{ color: '#2563eb' }}>Show All</div>
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
                                    borderLeft: isActive ? `4px solid ${badge.dot}` : '1px solid var(--border-color)',
                                    backgroundColor: isActive ? badge.bg : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div className="stat-label">{stat.type}</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="stat-value">{stat.count}</div>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.7rem', 
                                        backgroundColor: badge.bg, 
                                        color: badge.text,
                                        fontWeight: 700
                                    }}>
                                        Active Type
                                    </span>
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
                                    .map(policy => {
                                    const badge = getBadgeStyle(policy.policyType?._id, policy.policyType?.name);
                                    return (
                                        <tr key={policy._id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {policy.policyName}
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{policy.planName}</div>
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
                                        <div className="form-helper">Policy duration used when customer purchases the policy</div>
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
        </Layout>
    );
};

export default Policies;
