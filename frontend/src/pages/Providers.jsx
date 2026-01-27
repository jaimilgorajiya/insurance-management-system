import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showConfirmAction, showConfirmDelete } from '../utils/swalUtils';
import { Eye, SquarePen, Trash2, Building } from 'lucide-react';

const Providers = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentProvider, setCurrentProvider] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        contactPhone: '',
        status: 'active'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setProviders(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch providers');
            }
        } catch (error) {
            console.error(error);
            showErrorAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (provider = null, viewOnly = false) => {
        setIsViewOnly(viewOnly);
        if (provider) {
            setCurrentProvider(provider);
            setFormData({
                name: provider.name,
                contactEmail: provider.contactEmail || '',
                contactPhone: provider.contactPhone || '',
                status: provider.status
            });
        } else {
            setCurrentProvider(null);
            setFormData({
                name: '',
                contactEmail: '',
                contactPhone: '',
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = currentProvider 
                ? `${API_BASE_URL}/providers/${currentProvider._id}`
                : `${API_BASE_URL}/providers`;
            const method = currentProvider ? 'PUT' : 'POST';

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

            showSuccessAlert(currentProvider ? 'Provider updated' : 'Provider created');
            setIsModalOpen(false);
            fetchProviders();
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
            `Are you sure you want to ${action} this provider?`,
            `Yes, ${action} it`,
            newStatus === 'active' ? '#10b981' : '#f59e0b'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');
            
            showSuccessAlert(`Provider successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchProviders();
        } catch (error) {
            showErrorAlert('Failed to update status');
        }
    };

    const handleDeleteProvider = async (id) => {
        const confirmed = await showConfirmDelete('provider');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message || 'Failed to delete provider');
            
            showSuccessAlert('Provider deleted successfully');
            fetchProviders();
        } catch (error) {
            showErrorAlert(error.message);
        }
    };

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
                        <h1 className="page-title">Insurance Providers</h1>
                        <p className="page-subtitle">Manage third-party insurance companies</p>
                    </div>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        + Add Provider
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    <div className="table-container">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Company Name</th>
                                    <th>Contact Email</th>
                                    <th>Contact Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {providers.map(provider => (
                                    <tr key={provider._id}>
                                        <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Building size={16} className="text-primary" />
                                            {provider.name}
                                        </td>
                                        <td style={{ color: '#64748b' }}>{provider.contactEmail || '-'}</td>
                                        <td style={{ color: '#64748b' }}>{provider.contactPhone || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <label className="switch">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={provider.status === 'active'}
                                                        onChange={() => handleToggleStatus(provider._id, provider.status)}
                                                    />
                                                    <span className="slider-round"></span>
                                                </label>
                                                <span style={{ 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 600,
                                                    color: provider.status === 'active' ? '#10b981' : '#64748b',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {provider.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => handleOpenModal(provider, true)}
                                                    className="action-btn view"
                                                    title="View"
                                                    style={{ color: '#2563eb' }}
                                                >
                                                    <Eye size={18} strokeWidth={2} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenModal(provider)}
                                                    className="action-btn edit"
                                                    title="Edit"
                                                    style={{ color: '#64748b' }}
                                                >
                                                    <SquarePen size={18} strokeWidth={2} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteProvider(provider._id)}
                                                    className="action-btn delete"
                                                    title="Delete"
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <Trash2 size={18} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {providers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center" style={{ padding: '3rem' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '2rem' }}>🏢</div>
                                            <div style={{ fontWeight: 600, color: '#64748b' }}>No providers found</div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Add insurance companies to manage third-party policies.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {isViewOnly ? 'Provider Details' : currentProvider ? 'Edit Provider' : 'New Provider'}
                                </h3>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={isViewOnly ? (e) => e.preventDefault() : handleSubmit} className="modal-body">
                                <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                                    <div className="form-group">
                                        <label className="form-label">Company Name</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="e.g. Allianz"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Email</label>
                                        <input 
                                            type="email" 
                                            className="form-input" 
                                            value={formData.contactEmail}
                                            onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                                            placeholder="contact@company.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Phone</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            value={formData.contactPhone}
                                            onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>

                                </fieldset>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', marginTop: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ marginRight: '1rem' }}>
                                        {isViewOnly ? 'Close' : 'Cancel'}
                                    </button>
                                    {!isViewOnly && (
                                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : currentProvider ? 'Update Provider' : 'Create Provider'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Providers;
