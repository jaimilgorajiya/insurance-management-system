import React from 'react';
import Layout from '../components/Layout';

const BasePlaceholder = ({ title, subtitle, icon }) => (
    <Layout>
        <div className="onboarding-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{icon}</div>
            <h1 className="onboarding-title">{title}</h1>
            <p className="onboarding-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {subtitle}
            </p>
            <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0', display: 'inline-block' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>This feature is currently under development. Please check back soon.</p>
            </div>
        </div>
    </Layout>
);

export const ClaimsPlaceholder = () => (
    <BasePlaceholder 
        title="Claims Management" 
        subtitle="Track and process customer insurance claims efficiently." 
        icon="📑" 
    />
);

export const CommissionPlaceholder = () => (
    <BasePlaceholder 
        title="My Commissions" 
        subtitle="View your earnings, payouts, and performance-based incentives." 
        icon="💰" 
    />
);

export const ReportsPlaceholder = () => (
    <BasePlaceholder 
        title="Business Reports" 
        subtitle="Analyze business growth, customer trends, and policy performance." 
        icon="📊" 
    />
);
