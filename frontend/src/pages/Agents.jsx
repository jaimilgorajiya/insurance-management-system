import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { showSuccessAlert, showErrorAlert, showConfirmDelete } from '../utils/swalUtils';

const Agents = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'All'
    });
    const [chartData, setChartData] = useState([]);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentAgent, setCurrentAgent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        status: 'active'
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleEdit = (agent) => {
        setCurrentAgent(agent);
        setFormData({
            name: agent.name,
            email: agent.email,
            mobile: agent.mobile,
            status: agent.status
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateAgent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/update/${currentAgent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update agent');

            // Refresh data to update UI and chart
            fetchData();
            
            setIsEditModalOpen(false);
            showSuccessAlert('Agent updated successfully');
        } catch (error) {
            console.error("Error updating agent:", error);
            showErrorAlert('Failed to update agent');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters.status]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Agents
            const agentsRes = await fetch(`${API_BASE_URL}/agent/all`, { headers });
            
            if (agentsRes.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/');
                return;
            }

            const agentsData = await agentsRes.json();
            let fetchedAgents = agentsData.agents || [];

            // 2. Fetch Customers (for metrics)
            const customersRes = await fetch(`${API_BASE_URL}/customer/all`, { headers });
            const customersData = await customersRes.json();
            const allCustomers = customersData.customers || [];

            // 3. Process Chart Data (Last 6 Months) - AGENT REGISTRATIONS
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                last6Months.push({
                    monthKey,
                    label: d.toLocaleString('default', { month: 'short' }),
                    value: 0
                });
            }

            // Count Active Agents created in each month
            fetchedAgents.forEach(agent => {
                const date = new Date(agent.createdAt);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const bin = last6Months.find(m => m.monthKey === key);
                if (bin) bin.value++;
            });
            setChartData(last6Months);

            // 4. Enrich Agents with Metrics (Real Customer Count)
            fetchedAgents = fetchedAgents.map(agent => {
                const agentCustomers = allCustomers.filter(c => 
                    c.createdBy && (c.createdBy._id === agent._id || c.createdBy === agent._id)
                );
                
                return {
                    ...agent,
                    customerCount: agentCustomers.length,
                    activePolicies: 0, // Default 0
                    commission: 0,     // Default 0
                    targetProgress: 0  // Default 0
                };
            });

            // 5. Apply Filters
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                fetchedAgents = fetchedAgents.filter(agent => 
                    agent.name?.toLowerCase().includes(searchLower) || 
                    agent.email?.toLowerCase().includes(searchLower)
                );
            }
            if (filters.status !== 'All') {
                fetchedAgents = fetchedAgents.filter(agent => agent.status?.toLowerCase() === filters.status.toLowerCase());
            }

            setAgents(fetchedAgents);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirmDelete('agent');
        if (!isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete agent');

            // Refresh data to update chart and list
            fetchData();
            showSuccessAlert('Agent deleted successfully');
        } catch (error) {
            console.error("Error deleting agent:", error);
            showErrorAlert('Failed to delete agent');
        }
    };

    // Icons
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

    const ShieldIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    );

    const AgentAvatar = ({ name }) => (
        <div style={{
            width: '40px', height: '40px', borderRadius: '50%', 
            backgroundColor: '#0f766e', color: 'white', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
            marginRight: '1rem'
        }}>
            {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
    );

    // Chart Component
    const SimpleBarChart = ({ data }) => {
        if (!data || data.length === 0) return null;
        
        const rawMax = Math.max(...data.map(d => d.value));
        const max = rawMax === 0 ? 10 : Math.ceil(rawMax * 1.2); // Add buffer
        
        // Generate Y-axis labels
        const yLabels = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];

        return (
            <div style={{ 
                backgroundColor: 'white', 
                padding: '2rem', 
                borderRadius: '0.75rem', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '2rem' }}>
                    New Agent Registrations (Last 6 Months)
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '2rem', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                        {yLabels.map((val, i) => <span key={i}>{val}</span>)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1, gap: '10%', borderBottom: '1px solid #e2e8f0' }}>
                        {data.map((item, index) => (
                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '100%', 
                                    height: `${(item.value / max) * 160}px`, 
                                    backgroundColor: '#3b82f6', 
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.5s ease-out',
                                    minHeight: item.value > 0 ? '4px' : '0' // Ensure visible if not 0
                                }} title={`${item.value} Customers`}></div>
                                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="customers-page">
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>Agent & Broker Management</h1>
                        <p className="page-subtitle" style={{ color: '#64748b' }}>Track agent performance and commission</p>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn-primary" 
                            onClick={() => navigate('/admin/agents/create')}
                            style={{ backgroundColor: '#2563eb' }}
                        >
                            <PlusIcon /> Add Agent
                        </button>
                    </div>
                </div>

                {/* Performance Chart */}
                <SimpleBarChart data={chartData} />

                {/* Agents List Card */}
                <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '0.75rem', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="search-filter" style={{ maxWidth: '100%', width: '100%' }}>
                            <SearchIcon />
                            <input 
                                type="text" 
                                placeholder="Search agents..." 
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="table-container" style={{ padding: 0, boxShadow: 'none', borderRadius: 0 }}>
                        <table className="customers-table">
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>AGTENT</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>CUSTOMERS</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>ACTIVE POLICIES</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>COMMISSION (MTD)</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>TARGET PROGRESS</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>STATUS</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', textAlign: 'center' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center">Loading agents...</td>
                                    </tr>
                                ) : agents.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center">No agents found</td>
                                    </tr>
                                ) : (
                                    agents.map((agent) => (
                                        <tr key={agent._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <AgentAvatar name={agent.name} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: '#0f172a' }}>{agent.name}</div>
                                                        <div className="text-sm text-gray" style={{ color: '#64748b', fontSize: '0.875rem' }}>{agent.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{agent.customerCount}</td>
                                            <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{agent.activePolicies}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#334155' }}>${agent.commission}</td>
                                            <td style={{ padding: '1rem 1.5rem', width: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1,  height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${agent.targetProgress}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{agent.targetProgress}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span className={`badge-status ${agent.status}`} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>
                                                    {agent.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button 
                                                        className="action-btn view" 
                                                        title="View Details"
                                                        onClick={() => navigate(`/admin/agents/${agent._id}`)}
                                                        style={{ color: '#2563eb', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
                                                    >
                                                        <EyeIcon />
                                                    </button>
                                                    <button 
                                                        className="action-btn edit" 
                                                        title="Permissions"
                                                        onClick={() => navigate(`/admin/agents/permissions/${agent._id}`)}
                                                        style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
                                                    >
                                                        <ShieldIcon />
                                                    </button>
                                                    <button 
                                                        className="action-btn edit" 
                                                        title="Edit"
                                                        onClick={() => handleEdit(agent)}
                                                        style={{ color: '#0f766e', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button 
                                                        className="action-btn delete" 
                                                        title="Delete"
                                                        onClick={() => handleDelete(agent._id)}
                                                        style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
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
            </div>


            {/* Edit Agent Modal */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem',
                        width: '100%', maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Edit Agent</h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateAgent}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Email (Read-only)</label>
                                <input 
                                    type="email" 
                                    className="form-input"
                                    value={formData.email}
                                    disabled
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: '#f1f5f9' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Phone</label>
                                <input 
                                    type="tel" 
                                    className="form-input"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Status</label>
                                <select 
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#0f766e', color: 'white', cursor: 'pointer' }}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Agents;
