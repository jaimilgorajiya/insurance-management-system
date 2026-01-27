import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { showErrorAlert } from '../utils/swalUtils';
import { CommissionIcon } from '../components/LayoutIcons';

const AgentCommission = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/my-commissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch commission data');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error(error);
            showErrorAlert("Could not load commission details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="center-screen">Loading commissions...</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '12px', color: '#15803d' }}>
                            <CommissionIcon size={32} />
                        </div>
                        <div>
                            <h1 className="page-title">My Commissions</h1>
                            <p className="page-subtitle">Track your earnings and sales performance</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '2.5rem'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Earnings</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>${data?.totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Sales</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data?.totalSales} Policies</div>
                    </div>
                </div>

                {/* Sales Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>Recent Sales</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                    <th style={{ padding: '1rem 1.5rem' }}>Customer</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Policy</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Premium</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Commission %</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Earned</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.sales?.length > 0 ? data.sales.map((sale, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a' }}>{sale.customerName}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#475569' }}>{sale.policyName}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#0f172a' }}>${sale.premiumAmount?.toLocaleString()}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#475569' }}>{sale.commissionPercentage}%</td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#10b981' }}>+${sale.earnedAmount?.toFixed(2)}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>{new Date(sale.purchaseDate).toLocaleDateString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No sales data found yet. Start onboarding customers to earn commissions!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AgentCommission;
