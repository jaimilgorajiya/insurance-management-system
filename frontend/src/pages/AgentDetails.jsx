import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showWarningAlert } from '../utils/swalUtils';

const AgentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);

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
                        <button className="btn-primary" onClick={() => navigate(`/admin/agents/edit/${agent._id}`)}>
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
        </Layout>
    );
};

export default AgentDetails;
