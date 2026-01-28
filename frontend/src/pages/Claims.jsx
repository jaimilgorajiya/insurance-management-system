import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import axios from 'axios';

const Claims = () => {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchClaims();
    }, [filterStatus]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/claims`;
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (searchTerm) params.append('search', searchTerm);

            const res = await axios.get(`${url}?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                setClaims(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching claims:", error);
            showErrorAlert('Failed to fetch claims');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClaims();
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'Submitted': { backgroundColor: '#eff6ff', color: '#1d4ed8' },     // Blue
            'Draft': { backgroundColor: '#f1f5f9', color: '#64748b' },         // Slate
            'Under Review': { backgroundColor: '#fef3c7', color: '#b45309' },  // Amber
            'Info Required': { backgroundColor: '#ffedd5', color: '#c2410c' }, // Orange
            'Approved': { backgroundColor: '#dcfce7', color: '#15803d' },      // Green
            'Rejected': { backgroundColor: '#fee2e2', color: '#b91c1c' },      // Red
            'Settled': { backgroundColor: '#f3e8ff', color: '#7e22ce' },       // Purple
            'Closed': { backgroundColor: '#374151', color: '#ffffff' }         // Gray
        };
        return styles[status] || { backgroundColor: '#f1f5f9', color: '#64748b' };
    };

    return (
        <Layout>
            <div className="customers-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Claims Management</h1>
                        <p className="page-subtitle">Track and manage insurance claims</p>
                    </div>
                </div>

                <div className="filters-section">
                    <form onSubmit={handleSearch} className="search-filter">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search by Claim ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    
                    <select 
                        className="dropdown-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Settled">Settled</option>
                    </select>

                    <div style={{ flex: 1 }}></div>

                    <button 
                        onClick={() => navigate('/admin/claims/new')}
                        className="btn-primary"
                    >
                        <Plus size={20} /> New Claim
                    </button>
                </div>

                <div className="table-container">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Claim ID</th>
                                <th>Incident Date</th>
                                <th>Policy</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Loading claims...</td></tr>
                            ) : claims.length === 0 ? (
                                <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No claims found.</td></tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim._id}>
                                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{claim.claimNumber}</td>
                                        <td>{new Date(claim.incidentDate).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{claim.policy?.planName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.policy?.policyType?.name}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{claim.customer?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.customer?.email}</div>
                                        </td>
                                        <td>{claim.type}</td>
                                        <td style={{ fontWeight: 600 }}>${claim.requestedAmount.toLocaleString()}</td>
                                        <td>
                                            <span 
                                                className="badge-status"
                                                style={getStatusBadgeStyle(claim.status)}
                                            >
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button 
                                                    onClick={() => navigate(`/admin/claims/${claim._id}`)}
                                                    className="action-btn view"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Claims;
