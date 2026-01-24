import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

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
    return (
        <Layout>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h2>Agent Dashboard</h2>
                <p>Welcome, Agent.</p>
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

