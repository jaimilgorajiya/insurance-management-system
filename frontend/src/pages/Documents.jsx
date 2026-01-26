import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showErrorAlert } from '../utils/swalUtils';
import { User, FileText, Calendar, Search, ChevronRight } from 'lucide-react';

const Documents = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/documents/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCustomers(data.data);
            } else {
                showErrorAlert(data.message);
            }
        } catch (error) {
            console.error("Error fetching documentation customers:", error);
            showErrorAlert("Failed to load customer list");
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Document Management</h1>
                        <p className="page-subtitle">Select a customer to manage their uploaded files</p>
                    </div>
                </div>

                {/* Summary Section (Simple for this view) */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    <div className="stat-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-label">Customers with Files</div>
                                <div className="stat-value">{customers.length}</div>
                            </div>
                            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                <User size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="filters-section" style={{ marginBottom: '1.5rem', background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Search customer by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                {/* Customer Table */}
                <div className="table-container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading customer list...</div>
                    ) : (
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Customer Details</th>
                                    <th>Email Address</th>
                                    <th>Total Documents</th>
                                    <th>Last Uploaded</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div 
                                                style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                onClick={() => navigate(`/admin/documents/customers/${customer._id}`)}
                                            >
                                                {customer.name}
                                                <ChevronRight size={14} />
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b' }}>{customer.email}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={14} style={{ color: '#94a3b8' }} />
                                                <span style={{ fontWeight: 600 }}>{customer.docCount}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <Calendar size={14} style={{ color: '#94a3b8' }} />
                                                {customer.lastUpload ? new Date(customer.lastUpload).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="btn-outline"
                                                    onClick={() => navigate(`/admin/documents/customers/${customer._id}`)}
                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                >
                                                    View Documents
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
                                            <div style={{ color: '#64748b', fontWeight: 600 }}>No customers found with documents</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Documents;
