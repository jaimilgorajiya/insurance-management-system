import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, Mail, Phone, Shield, Calendar, MapPin } from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>User not found</div>
            </Layout>
        );
    }

    const roleColor = {
        admin: '#dc2626',
        agent: '#0284c7',
        customer: '#10b981'
    };

    return (
        <Layout>
            <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
                <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        height: '120px', 
                        background: `linear-gradient(to right, ${roleColor[user.role] || '#64748b'}, #1e293b)`,
                        position: 'relative'
                    }}></div>
                    
                    <div style={{ padding: '0 2rem 2rem 2rem', marginTop: '-3rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '50%', 
                                backgroundColor: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                padding: '4px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    backgroundColor: roleColor[user.role] || '#64748b',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold'
                                }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            </div>
                            <div style={{ paddingBottom: '0.5rem' }}>
                                <span style={{ 
                                    padding: '0.25rem 0.75rem', 
                                    backgroundColor: `${roleColor[user.role]}20`, 
                                    color: roleColor[user.role],
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    border: `1px solid ${roleColor[user.role]}`
                                }}>
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        <h1 style={{ marginTop: '1rem', fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>
                            {user.name}
                        </h1>
                        <p style={{ color: '#64748b', margin: '0.25rem 0 1.5rem 0' }}>{user.email}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                    <Mail size={20} color="#64748b" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Email Address</div>
                                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 500 }}>{user.email}</div>
                                </div>
                            </div>


                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                    <Shield size={20} color="#64748b" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Account Status</div>
                                    <div style={{ fontSize: '1rem', color: '#15803d', fontWeight: 500, textTransform: 'capitalize' }}>{user.status}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                    <Calendar size={20} color="#64748b" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Joined On</div>
                                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 500 }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {user.address && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', gridColumn: '1 / -1' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                        <MapPin size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Address</div>
                                        <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 500 }}>
                                            {Object.values(user.address).filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
