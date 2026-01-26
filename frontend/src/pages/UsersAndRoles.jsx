import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';
import { 
    UsersIcon, ShieldLogo // Using available icons
} from '../components/LayoutIcons';

// Permission Configuration
const PERMISSION_MODULES = [
    {
        id: 'customer',
        title: 'Customer Management',
        permissions: [
            { key: 'customer.view', label: 'View Customers' },
            { key: 'customer.create', label: 'Create Customer' },
            { key: 'customer.edit', label: 'Edit Customer' },
            { key: 'customer.delete', label: 'Delete Customer' },
            { key: 'customer.kyc_upload', label: 'Upload KYC Documents' },
            { key: 'customer.kyc_view', label: 'View KYC Documents' },
            { key: 'customer.kyc_submit', label: 'Submit KYC for Approval' }
        ]
    },
    {
        id: 'policy',
        title: 'Policy Management',
        permissions: [
            { key: 'policy.view', label: 'View Policies' },
            { key: 'policy.propose', label: 'Propose Policy' },
            { key: 'policy.assign', label: 'Assign Policy to Customer' },
            { key: 'policy.renew', label: 'Renew Policy' },
            { key: 'policy.cancel', label: 'Request Policy Cancellation' }
        ]
    },
    {
        id: 'claim_management',
        title: 'Claims Management',
        permissions: [
            { key: 'claim.view', label: 'View Claims' },
            { key: 'claim.create', label: 'Create Claim' },
            { key: 'claim.upload_doc', label: 'Upload Claim Documents' },
            { key: 'claim.track', label: 'Track Claim Status' },
            { key: 'claim.close', label: 'Close Claim (Admin only)', disabled: true } // Example of restricted
        ]
    },
    {
        id: 'documents',
        title: 'Document Management',
        permissions: [
            { key: 'document.upload', label: 'Upload Documents' },
            { key: 'document.view', label: 'View Documents' },
            { key: 'document.download', label: 'Download Documents' },
            { key: 'document.delete', label: 'Delete Documents' }
        ]
    },
    {
        id: 'notifications',
        title: 'Notifications',
        permissions: [
            { key: 'notification.view', label: 'View Notifications' },
            { key: 'notification.send_customer', label: 'Send Notifications to Customers' },
            { key: 'notification.receive_admin', label: 'Receive Admin Alerts' }
        ]
    },
    {
        id: 'reports',
        title: 'Reports & Dashboard',
        permissions: [
            { key: 'report.view_dashboard', label: 'View Dashboard' },
            { key: 'report.view', label: 'View Reports' },
            { key: 'report.export', label: 'Export Reports/Data' }
        ]
    }
];

