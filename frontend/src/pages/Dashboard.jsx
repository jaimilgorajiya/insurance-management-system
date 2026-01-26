import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showWarningAlert } from '../utils/swalUtils';

export const AdminDashboard = () => {
    return (
        <Layout>
            <div style={{ 
                backgroundColor: 'white', 
                padding: '3rem', 
                borderRadius: '0.75rem', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a' }}>
                    Welcome to the Administration Panel
                </h2>
                <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                    You have successfully logged in as an <strong>Admin</strong>. 
                    This area is protected and only accessible to authenticated users with the correct privileges.
                </p>
                
                <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', display: 'inline-block' }}>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Dashboard Content Placeholder</p>
                </div>
            </div>
        </Layout>
    );
};

export const AgentDashboard = () => {
    const navigate = useNavigate();
    
    return (
        <Layout>
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <h1 className="onboarding-title">Agent Portal</h1>
                    <p className="onboarding-subtitle">Welcome back. Track your performance and manage clients.</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                     <div className="stat-card">
                        <div className="stat-label">My Customers</div>
                        <div className="stat-value">0</div>
                        <div className="stat-trend neutral">Start adding customers</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Policies Sold</div>
                        <div className="stat-value">0</div>
                        <div className="stat-trend neutral">No active policies</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Pending Verifications</div>
                        <div className="stat-value">0</div>
                        <div className="stat-trend positive">All caught up</div>
                    </div>
                     <div className="stat-card">
                        <div className="stat-label">Commission (MTD)</div>
                        <div className="stat-value">$0.00</div>
                        <div className="stat-trend neutral">No earnings yet</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="step-title" style={{ marginTop: '2rem' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div 
                        onClick={() => showWarningAlert("Customer creation is currently Admin-only. (Feature coming soon for Agents)", "Coming Soon")}
                        style={{ 
                            padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', 
                            border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Add New Customer</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Onboard a new client efficiently</p>
                    </div>
                    
                    <div 
                        style={{ 
                            padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', 
                            border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>View Policies</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Check status of active policies</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export const CustomerDashboard = () => {
    return (
        <Layout>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h2>Customer Dashboard</h2>
                <p>Welcome, Customer.</p>
            </div>
        </Layout>
    );
};
