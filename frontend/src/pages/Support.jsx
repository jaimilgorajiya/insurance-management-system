
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, AlertCircle, Search, Filter } from 'lucide-react';
import './Support.css';
import { io } from 'socket.io-client';

const Support = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('userRole');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchTickets();

        // Socket for real-time updates
        const socket = io(API_BASE_URL.replace('/api', ''));
        const userId = localStorage.getItem('userId');

        if (userId) {
            socket.emit('join_user', userId);

            socket.on('ticket_updated', (data) => {
                setTickets(prevTickets => {
                    return prevTickets.map(ticket => {
                        if (ticket._id === data._id) {
                            return {
                                ...ticket,
                                unreadCount: (ticket.unreadCount || 0) + data.unreadIncrement,
                                messages: [...ticket.messages, data.lastMessage],
                                updatedAt: new Date().toISOString() // Move to top if sorted by date
                            };
                        }
                        return ticket;
                    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Re-sort
                });
            });
        }

        return () => {
            socket.disconnect();
        };
    }, [filter]); // Re-fetch or re-filter when filter changes (could be client-side filtered too)

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/tickets`;
            if (filter !== 'All') {
                url += `?status=${filter}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = () => {
        navigate('/customer/support/new');
    };

    const handleViewTicket = (id) => {
        if (userRole === 'admin') navigate(`/admin/support/${id}`);
        else if (userRole === 'agent') navigate(`/agent/support/${id}`);
        else navigate(`/customer/support/${id}`);
    };

    const filteredTickets = tickets.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'Open': return 'bg-blue-100 text-blue-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'Critical': return 'text-red-600 font-bold';
            case 'High': return 'text-orange-600 font-semibold';
            default: return 'text-gray-600';
        }
    };

    return (
        <Layout>
            <div className="support-container">
                <div className="support-header">
                    <div>
                        <h1 className="support-title">Support Tickets</h1>
                        <p className="support-subtitle">Manage your support requests and inquiries</p>
                    </div>
                    {userRole === 'customer' && (
                        <button 
                            onClick={handleCreateTicket}
                            className="btn btn-primary"
                        >
                            <Plus size={20} />
                            New Ticket
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="filters-container">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by ID or Subject..." 
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <Filter size={20} color="#9ca3af" />
                        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`filter-btn ${filter === status ? 'active' : 'inactive'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tickets List */}
                <div className="tickets-list">
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading tickets...</div>
                    ) : filteredTickets.length > 0 ? (
                        <div>
                            {filteredTickets.map((ticket) => (
                                <div 
                                    key={ticket._id} 
                                    onClick={() => handleViewTicket(ticket._id)}
                                    className="ticket-item group"
                                >
                                    <div className="ticket-header">
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                            <span className="ticket-id">{ticket.ticketId}</span>
                                            <h3 className="ticket-subject">
                                                {ticket.subject}
                                                {ticket.unreadCount > 0 && (
                                                    <span className="unread-badge">
                                                        <MessageSquare size={12} fill="currentColor" />
                                                        {ticket.unreadCount} New Message{ticket.unreadCount > 1 ? 's' : ''}
                                                        <span className="unread-dot"></span>
                                                    </span>
                                                )}
                                            </h3>
                                            <span className={`status-badge ${
                                                ticket.status === 'Open' ? 'status-open' :
                                                ticket.status === 'In Progress' ? 'status-progress' :
                                                ticket.status === 'Resolved' ? 'status-resolved' : 'status-closed'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <span className="ticket-date">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="ticket-preview">
                                        <p className="ticket-message-snippet">
                                            {ticket.messages[ticket.messages.length - 1]?.message}
                                        </p>
                                        <div className="ticket-meta">
                                            <span className={`priority-badge ${
                                                ticket.priority === 'Critical' ? 'priority-critical' :
                                                ticket.priority === 'High' ? 'priority-high' :
                                                'priority-medium'
                                            }`}>
                                                {ticket.priority} Priority
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MessageSquare size={14} />
                                                <span>{ticket.messages.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon-wrapper">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="empty-title">No Tickets Found</h3>
                            <p className="empty-description">
                                {searchTerm || filter !== 'All' 
                                    ? "Try adjusting your search or filters." 
                                    : "You haven't created any support tickets yet."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Support;