const PermissionSection = ({ module, selectedPermissions, onToggle, onSelectAll }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const modulePermissionKeys = module.permissions.map(p => p.key);
    const allSelected = modulePermissionKeys.every(key => selectedPermissions.includes(key));
    const indeterminate = modulePermissionKeys.some(key => selectedPermissions.includes(key)) && !allSelected;

    return (
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            border: '1px solid #e2e8f0',
            marginBottom: '1rem',
            overflow: 'hidden'
        }}>
            <div 
                style={{ 
                    padding: '1rem 1.5rem', 
                    backgroundColor: '#f8fafc', 
                    borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {module.title}
                    </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b', cursor: 'pointer' }}>
                        <input 
                            type="checkbox"
                            checked={allSelected}
                            ref={input => input && (input.indeterminate = indeterminate)}
                            onChange={() => onSelectAll(module.id, !allSelected)}
                            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                        />
                        Select All
                    </label>
                    <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▼
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {module.permissions.map(perm => (
                        <label key={perm.key} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            padding: '0.5rem', 
                            borderRadius: '0.375rem',
                            cursor: perm.disabled ? 'not-allowed' : 'pointer',
                            opacity: perm.disabled ? 0.6 : 1,
                            backgroundColor: selectedPermissions.includes(perm.key) ? '#f0f9ff' : 'transparent'
                        }}>
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.key)}
                                    onChange={() => !perm.disabled && onToggle(perm.key)}
                                    disabled={perm.disabled}
                                    style={{ width: '1.1rem', height: '1.1rem', accentColor: '#2563eb', cursor: 'pointer' }}
                                />
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#334155' }}>{perm.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const UsersAndRoles = () => {
    const [activeTab, setActiveTab] = useState('permissions');
    const [permissions, setPermissions] = useState([]); // Array of enabled permission keys
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (activeTab === 'permissions') {
            fetchPermissions();
        }
    }, [activeTab]);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/roles/agent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.data) {
                setPermissions(data.data.permissions || []);
            } else {
                console.error("Failed to fetch permissions:", data.message);
                // If 404, maybe role doesn't exist yet, but controller ensures it.
                // If it fails, we start empty.
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            showErrorAlert("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (key) => {
        setPermissions(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleSelectAll = (moduleId, shouldSelect) => {
        const module = PERMISSION_MODULES.find(m => m.id === moduleId);
        const moduleKeys = module.permissions.map(p => p.key).filter(k => !module.permissions.find(p => p.key === k).disabled);
        
        setPermissions(prev => {
            if (shouldSelect) {
                // Add all missing keys
                const newKeys = [...prev];
                moduleKeys.forEach(k => {
                    if (!newKeys.includes(k)) newKeys.push(k);
                });
                return newKeys;
            } else {
                // Remove all module keys
                return prev.filter(k => !moduleKeys.includes(k));
            }
        });
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
            const data = await res.json();

            if (res.ok) {
                showSuccessAlert("Agent permissions updated successfully");
            } else {
                throw new Error(data.message || "Failed to save");
            }
        } catch (error) {
            console.error("Error saving permissions:", error);
            showErrorAlert("Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1 className="page-title">Users & Roles</h1>
                        <p className="page-subtitle">Manage system users and access controls</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '1rem 1.5rem',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderBottom: activeTab === 'users' ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === 'users' ? '#2563eb' : '#64748b',
                            fontWeight: activeTab === 'users' ? 600 : 500,
                            background: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        All Users
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        style={{
                            padding: '1rem 1.5rem',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderBottom: activeTab === 'permissions' ? '2px solid #2563eb' : '2px solid transparent',
                            color: activeTab === 'permissions' ? '#2563eb' : '#64748b',
                            fontWeight: activeTab === 'permissions' ? 600 : 500,
                            background: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Agent Permissions
                    </button>
                    <button
                        style={{
                            padding: '1rem 1.5rem',
                            color: '#cbd5e1',
                            background: 'none',
                            border: 'none',
                            cursor: 'not-allowed'
                        }}
                        disabled
                    >
                        Customer Roles (Coming Soon)
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'users' && (
                    <div className="empty-state">
                        <div className="text-center" style={{ padding: '4rem' }}>
                            <div style={{ marginBottom: '1rem', fontSize: '3rem', color: '#cbd5e1' }}>👥</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>User Management</h3>
                            <p style={{ color: '#64748b' }}>User list view placeholer. Please switch to Agent Permissions tab.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '1.5rem',
                            backgroundColor: '#eff6ff',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #dbeafe'
                        }}>
                             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>🛡️</div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a' }}>Agent Role Configuration</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                                        Configure what actions agents can perform in the system. Disabling a permission will hide the feature from their dashboard.
                                    </p>
                                </div>
                             </div>
                             <button 
                                className="btn-primary" 
                                onClick={handleSave}
                                disabled={saving}
                                style={{ minWidth: '150px' }}
                            >
                                {saving ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center" style={{ padding: '4rem' }}>Loading permissions...</div>
                        ) : (
                            <div>
                                {PERMISSION_MODULES.map(module => (
                                    <PermissionSection 
                                        key={module.id} 
                                        module={module} 
                                        selectedPermissions={permissions}
                                        onToggle={handleTogglePermission}
                                        onSelectAll={handleSelectAll}
                                    />
                                ))}
                            </div>
                        )}
                        
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-primary" 
                                onClick={handleSave}
                                disabled={saving}
                                style={{ minWidth: '150px' }}
                            >
                                {saving ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UsersAndRoles;
