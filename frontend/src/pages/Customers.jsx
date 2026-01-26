import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        kycStatus: 'All'
    });
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pendingKyc: 0,
        newThisMonth: 0,
        growthRate: 0,
        activeRate: 0
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCustomers();
    }, [filters]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.status !== 'All') queryParams.append('status', filters.status);
            if (filters.kycStatus !== 'All') queryParams.append('kycStatus', filters.kycStatus);

            const res = await fetch(`${API_BASE_URL}/customer/all?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/'); // Redirect to login
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch customers');

            const data = await res.json();
            setCustomers(data.customers || []);
            calculateStats(data.customers || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
            // In a real app, show a toast or error message
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const total = data.length;
        const active = data.filter(c => c.status === 'active').length;
        const pendingKyc = data.filter(c => c.kycStatus === 'pending').length;
        const newThisMonth = data.filter(c => new Date(c.createdAt) >= startOfMonth).length;
        
        // Calculate growth based on new customers this month vs previous total
        const previousTotal = total - newThisMonth;
        const growthRate = previousTotal > 0 ? ((newThisMonth / previousTotal) * 100).toFixed(1) : newThisMonth > 0 ? 100 : 0;
        
        // Calculate active percentage
        const activeRate = total > 0 ? ((active / total) * 100).toFixed(0) : 0;

        setStats({
            total,
            active,
            pendingKyc,
            newThisMonth,
            growthRate,
            activeRate
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({ search: '', status: 'All', kycStatus: 'All' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/');
                return;
            }

            if (!res.ok) throw new Error('Failed to delete customer');

            // Remove from local state and update stats
            const updatedCustomers = customers.filter(c => c._id !== id);
            setCustomers(updatedCustomers);
            calculateStats(updatedCustomers);
            alert('Customer deleted successfully');

        } catch (error) {
            console.error("Error deleting customer:", error);
            alert('Failed to delete customer');
        }
    };

    // Icons
    const ExportIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const PlusIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const SearchIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const EyeIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const EditIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const DeleteIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const handleExport = () => {
        if (!customers.length) {
            alert('No customers to export');
            return;
        }

        const headers = [
            'Customer ID',
            'First Name', 
            'Last Name',
            'Email',
            'Phone',
            'Alternate Phone',
            'Date of Birth',
            'Gender',
            'Occupation',
            'Annual Income',
            'Status',
            'KYC Status',
            'Address Line 1',
            'Address Line 2',
            'City',
            'State',
            'ZIP Code',
            'Country',
            'Created At'
        ];

        const csvContent = customers.map(customer => {
            return [
                customer._id,
                customer.firstName || '',
                customer.lastName || '',
                customer.email || '',
                customer.mobile || '',
                customer.alternatePhone || '',
                customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '',
                customer.gender || '',
                customer.occupation || '',
                customer.annualIncome || '',
                customer.status || '',
                customer.kycStatus || '',
                customer.address?.addressLine1 || '',
                customer.address?.addressLine2 || '',
                customer.address?.city || '',
                customer.address?.state || '',
                customer.address?.zipCode || '',
                customer.address?.country || '',
                new Date(customer.createdAt).toLocaleDateString()
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Escape quotes and wrap in quotes
        });

        const csv = [headers.join(','), ...csvContent].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <div className="customers-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Customer Management</h1>
                        <p className="page-subtitle">View and manage all customer information</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-outline" onClick={handleExport}>
                            <ExportIcon /> Export
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/admin/customers/create')}>
                            <PlusIcon /> Add Customer
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Customers</div>
                        <div className="stat-value">{stats.total.toLocaleString()}</div>
                        <div className="stat-trend positive">
                            {stats.growthRate > 0 ? '↑' : ''} {stats.growthRate}% from last month
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Active Customers</div>
                        <div className="stat-value">{stats.active.toLocaleString()}</div>
                        <div className="stat-trend neutral">
                            {stats.activeRate}% of total customers
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Pending KYC</div>
                        <div className="stat-value">{stats.pendingKyc}</div>
                        <div className={`stat-trend ${stats.pendingKyc > 0 ? 'warning' : 'positive'}`}>
                            {stats.pendingKyc > 0 ? 'Requires attention' : 'All caught up'}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">New This Month</div>
                        <div className="stat-value">{stats.newThisMonth}</div>
                        <div className="stat-trend positive">
                            Latest joining
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-filter">
                        <SearchIcon />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, phone..." 
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <select 
                        className="dropdown-filter"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <select 
                        className="dropdown-filter"
                        value={filters.kycStatus}
                        onChange={(e) => handleFilterChange('kycStatus', e.target.value)}
                    >
                        <option value="All">All KYC Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button className="btn-reset" onClick={resetFilters}>
                        Reset Filters
                    </button>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>CUSTOMER</th>
                                <th>CONTACT</th>
                                <th>POLICIES</th>
                                <th>TOTAL PREMIUM</th>
                                <th>STATUS</th>
                                <th>KYC</th>
                                <th>JOIN DATE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-500">Loading customers...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-500">No customers found</td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="avatar">
                                                    {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="customer-info">
                                                    <span className="customer-name">{customer.name || 'Unknown'}</span>
                                                    <span className="customer-email">{customer.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{customer.mobile || '-'}</td>
                                        <td>
                                            <span className="badge-blue">0 Policies</span>
                                        </td>
                                        <td className="font-medium">$0</td>
                                        <td>
                                            <span className={`badge-status ${customer.status}`}>
                                                {capitalize(customer.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge-kyc ${customer.kycStatus || 'pending'}`}>
                                                {capitalize(customer.kycStatus || 'Pending')}
                                            </span>
                                        </td>
                                        <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <button 
                                                    className="action-btn view"
                                                    onClick={() => navigate(`/admin/customers/${customer._id}`)}
                                                >
                                                    <EyeIcon /> 
                                                </button>
                                                <button 
                                                    className="action-btn edit"
                                                    onClick={() => navigate(`/admin/customers/edit/${customer._id}`)}
                                                >
                                                    <EditIcon /> 
                                                </button>
                                                <button 
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(customer._id)}
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <DeleteIcon /> 
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

export default Customers;
