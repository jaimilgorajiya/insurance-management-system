import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldLogo } from '../components/LayoutIcons';

const AccessDenied = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    const handleGoBack = () => {
        if (userRole === 'admin') {
            navigate('/admin/dashboard');
        } else if (userRole === 'agent') {
            navigate('/agent/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-main)'
        }}>
            <div style={{ marginBottom: '2rem' }}>
                <ShieldLogo size={80} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#1e293b' }}>Access Denied</h1>
            <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '500px', marginBottom: '2rem' }}>
                You do not have permission to access this page. If you believe this is an error, please contact your administrator.
            </p>
            <button 
                className="btn-primary" 
                onClick={handleGoBack}
                style={{ padding: '0.75rem 2rem' }}
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default AccessDenied;
