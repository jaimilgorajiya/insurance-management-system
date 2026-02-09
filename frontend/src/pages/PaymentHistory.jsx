import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { CreditCard, Calendar, User, Shield, Download, Search, Filter, ArrowLeft, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import axios from 'axios';

const PaymentHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userRole = localStorage.getItem('userRole');

    // Parse query params (e.g. ?customerId=... or ?policyId=...)
    const params = new URLSearchParams(location.search);
    const customerIdFilter = params.get('customerId');
    const policyIdFilter = params.get('policyId');

    useEffect(() => {
        fetchPayments();
    }, [location.search]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/payments`;
            
            // Build query string
            const queryParams = new URLSearchParams();
            if (customerIdFilter) queryParams.append('customerId', customerIdFilter);
            if (policyIdFilter) queryParams.append('policyId', policyIdFilter);
            
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }

            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                setPayments(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'success': return '#10b981';
            case 'failed': return '#ef4444';
            case 'created': return '#f59e0b';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'success': return <CheckCircle size={14} />;
            case 'failed': return <XCircle size={14} />;
            case 'created': return <Clock size={14} />;
            default: return null;
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = 
            p.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.policy?.policyName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });

    return (
        <Layout>
            <div className="customers-page">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            {(customerIdFilter || policyIdFilter) && (
                                <button 
                                    onClick={() => navigate(-1)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               Payment History
                            </h1>
                        </div>
                        <p style={{ color: '#64748b' }}>
                            {customerIdFilter ? `Viewing payments for customer ID: ${customerIdFilter}` : 
                             policyIdFilter ? `Viewing payments for policy ID: ${policyIdFilter}` : 
                             "View and manage all premium payments"}
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '1.25rem', 
                    borderRadius: '1rem', 
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', 
                    marginBottom: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by Payment ID, Customer or Policy..." 
                            className="form-input"
                            style={{ paddingLeft: '2.75rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ position: 'relative', width: '180px' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <select 
                            className="form-select" 
                            style={{ paddingLeft: '2.75rem' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="created">Pending</option>
                        </select>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                        {filteredPayments.length} transactions found
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <div>Loading transaction data...</div>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
                        <div style={{ backgroundColor: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <CreditCard size={32} color="#94a3b8" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>No Transactions Found</h3>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No payment records match your current filters.</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Transaction ID</th>
                                    {userRole !== 'customer' && (
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                                    )}
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Policy</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((p) => (
                                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{p.paymentId}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Order: {p.orderId?.slice(-8)}</span>
                                            </div>
                                        </td>
                                        {userRole !== 'customer' && (
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                                        <User size={16} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>{p.customer?.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.customer?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Shield size={16} color="#3b82f6" />
                                                <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>{p.policy?.policyName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                                                <Calendar size={14} />
                                                {new Date(p.paymentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                                                {p.currency === 'INR' ? '₹' : '$'}{p.amount?.toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ 
                                                backgroundColor: `${getStatusColor(p.status)}15`, 
                                                color: getStatusColor(p.status), 
                                                padding: '0.35rem 0.75rem', 
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                textTransform: 'capitalize'
                                            }}>
                                                {getStatusIcon(p.status)}
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PaymentHistory;
