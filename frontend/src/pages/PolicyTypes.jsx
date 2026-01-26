import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmAction, showConfirmDelete } from '../utils/swalUtils';
import { Eye, SquarePen, Trash2, ArrowLeft } from 'lucide-react';

const PolicyTypes = () => {
    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentType, setCurrentType] = useState(null); // For edit
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/policy-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTypes(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch policy types');
            }
        } catch (error) {
            console.error(error);
            showErrorAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type = null, viewOnly = false) => {
        setIsViewOnly(viewOnly);
        if (type) {
            setCurrentType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                status: type.status
            });
        } else {
            setCurrentType(null);
            setFormData({
                name: '',
                description: '',
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
            const url = currentType 
                ? `${API_BASE_URL}/admin/policy-types/${currentType._id}`
                : `${API_BASE_URL}/admin/policy-types`;
            const method = currentType ? 'PUT' : 'POST';

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

            showSuccessAlert(currentType ? 'Policy Type updated' : 'Policy Type created');
            setIsModalOpen(false);
            fetchTypes();
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
            `Are you sure you want to ${action} this policy category?`,
            `Yes, ${action} it`,
            newStatus === 'active' ? '#10b981' : '#f59e0b'
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/policy-types/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            
            showSuccessAlert(`Category successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchTypes();
        } catch (error) {
            showErrorAlert('Failed to update status');
        }
    };

    const handleDeleteType = async (id) => {
        const confirmed = await showConfirmDelete('policy category');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/policy-types/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message || 'Failed to delete category');
            
            showSuccessAlert('Category deleted successfully');
            fetchTypes();
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
                        <h1 className="page-title">Policy Types</h1>
                        <p className="page-subtitle">Manage insurance policy categories</p>
                    </div>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        + Add Policy Type
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    <div className="table-container">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Name & Style</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {types.map(type => {
                                    const badge = getBadgeStyle(type._id, type.name);
                                    return (
                                        <tr key={type._id}>
                                            <td style={{ fontWeight: 600 }}>
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
                                                    {type.name}
                                                </span>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{type.description || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <label className="switch">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={type.status === 'active'}
                                                            onChange={() => handleToggleStatus(type._id, type.status)}
                                                        />
                                                        <span className="slider-round"></span>
                                                    </label>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 600,
                                                        color: type.status === 'active' ? '#10b981' : '#64748b',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {type.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => handleOpenModal(type, true)}
                                                        className="action-btn view"
                                                        title="View"
                                                        style={{ color: '#2563eb' }}
                                                    >
                                                        <Eye size={18} strokeWidth={2} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenModal(type)}
                                                        className="action-btn edit"
                                                        title="Edit"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        <SquarePen size={18} strokeWidth={2} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteType(type._id)}
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
                                {types.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center" style={{ padding: '3rem' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '2rem' }}>📂</div>
                                            <div style={{ fontWeight: 600, color: '#64748b' }}>No categories found</div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Create types like Life, Health, or Vehicle insurance.</div>
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
                                    {isViewOnly ? 'Category Details' : currentType ? 'Edit Policy Type' : 'New Policy Type'}
                                </h3>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={isViewOnly ? (e) => e.preventDefault() : handleSubmit} className="modal-body">
                                <fieldset disabled={isViewOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                                    <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Life Insurance"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-input" 
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        rows="3"
                                        placeholder="Briefly describe what this category covers..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select 
                                        className="form-select"
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                </fieldset>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', marginTop: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ marginRight: '1rem' }}>
                                        {isViewOnly ? 'Close' : 'Cancel'}
                                    </button>
                                    {!isViewOnly && (
                                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : currentType ? 'Update Category' : 'Create Category'}
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

export default PolicyTypes;
