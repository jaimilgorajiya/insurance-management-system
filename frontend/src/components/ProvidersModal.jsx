import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building } from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showConfirmDelete } from '../utils/swalUtils';

const ProvidersModal = ({ isOpen, onClose, onUpdate }) => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newProvider, setNewProvider] = useState({ name: '', contactEmail: '', contactPhone: '' });
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
        }
    }, [isOpen]);

    const fetchProviders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setProviders(data.data);
                if(onUpdate) onUpdate(data.data);
            }
        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProvider)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create provider');
            
            showSuccessAlert('Provider added successfully');
            setNewProvider({ name: '', contactEmail: '', contactPhone: '' });
            fetchProviders();
        } catch (error) {
            showErrorAlert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirmDelete('provider');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/providers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete provider');
            
            showSuccessAlert('Provider deleted');
            fetchProviders();
        } catch (error) {
            showErrorAlert(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Insurance Providers (Third-Party)</h3>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>
                <div className="modal-body">
                    {/* Add New Provider Form */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#475569' }}>Add New Company</h4>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Company Name *" 
                                value={newProvider.name}
                                onChange={e => setNewProvider({...newProvider, name: e.target.value})}
                                required
                            />
                            <input 
                                type="email" 
                                className="form-input" 
                                placeholder="Contact Email" 
                                value={newProvider.contactEmail}
                                onChange={e => setNewProvider({...newProvider, contactEmail: e.target.value})}
                            />
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contact Phone" 
                                value={newProvider.contactPhone}
                                onChange={e => setNewProvider({...newProvider, contactPhone: e.target.value})}
                            />
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={submitting || !newProvider.name}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={16} /> Add Company
                            </button>
                        </form>
                    </div>

                    {/* Providers List */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {loading ? <p className="text-center">Loading...</p> : (
                            <table className="customers-table" style={{ fontSize: '0.875rem' }}>
                                <thead>
                                    <tr>
                                        <th>Company Name</th>
                                        <th>Contact</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {providers.length === 0 ? (
                                        <tr><td colSpan="3" className="text-center">No providers found.</td></tr>
                                    ) : (
                                        providers.map(p => (
                                            <tr key={p._id}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Building size={14} className="text-primary" />
                                                        {p.name}
                                                    </div>
                                                </td>
                                                <td style={{ color: '#64748b' }}>{p.contactEmail || '-'}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleDelete(p._id)}
                                                        className="action-btn delete"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProvidersModal;
