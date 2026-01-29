import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    Download, Filter, FileText, BarChart2, Table as TableIcon, 
    Calendar as CalendarIcon, RefreshCw, X, Users, FileCheck, 
    DollarSign, AlertTriangle, TrendingUp, TrendingDown 
} from 'lucide-react';
import { showErrorAlert } from '../utils/swalUtils';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

// Premium Color Palette
const COLORS = {
    primary: '#3b82f6',   // Blue
    success: '#10b981',   // Emerald
    warning: '#f59e0b',   // Amber
    danger: '#ef4444',    // Red
    purple: '#8b5cf6',    // Violet
    cyan: '#06b6d4',      // Cyan
    pink: '#ec4899',      // Pink
    slate: '#64748b',     // Slate
    grid: '#e2e8f0'       // Light Gray
};

const CHART_COLORS = [
    COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, 
    COLORS.purple, COLORS.cyan, COLORS.pink
];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        policyType: '',
        policySource: '',
        claimStatus: '',
        agentId: ''
    });

    const [triggerFetch, setTriggerFetch] = useState(0);

    return (
        <Layout>
            <div className="reports-container">
                {/* Header Section */}
                <div className="report-header">
                    <div>
                        <h1 className="page-title">Reports & Analytics</h1>
                        <p className="page-subtitle">
                            {activeTab === 'dashboard' 
                                ? 'Real-time business intelligence and performance metrics' 
                                : 'Detailed accessible data records for export and analysis'}
                        </p>
                    </div>
                    
                    {/* Tab Switcher */}
                    <div className="view-switcher">
                        <button 
                            className={`switch-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <BarChart2 size={18} />
                            <span>Dashboard</span>
                        </button>
                        <button 
                            className={`switch-btn ${activeTab === 'detailed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('detailed')}
                        >
                            <TableIcon size={18} />
                            <span>Detailed Data</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="filters-wrapper">
                    <ReportFilters filters={filters} setFilters={setFilters} onApply={() => setTriggerFetch(p => p + 1)} />
                </div>

                {/* Main Content Area */}
                <div className="report-content">
                    {activeTab === 'dashboard' ? (
                        <DashboardView filters={filters} triggerFetch={triggerFetch} />
                    ) : (
                        <DetailedReportsView filters={filters} triggerFetch={triggerFetch} />
                    )}
                </div>
            </div>
            
            {/* Styles Injection */}
            <style>{`
                /* Container & Layout */
                .reports-container { 
                    max-width: 1600px; 
                    margin: 0 auto; 
                    padding: 1rem;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .page-title {
                    font-size: 1.875rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.025em;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                /* Tab Switcher */
                .view-switcher {
                    display: flex;
                    background: #f1f5f9;
                    padding: 0.375rem;
                    border-radius: 12px;
                    gap: 0.25rem;
                }

                .switch-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #64748b;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .switch-btn:hover {
                    color: #334155;
                    background: rgba(255,255,255,0.5);
                }

                .switch-btn.active {
                    background: white;
                    color: #2563eb;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                /* Filters Area */
                .filters-wrapper {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    align-items: end;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .filter-input {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    font-size: 0.875rem;
                    color: #334155;
                    background-color: #f8fafc;
                    transition: all 0.2s;
                }

                .filter-input:focus {
                    background-color: white;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    outline: none;
                }

                .date-range-group {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                /* Buttons */
                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-primary {
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                }
                .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }

                .btn-secondary {
                    background: white;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }
                .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }

                /* Dashboard Grid */
                .dashboard-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .kpi-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }

                .chart-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
                    gap: 1.5rem;
                }

                .report-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    display: flex;
                    flex-direction: column;
                }

                .chart-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                /* KPI Cards Specifics */
                .kpi-card {
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s;
                }
                .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                
                .kpi-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                }

                .kpi-value { font-size: 2.25rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
                .kpi-label { font-size: 0.875rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem; }
                .kpi-sub { font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.5rem; }

                /* Tables */
                .table-container {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .table-toolbar {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }

                .custom-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .custom-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #64748b;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .custom-table td {
                    padding: 1rem 1.5rem;
                    font-size: 0.875rem;
                    color: #334155;
                    border-bottom: 1px solid #f1f5f9;
                }

                .custom-table tr:last-child td { border-bottom: none; }
                .custom-table tr:hover { background-color: #f8fafc; }

                /* Custom Tooltip */
                .custom-tooltip {
                    background: white;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .tooltip-label { font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.25rem; }
                .tooltip-item { font-size: 0.8rem; color: #64748b; }

                @media (max-width: 768px) {
                    .report-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                }

            `}</style>
        </Layout>
    );
};

// ==========================================
// 1. REPORT FILTERS
// ==========================================
const ReportFilters = ({ filters, setFilters, onApply }) => {
    const [policyTypes, setPolicyTypes] = useState([]);

    useEffect(() => {
        // Mock or Fetch types
        // In real scenario, fetch from API. 
        // For visual demo, we can assume types or empty.
        const fetchTypes = async () => {
             const token = localStorage.getItem('token');
             try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/policy-types`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const d = await res.json();
                if(d.success) setPolicyTypes(d.data);
             } catch(e) {}
        };
        fetchTypes();
    }, []);

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="filter-grid">
            <div className="filter-group" style={{ gridColumn: 'span 2' }}>
                <label className="filter-label">Date Range</label>
                <div className="date-range-group">
                    <input 
                        type="date" name="startDate" 
                        className="filter-input" 
                        value={filters.startDate} onChange={handleChange} 
                    />
                    <span style={{ color: '#94a3b8' }}>—</span>
                    <input 
                        type="date" name="endDate" 
                        className="filter-input" 
                        value={filters.endDate} onChange={handleChange} 
                    />
                </div>
            </div>

            <div className="filter-group">
                <label className="filter-label">Policy Type</label>
                <select name="policyType" className="filter-input" value={filters.policyType} onChange={handleChange}>
                    <option value="">All Types</option>
                    {policyTypes.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">Claim Status</label>
                <select name="claimStatus" className="filter-input" value={filters.claimStatus} onChange={handleChange}>
                    <option value="">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            <div className="filter-group">
                 <label className="filter-label" style={{ opacity: 0 }}>Action</label>
                 <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => {
                        setFilters({ startDate: '', endDate: '', policyType: '', policySource: '', claimStatus: '', agentId: '' });
                        setTimeout(onApply, 50);
                    }}>
                        Reset
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={onApply}>
                        <Filter size={18} /> Apply
                    </button>
                 </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. DASHBOARD VIEW (Charts)
// ==========================================
const DashboardView = ({ filters, triggerFetch }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const p = new URLSearchParams();
                Object.entries(filters).forEach(([k,v]) => v && p.append(k,v));
                const qs = p.toString();
                
                const [dash, cust, pol, claim] = await Promise.all([
                    fetch(`${API_BASE_URL}/reports/dashboard?${qs}`, { headers: { 'Authorization': `Bearer ${token}` }}).then(r=>r.json()),
                    fetch(`${API_BASE_URL}/reports/customers?${qs}`, { headers: { 'Authorization': `Bearer ${token}` }}).then(r=>r.json()),
                    fetch(`${API_BASE_URL}/reports/policies?${qs}`, { headers: { 'Authorization': `Bearer ${token}` }}).then(r=>r.json()),
                    fetch(`${API_BASE_URL}/reports/claims?${qs}`, { headers: { 'Authorization': `Bearer ${token}` }}).then(r=>r.json())
                ]);

                setData({
                    kpi: dash.data || {},
                    customers: cust.data || {},
                    policies: pol.data || {},
                    claims: claim.data || {}
                });
            } catch(e) {
                console.error(e);
                showErrorAlert('Failed to refresh dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [triggerFetch]);

    if(loading) return <div className="p-8 text-center text-slate-400">Loading Intelligence...</div>;
    if(!data) return null;

    const { kpi, customers, policies, claims } = data;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          return (
            <div className="custom-tooltip">
              <p className="tooltip-label">{label}</p>
              {payload.map((entry, idx) => (
                  <p key={idx} className="tooltip-item" style={{ color: entry.color }}>
                      {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value.toLocaleString()}</span>
                  </p>
              ))}
            </div>
          );
        }
        return null;
    };

    return (
        <div className="dashboard-grid">
            {/* KPI Section */}
            <div className="kpi-row">
                <KPICard 
                    title="Total Customers" 
                    value={kpi.customers?.total || 0} 
                    sub={`${kpi.customers?.active || 0} Active Accounts`}
                    icon={Users} 
                    color="primary"
                    trend="+12%" // Mock trend for visuals
                />
                <KPICard 
                    title="Active Policies" 
                    value={kpi.policies?.active || 0} 
                    sub={`Total ${kpi.policies?.total || 0} Records`}
                    icon={FileCheck} 
                    color="success"
                    trend="+5%"
                />
                <KPICard 
                    title="Total Revenue" 
                    value={kpi.policies?.totalPremium || 0} 
                    isMoney
                    sub="Gross Premium Written"
                    icon={DollarSign} 
                    color="purple"
                    trend="+8.5%"
                />
                <KPICard 
                    title="Claims Filed" 
                    value={kpi.claims?.total || 0} 
                    sub="All Time Volume"
                    icon={AlertTriangle} 
                    color="warning"
                    trend="-2%"
                    trendDown
                />
            </div>

            {/* Charts Section 1 */}
            <div className="chart-row">
                <div className="report-card">
                    <div className="chart-title">
                        Customer Growth
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Monthly</div>
                    </div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={customers.growth}>
                                <defs>
                                    <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: COLORS.slate}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: COLORS.slate}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke={COLORS.primary} 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorCust)" 
                                    name="New Customers"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="report-card">
                    <div className="chart-title">Revenue Distribution</div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={policies.byType}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={4}
                                    dataKey="revenue"
                                    nameKey="_id"
                                    cornerRadius={6}
                                >
                                    {policies.byType?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="middle" 
                                    align="right" 
                                    layout="vertical"
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Section 2 */}
            <div className="chart-row">
                 <div className="report-card">
                    <div className="chart-title">Claims Analysis (Volume vs Payout)</div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={claims.trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: COLORS.slate}} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: COLORS.slate}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: COLORS.slate}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="count" name="Claims Count" fill={COLORS.purple} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Line yAxisId="right" type="monotone" dataKey="amount" name="Payout Amount ($)" stroke={COLORS.danger} strokeWidth={3} dot={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="report-card">
                    <div className="chart-title">Policy Distribution</div>
                    <div style={{ height: 350, width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={policies.byType} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="_id" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: COLORS.slate, fontWeight: 500}} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="count" fill={COLORS.cyan} radius={[0, 6, 6, 0]} barSize={32} name="Active Policies">
                                    {policies.byType?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. DETAILED REPORT VIEW
// ==========================================
const DetailedReportsView = ({ filters, triggerFetch }) => {
    const [reportType, setReportType] = useState('customers');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchTable = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const p = new URLSearchParams();
                Object.entries(filters).forEach(([k,v]) => v && p.append(k,v));
                
                const res = await fetch(`${API_BASE_URL}/reports/export/${reportType}?${p.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const d = await res.json();
                setData(d.success ? d.data : []);
            } catch(e) {
                console.error(e);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTable();
    }, [reportType, triggerFetch]);

    const handleExport = (format) => {
        if(!data.length) return showErrorAlert('No data available to export');
        const fname = `${reportType}_report_${new Date().toISOString().slice(0,10)}`;
        
        // Define Headers based on type
        let headers = [];
        if(reportType === 'customers') {
            headers = [
                {header: 'Customer', key: 'CustomerName'}, {header: 'Email', key: 'Email'}, 
                {header: 'Agent', key: 'Agent'}, {header: 'Join Date', key: 'JoinDate'}, {header: 'Status', key: 'Status'}
            ];
        } else if(reportType === 'policies') {
            headers = [
                {header: 'Policy Name', key: 'PolicyName'}, {header: 'Type', key: 'Type'}, 
                {header: 'Premium', key: 'Premium'}, {header: 'Status', key: 'Status'}
            ];
        } else if(reportType === 'claims') {
            headers = [
                {header: 'ID', key: 'ClaimID'}, {header: 'Customer', key: 'Customer'}, 
                {header: 'Type', key: 'ClaimType'}, {header: 'Amount', key: 'ClaimAmount'}, {header: 'Status', key: 'Status'}
            ];
        } else {
             headers = [
                {header: 'Agent', key: 'AgentName'}, {header: 'Customers', key: 'CustomersAssigned'}, 
                {header: 'Sold', key: 'PoliciesSold'}, {header: 'Commission', key: 'CommissionEarned'}
            ];
        }

        if(format === 'csv') exportToCSV(data, fname);
        if(format === 'excel') exportToExcel(data, fname);
        if(format === 'pdf') exportToPDF(data, headers, `${reportType.toUpperCase()} REPORT`, fname);
    };

    const TABS = [
        { id: 'customers', label: 'Customers' },
        { id: 'policies', label: 'Policies' },
        { id: 'claims', label: 'Claims' },
        { id: 'agents', label: 'Performance' },
    ];

    return (
        <div className="table-container">
            {/* Table Header with Tabs and Actions */}
            <div className="table-toolbar">
                <div style={{ display: 'flex', gap: '2rem' }}>
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setReportType(tab.id)}
                            style={{ 
                                padding: '0.5rem 0', 
                                border: 'none', 
                                background: 'none', 
                                borderBottom: reportType === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                                color: reportType === tab.id ? '#2563eb' : '#64748b',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleExport('csv')}>
                        <FileText size={14} /> CSV
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleExport('excel')}>
                        <TableIcon size={14} /> Excel
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleExport('pdf')}>
                        <Download size={14} /> PDF
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div style={{ padding: '0', overflowX: 'auto' }}>
                <table className="custom-table">
                    <thead>
                        {reportType === 'customers' && (
                           <tr>
                               <th>Name</th><th>Email</th><th>Agent</th><th>Policies</th><th>Join Date</th><th>Status</th>
                           </tr>
                        )}
                        {reportType === 'policies' && (
                           <tr>
                               <th>Policy</th><th>Category</th><th>Source</th><th>Premium</th><th>Coverage</th><th>Status</th>
                           </tr>
                        )}
                        {reportType === 'claims' && (
                           <tr>
                               <th>ID</th><th>Customer</th><th>Policy</th><th>Type</th><th>Requested</th><th>Approved</th><th>Status</th>
                           </tr>
                        )}
                        {reportType === 'agents' && (
                           <tr>
                               <th>Agent</th><th>Customers</th><th>Policies Sold</th><th>Premium Gen</th><th>Commission</th>
                           </tr>
                        )}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#cbd5e1' }}>Fetching Records...</td></tr>
                        ) : data.length > 0 ? (
                            data.map((row, i) => (
                                <tr key={i}>
                                   {/* Logic to render row based on type */}
                                   {reportType === 'customers' && (
                                       <>
                                           <td style={{ fontWeight: 600 }}>{row.CustomerName}</td>
                                           <td>{row.Email}</td>
                                           <td><span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{row.Agent}</span></td>
                                           <td>{row.PoliciesCount}</td>
                                           <td>{new Date(row.JoinDate).toLocaleDateString()}</td>
                                           <td><StatusBadge status={row.Status} /></td>
                                       </>
                                   )}
                                   {reportType === 'policies' && (
                                       <>
                                           <td style={{ fontWeight: 600 }}>{row.PolicyName}</td>
                                           <td>{row.Type}</td>
                                           <td>{row.Source}</td>
                                           <td>$ {row.Premium?.toLocaleString()}</td>
                                           <td>$ {row.Coverage?.toLocaleString()}</td>
                                           <td><StatusBadge status={row.Status} /></td>
                                       </>
                                   )}
                                   {reportType === 'claims' && (
                                       <>
                                           <td style={{ fontFamily: 'monospace' }}>#{row.ClaimID?.slice(-6)}</td>
                                           <td>{row.Customer}</td>
                                           <td>{row.Policy}</td>
                                           <td>{row.ClaimType}</td>
                                           <td>$ {row.ClaimAmount?.toLocaleString()}</td>
                                           <td style={{ color: '#16a34a', fontWeight: 600 }}>$ {row.ApprovedAmount?.toLocaleString()}</td>
                                           <td><StatusBadge status={row.Status} /></td>
                                       </>
                                   )}
                                   {reportType === 'agents' && (
                                       <>
                                           <td style={{ fontWeight: 600 }}>{row.AgentName}</td>
                                           <td>{row.CustomersAssigned}</td>
                                           <td>{row.PoliciesSold}</td>
                                           <td>$ {row.PremiumGenerated?.toLocaleString()}</td>
                                           <td style={{ color: '#16a34a', fontWeight: 600 }}>+ $ {row.CommissionEarned?.toLocaleString()}</td>
                                       </>
                                   )}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No data found for selected period.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Utils & Subcomponents
const KPICard = ({ title, value, sub, icon: Icon, color, isMoney, trend, trendDown }) => {
    // Map prop colors to hex
    const bgMap = {
        primary: '#eff6ff', success: '#f0fdf4', warning: '#fff7ed', purple: '#faf5ff'
    };
    const textMap = {
        primary: '#1d4ed8', success: '#15803d', warning: '#c2410c', purple: '#7e22ce'
    };

    return (
        <div className="report-card kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                     <div className="kpi-label">{title}</div>
                     <div className="kpi-value">{isMoney ? '$' : ''}{value?.toLocaleString()}</div>
                     <div className="kpi-sub">
                        <span style={{ 
                            color: trendDown ? '#ef4444' : '#10b981', 
                            fontWeight: 700,
                            display: 'flex', alignItems: 'center'
                        }}>
                             {trendDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {trend}
                        </span>
                        <span style={{ color: '#94a3b8' }}>vs last month</span>
                     </div>
                     <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                         {sub}
                     </div>
                </div>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: bgMap[color], color: textMap[color] }}>
                    <Icon size={24} strokeWidth={2} />
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    let bg = '#f1f5f9', col = '#64748b';
    const s = status?.toLowerCase() || '';
    
    if(['active', 'approved', 'settled'].includes(s)) { bg = '#dcfce7'; col = '#166534'; }
    if(['pending', 'submitted', 'under review'].includes(s)) { bg = '#fef9c3'; col = '#854d0e'; }
    if(['rejected', 'cancelled', 'inactive'].includes(s)) { bg = '#fee2e2'; col = '#991b1b'; }

    return (
        <span style={{ 
            backgroundColor: bg, color: col, 
            padding: '2px 8px', borderRadius: '99px', 
            fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' 
        }}>
            {status}
        </span>
    );
};

export default Reports;
