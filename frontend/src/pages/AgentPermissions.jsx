import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';

const AgentPermissions = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Permissions State
    const [permissions, setPermissions] = useState({
        customers: {
            create: false,
            view: false,
            edit: false,
            delete: false
        },
        policies: {
            view: false
        },
        kyc: {
            approve: false,
            reject: false
        },
        claims: {
            create: false,
            view: false,
            edit: false,
            delete: false
        },
        communications: {
            email: false
        }
    });

    useEffect(() => {
        fetchGlobalPermissions();
    }, []);

    const fetchGlobalPermissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/roles/agent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success && data.data) {
                if (data.data.permissions) {
                    setPermissions(prev => ({
                        ...prev,
                        ...data.data.permissions
                    }));
                }
            } else {
                showErrorAlert('Failed to load global permissions');
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error fetching permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (module, action) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...(prev[module] || {}), // Ensure module object exists
                [action]: !(prev[module]?.[action])
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/roles/agent`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ permissions })
            });

            if (!res.ok) throw new Error('Failed to update permissions');

            showSuccessAlert('Global permissions updated successfully');
            navigate('/admin/agents');
        } catch (error) {
            console.error(error);
            showErrorAlert('Error saving permissions');
        } finally {
            setSaving(false);
        }
    };

    const modules = [
        { id: 'customers', name: 'Customer Management', actions: ['create', 'view', 'edit', 'delete'] },
        { id: 'policies', name: 'Policy Management', actions: ['view'] },
        { id: 'kyc', name: 'KYC Verification', actions: ['approve', 'reject'] },
        { id: 'communications', name: 'Communications', actions: ['email'] },
        // { id: 'claims', name: 'Claims Management', actions: ['create', 'view', 'edit', 'delete'] }
    ];

    if (loading) return <Layout><div className="center-screen">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <button onClick={() => navigate('/admin/agents')} className="btn-outline" style={{ border: 'none', padding: 0, marginBottom: '1rem', color: '#64748b' }}>
                            ← Back to Agents
                        </button>
                        <h1 className="page-title">Global Agent Permission Matrix</h1>
                        <p className="page-subtitle">Configure default permissions for all agents</p>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn-primary" 
                            onClick={handleSave}
                            disabled={saving}
                            style={{ backgroundColor: '#0f766e' }}
                        >
                            {saving ? 'Saving...' : 'Save Permissions'}
                        </button>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Feature Module</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Create / Approve</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>View / Reject</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Edit</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((module) => (
                                <tr key={module.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{module.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Permissions for {module.id} module</div>
                                    </td>
                                    {['create_or_approve', 'view_or_reject', 'edit', 'delete'].map((actionCol) => {
                                        let action = actionCol;
                                        if (module.id === 'kyc') {
                                            if (actionCol === 'create_or_approve') action = 'approve';
                                            if (actionCol === 'view_or_reject') action = 'reject';
                                        } else if (module.id === 'communications') {
                                            if (actionCol === 'create_or_approve') action = 'email';
                                        } else {
                                            if (actionCol === 'create_or_approve') action = 'create';
                                            if (actionCol === 'view_or_reject') action = 'view';
                                        }

                                        return (
                                            <td key={actionCol} style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                {module.actions.includes(action) ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={permissions[module.id]?.[action] || false}
                                                            onChange={() => handleCheckboxChange(module.id, action)}
                                                            style={{ 
                                                                width: '1.25rem', 
                                                                height: '1.25rem', 
                                                                cursor: 'pointer',
                                                                accentColor: '#0f766e'
                                                            }}
                                                        />
                                                        {module.id === 'kyc' && (
                                                            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>{action}</span>
                                                        )}
                                                        {module.id === 'communications' && action === 'email' && (
                                                            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>Send Email</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#e2e8f0' }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
                        <div>
                            <h4 style={{ margin: 0, color: '#0369a1', fontWeight: 600 }}>Role Isolation Notice</h4>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#075985' }}>
                                These permissions are specific to the agent's role. Agents can only manage data that is assigned to them.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AgentPermissions;
