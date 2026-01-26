import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';
import Swal from 'sweetalert2';

const EditAgent = () => {
    const { id } = useParams(); // If id is present, it's Edit mode
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); // Validation errors
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        status: 'active'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        // ... (keep existing useEffect)
        if (isEditMode) {
            fetchAgentDetails();
        }
    }, [id]);

    // ... (keep fetchAgentDetails)
    const fetchAgentDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const agent = data.agents.find(a => a._id === id);
            
            if (agent) {
                setFormData({
                    name: agent.name || '',
                    email: agent.email || '',
                    mobile: agent.mobile || '',
                    status: agent.status || 'active'
                });
            } else {
                showErrorAlert('Agent not found');
                navigate('/admin/agents');
            }

        } catch (error) {
            console.error("Error details:", error);
            showErrorAlert("Failed to load agent");
        } finally {
            setIsLoading(false);
        }
    };

    const validateField = (name, value) => {
        let error = '';
        if (name === 'mobile') {
            if (!/^\d{10}$/.test(value)) {
                error = 'Mobile number must be exactly 10 digits';
            }
        } else if (name === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = 'Invalid email format';
            }
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Prevent typing non-digits for mobile
        if (name === 'mobile' && !/^\d*$/.test(value)) return;
        // Limit mobile to 10 digits
        if (name === 'mobile' && value.length > 10) return;

        setFormData({ ...formData, [name]: value });
        
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Confirmation Modal with Details
        const result = await Swal.fire({
            title: isEditMode ? 'Confirm Agent Update' : 'Confirm New Agent',
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Name:</strong> ${formData.name}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    <p><strong>Mobile:</strong> ${formData.mobile}</p>
                    <p><strong>Status:</strong> ${formData.status}</p>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0f766e',
            cancelButtonColor: '#d33',
            confirmButtonText: isEditMode ? 'Update Agent' : 'Create Agent',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const url = isEditMode ? `${API_BASE_URL}/agent/update/${id}` : `${API_BASE_URL}/agent/register`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Operation failed');
            }

            await showSuccessAlert(isEditMode ? 'Agent updated successfully' : 'Agent created successfully');
            navigate('/admin/agents');

        } catch (error) {
            console.error("Error submitting:", error);
            showErrorAlert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Layout><div className="center-screen">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <button onClick={() => navigate('/admin/agents')} className="btn-outline" style={{marginBottom: '1rem', border: 'none', paddingLeft: 0}}>
                        ← Back to Agents
                    </button>
                    <h1 className="onboarding-title">{isEditMode ? 'Edit Agent' : 'Add New Agent'}</h1>
                    <p className="onboarding-subtitle">
                        {isEditMode ? 'Update agent details' : 'Register a new insurance agent'}
                    </p>
                </div>

                <div className="form-container">
                    <form onSubmit={handleSubmit} className="form-step">
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. John Agent"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group form-group-full">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="agent@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditMode}
                                />
                                {errors.email && <span style={{color: 'red', fontSize: '0.875rem'}}>{errors.email}</span>}
                                {isEditMode && <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>}
                            </div>
                            <div className="form-group form-group-full">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    className="form-input"
                                    placeholder="+1 234 567 8900"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.mobile && <span style={{color: 'red', fontSize: '0.875rem'}}>{errors.mobile}</span>}
                            </div>
                            {isEditMode && (
                                <div className="form-group form-group-full">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="form-navigation">
                            <button 
                                type="submit" 
                                className="btn-submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Agent' : 'Create Agent')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default EditAgent;
