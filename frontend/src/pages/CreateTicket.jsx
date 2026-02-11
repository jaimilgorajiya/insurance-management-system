
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';

import { ArrowLeft, Send, Upload, FileText, X } from 'lucide-react';
import './Support.css';

const CreateTicket = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        subject: '',
        category: 'Technical',
        priority: 'Medium',
        description: '',
        attachment: null
    });
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // Create FormData object to send file + text data
            const validFormData = new FormData();
            validFormData.append('subject', formData.subject);
            validFormData.append('category', formData.category);
            validFormData.append('priority', formData.priority);
            validFormData.append('description', formData.description);
            
            if (formData.attachment) {
                validFormData.append('attachment', formData.attachment);
            }

            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: {
                    // Do NOT set Content-Type header when sending FormData, fetch sets it automatically with boundary
                    'Authorization': `Bearer ${token}`
                },
                body: validFormData
            });

            const data = await res.json();
            if (data.success) {
                showSuccessAlert('Ticket Created', 'Your support ticket has been submitted successfully.');
                navigate('/customer/support');
            } else {
                showErrorAlert('Error', data.message);
            }
        } catch (error) {
            showErrorAlert('Error', 'Something went wrong while creating the ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="support-container">
                <button 
                    onClick={() => navigate(-1)}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: '#6b7280', 
                        marginBottom: '1.5rem', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer' 
                    }}
                >
                    <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                    Back to Support
                </button>

                <div className="form-card">
                    <div className="form-header">
                        <h1 className="form-title">Create New Support Ticket</h1>
                        <p className="support-subtitle">Describe your issue and we'll get back to you as soon as possible.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="form-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input 
                                    type="text" 
                                    required
                                    className="form-control"
                                    placeholder="e.g. Cannot download policy PDF"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select 
                                    className="form-control"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="Policy">Policy Issue</option>
                                    <option value="Claim">Claim Query</option>
                                    <option value="Payment">Billing & Payments</option>
                                    <option value="Technical">Technical Support</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <div className="radio-group">
                                {['Low', 'Medium', 'High'].map((p) => (
                                    <label 
                                        key={p} 
                                        className={`radio-label ${formData.priority === p ? 'selected' : ''}`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="priority" 
                                            value={p} 
                                            checked={formData.priority === p}
                                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                            className="radio-input" 
                                        />
                                        <span>{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea 
                                required
                                rows="6"
                                className="form-control"
                                style={{ resize: 'none' }}
                                placeholder="Please provide detailed information about your issue..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Attachment (Optional)</label>
                            
                            {!formData.attachment ? (
                                <div className="file-upload-wrapper">
                                    <input 
                                        type="file" 
                                        className="file-upload-input" 
                                        accept="image/*,application/pdf"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFormData({...formData, attachment: e.target.files[0]});
                                            }
                                        }}
                                    />
                                    <div className="file-upload-container">
                                        <div className="file-upload-icon">
                                            <Upload size={32} strokeWidth={1.5} />
                                        </div>
                                        <div className="file-upload-text">
                                            Click to upload or drag and drop
                                        </div>
                                        <div className="file-upload-hint">
                                            Supported formats: JPG, PNG, PDF (Max 10MB)
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="file-selected">
                                    <div className="file-selected-info">
                                        <FileText size={20} className="text-blue-600" />
                                        <span className="file-selected-name">{formData.attachment.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            ({(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, attachment: null})}
                                        className="file-remove-btn"
                                        title="Remove file"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="actions-row">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Submitting...' : (
                                    <>
                                        <Send size={18} />
                                        Submit Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default CreateTicket;
