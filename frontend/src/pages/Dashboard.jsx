
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { showWarningAlert } from '../utils/swalUtils';
import { UserPlus, FileText, FileCheck, Clock, DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalPolicies: 0,
        activePolicies: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        policyDistribution: [],
        monthlyRevenue: []
    });
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

    if (loading) return <Layout><div className="center-screen">Loading Dashboard...</div></Layout>;

    return (
        <Layout>
            <div style={{ padding: '0 2rem 2rem 2rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a' }}>Dashboard</h1>
                    <p style={{ color: '#64748b' }}>Welcome back! Here's what's happening with your insurance CRM today.</p>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <StatCard 
                        title="Total Policies" 
                        value={stats.totalPolicies} 
                        trend="+12.5% vs last month"
                        icon={<FileText size={24} color="#3b82f6" />}
                        bgColor="#eff6ff"
                    />
                    <StatCard 
                        title="Active Policies" 
                        value={stats.activePolicies} 
                        trend="+8.2% vs last month"
                        icon={<FileCheck size={24} color="#10b981" />}
                        bgColor="#ecfdf5"
                    />
                    <StatCard 
                        title="Pending Approvals" 
                        value={stats.pendingApprovals} 
                        trend="Requires attention"
                        trendColor="#f59e0b"
                        icon={<Clock size={24} color="#f59e0b" />}
                        bgColor="#fffbeb"
                    />
                    <StatCard 
                        title="Total Revenue" 
                        value={`$${stats.totalRevenue.toLocaleString()}`} 
                        trend="+15.3% vs last month"
                        icon={<DollarSign size={24} color="#8b5cf6" />}
                        bgColor="#f5f3ff"
                    />
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Policy Distribution Chart */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Policy Distribution</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.policyDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.policyDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {stats.policyDistribution.map((entry, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], marginRight: '0.5rem' }}></div>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Trend Chart */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Monthly Revenue Trend</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Grid: Claims & Activities */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Claims Status */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', height: 'fit-content' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Claims Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                                    <span style={{ color: '#475569' }}>Approved</span>
                                </div>
                                <span style={{ fontWeight: 600 }}>{stats.claimsStats?.approved || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                                    <span style={{ color: '#475569' }}>Pending</span>
                                </div>
                                <span style={{ fontWeight: 600 }}>{stats.claimsStats?.pending || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                                    <span style={{ color: '#475569' }}>Rejected</span>
                                </div>
                                <span style={{ fontWeight: 600 }}>{stats.claimsStats?.rejected || 0}</span>
                            </div>

                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>{stats.claimsStats?.total || 0}</div>
                                <div style={{ color: '#64748b' }}>Total Claims</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Recent Activities</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.recentActivities?.length > 0 ? (
                                stats.recentActivities.map((activity, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: index < stats.recentActivities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ 
                                            padding: '0.5rem', borderRadius: '50%', 
                                            backgroundColor: activity.type === 'USER_ONBOARDED' ? '#eff6ff' : '#ecfdf5',
                                            color: activity.type === 'USER_ONBOARDED' ? '#3b82f6' : '#10b981'
                                        }}>
                                            {activity.type === 'USER_ONBOARDED' ? <UserPlus size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{activity.title}</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>{activity.subtitle}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ 
                                                fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '999px',
                                                backgroundColor: activity.status === 'active' || activity.status === 'approved' ? '#dcfce7' : '#fef3c7',
                                                color: activity.status === 'active' || activity.status === 'approved' ? '#166534' : '#92400e'
                                            }}>
                                                {activity.status || 'Active'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                {new Date(activity.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', textAlign: 'center' }}>No recent activities</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const StatCard = ({ title, value, trend, icon, bgColor, trendColor = '#10b981' }) => (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{value}</h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: bgColor }}>
                {icon}
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
             <span style={{ color: trendColor, marginRight: '0.5rem', fontWeight: 500 }}>{trend}</span>
        </div>
    </div>
);

export const AgentDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        assignedCustomers: 0,
        activePolicies: 0,
        earnedCommission: 0,
        targetProgress: 0,
        monthlyPerformance: [],
        recentCustomers: []
    });
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agent/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching agent stats:", error);
        }
    };
    
    return (
        <Layout>
            <div style={{ padding: '0 2rem 2rem 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a' }}>Agent Dashboard</h1>
                    <p style={{ color: '#64748b' }}>Welcome back! Here's your performance overview.</p>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                     <StatCard 
                        title="Assigned Customers" 
                        value={stats.assignedCustomers} 
                        trend="↑ 8.5% vs last month"
                        icon={<Users size={24} color="#10b981" />}
                        bgColor="#ecfdf5"
                    />
                    <StatCard 
                        title="Active Policies" 
                        value={stats.activePolicies} 
                        trend="↑ 12.3% vs last month"
                        icon={<FileText size={24} color="#3b82f6" />}
                        bgColor="#eff6ff"
                    />
                    <StatCard 
                        title="Earned Commission" 
                        value={`$${stats.earnedCommission.toLocaleString()}`} 
                        trend="↑ 15.8% vs last month"
                        icon={<DollarSign size={24} color="#10b981" />}
                        bgColor="#f0fdf4"
                    />
                     <StatCard 
                        title="Target Progress" 
                        value={`${stats.targetProgress}%`} 
                        trend="Monthly Goal"
                        trendColor="#8b5cf6"
                        icon={<Target size={24} color="#8b5cf6" />}
                        bgColor="#f5f3ff"
                    />
                </div>

                {/* Main Content Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    
                    {/* Monthly Performance Chart */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Monthly Performance</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.monthlyPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={{r: 4, fill: 'white', stroke: '#10b981', strokeWidth: 2}} 
                                        activeDot={{r: 6, fill: '#10b981'}} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Customers List */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Recent Customers</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {stats.recentCustomers.length > 0 ? (
                                stats.recentCustomers.map((cust, index) => (
                                    <div key={index} style={{ paddingBottom: index < stats.recentCustomers.length - 1 ? '1rem' : '0', borderBottom: index < stats.recentCustomers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{cust.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(cust.date).toISOString().split('T')[0]}</span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>{cust.policyName}</div>
                                        <span style={{ 
                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '999px',
                                            backgroundColor: cust.status === 'active' ? '#dcfce7' : '#fef3c7',
                                            color: cust.status === 'active' ? '#166534' : '#92400e',
                                            fontWeight: 500
                                        }}>
                                            {cust.status.charAt(0).toUpperCase() + cust.status.slice(1)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8' }}>No recent customers.</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Quick Actions */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', margin: '2rem 0 1rem 0' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div 
                        onClick={() => navigate('/admin/customers/create')}
                        style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#eff6ff' }}>
                            <UserPlus size={24} color="#3b82f6" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Add Customer</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Onboard new client</p>
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/admin/policies')}
                        style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#f0fdf4' }}>
                            <FileText size={24} color="#10b981" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>View Policies</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Check policy status</p>
                        </div>
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
