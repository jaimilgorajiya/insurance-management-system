import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showWarningAlert, showSuccessAlert, showErrorAlert } from '../utils/swalUtils';

const AgentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        status: 'active'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchAgent();
    }, [id]);

    const fetchAgent = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const found = data.agents.find(a => a._id === id);
            
            if (found) {
                setAgent(found);
            } else {
                showWarningAlert('Agent not found');
                navigate('/admin/agents');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setFormData({
            name: agent.name,
            email: agent.email,
            mobile: agent.mobile,
            status: agent.status
        });
        setErrors({});
        setIsEditModalOpen(true);
    };

    const validateField = (name, value) => {
        let error = '';
        if (name === 'mobile') {
             if (value.length !== 10) error = 'Mobile number must be exactly 10 digits';
             if (!/^\d*$/.test(value)) error = 'Mobile number must contain only digits';
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'mobile') {
             if (!/^\d*$/.test(value)) return;
             if (value.length > 10) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleUpdateAgent = async (e) => {
        e.preventDefault();
        
        // Final validation check
        if (formData.mobile.length !== 10) {
            setErrors(prev => ({ ...prev, mobile: 'Mobile number must be exactly 10 digits' }));
            return;
        }

        setIsSubmitting(true);
        // ... rest of submit
        try {
            // ...
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/update/${agent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update agent');

            // Update local state
            setAgent(prev => ({ ...prev, ...formData }));
            
            setIsEditModalOpen(false);
            showSuccessAlert('Agent updated successfully');
        } catch (error) {
            console.error("Error updating agent:", error);
            showErrorAlert('Failed to update agent');
        } finally {
            setIsSubmitting(false);
        }
    };

    const AgentAvatar = ({ name, size = 'large' }) => (
        <div style={{
            width: size === 'large' ? '80px' : '40px', 
            height: size === 'large' ? '80px' : '40px', 
            borderRadius: '50%', 
            backgroundColor: '#0f766e', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 'bold',
            fontSize: size === 'large' ? '2rem' : '1rem'
        }}>
            {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
    );

    if (loading) return <Layout><div className="center-screen">Loading...</div></Layout>;
    if (!agent) return <Layout><div className="center-screen">Agent not found</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <button onClick={() => navigate('/admin/agents')} className="btn-outline" style={{marginBottom: '1rem', border: 'none', paddingLeft: 0}}>
                            ← Back to Agents
                        </button>
                        <h1 className="page-title">{agent.name}</h1>
                        <p className="page-subtitle">Agent ID: {agent._id}</p>
                    </div>
                    <div className="header-actions">
                         <span className={`badge-status ${agent.status}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
                            {agent.status}
                        </span>
                        <button className="btn-primary" onClick={handleEditClick}>
                            Edit Agent
                        </button>
                    </div>
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="review-section">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <AgentAvatar name={agent.name} />
                            <div style={{ marginLeft: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{agent.name}</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>{agent.role.toUpperCase()}</p>
                            </div>
                        </div>
                        
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Email</span>
                                <span className="review-value">{agent.email}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Phone</span>
                                <span className="review-value">{agent.mobile}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Joined Date</span>
                                <span className="review-value">{new Date(agent.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="review-section">
                        <h3 className="review-section-title">Performance Metrics</h3>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Total Customers</span>
                                <span className="review-value">0</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Active Policies</span>
                                <span className="review-value">0</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Total Commission</span>
                                <span className="review-value">$0.00</span>
                            </div>
                             <div className="review-item" style={{display:'block'}}>
                                <span className="review-label" style={{marginBottom:'0.5rem', display:'block'}}>Target Completion</span>
                                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '0%', height: '100%', backgroundColor: '#10b981' }}></div>
                                </div>
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.875rem', color: '#94a3b8' }}>
                            * Performance metrics are placeholders pending policy integration.
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Agent Modal */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem',
                        width: '100%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Edit Agent</h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateAgent}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Email (Read-only)</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    disabled
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: '#f1f5f9' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Phone</label>
                                <input 
                                    type="tel" 
                                    name="mobile"
                                    className="form-input"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                                {errors.mobile && <span style={{color: 'red', fontSize: '0.875rem'}}>{errors.mobile}</span>}
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Status</label>
                                <select 
                                    name="status"
                                    className="form-select"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#0f766e', color: 'white', cursor: 'pointer' }}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AgentDetails;
