
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, Clock } from 'lucide-react';
import { showSuccessAlert } from '../utils/swalUtils';
import './Support.css';
import { io } from 'socket.io-client';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // Assuming API_BASE_URL is something like http://localhost:5000/api
    // We need the root URL for socket.io (http://localhost:5000)
    const SOCKET_URL = API_BASE_URL.replace('/api', ''); 
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchTicket();

        // Initialize Socket
        socketRef.current = io(SOCKET_URL);
        
        // Join ticket room
        socketRef.current.emit('join_ticket', id);

        // Listen for new messages
        socketRef.current.on('new_message', (message) => {
            setTicket(prev => {
                if (!prev) return prev;
                // Avoid duplicates if we optimistically updated or if event fires twice
                const exists = prev.messages.some(m => 
                    (m._id && m._id === message._id) || 
                    (new Date(m.timestamp).getTime() === new Date(message.timestamp).getTime() && m.message === message.message)
                );
                if (exists) return prev;
                
                return {
                    ...prev,
                    messages: [...prev.messages, message]
                };
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave_ticket', id);
                socketRef.current.disconnect();
            }
        };
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTicket(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: reply })
            });
            const data = await res.json();
            if (data.success) {
                // We don't need to manually update state here if socket works, 
                // but for better UX (instant feedback), we can keep it. 
                // The socket listener duplicate check will handle echoes.
                setTicket(prev => ({
                    ...prev,
                    messages: [...prev.messages, data.data]
                }));
                setReply('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setTicket(prev => ({ ...prev, status: newStatus }));
                showSuccessAlert('Status Updated', `Ticket marked as ${newStatus}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading discussion...</div></Layout>;
    if (!ticket) return <Layout><div className="p-8 text-center text-red-500">Ticket not found</div></Layout>;

    return (
        <Layout>
            <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <div className="support-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: '#6b7280', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer' 
                        }}
                    >
                        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                        Back
                    </button>
                    {(userRole === 'admin' || userRole === 'agent') && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                             {ticket.status !== 'Resolved' && (
                                <button 
                                    onClick={() => handleUpdateStatus('Resolved')}
                                    className="btn"
                                    style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                >
                                    <CheckCircle size={14} /> Mark Resolved
                                </button>
                            )}
                            {ticket.status !== 'Closed' && (
                                <button 
                                    onClick={() => handleUpdateStatus('Closed')}
                                    className="btn btn-secondary"
                                >
                                    Close Ticket
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="chat-layout">
                    {/* Main Chat Area */}
                    <div className="chat-main">
                        <div className="chat-header">
                            <div>
                                <h1 className="chat-title">
                                    {ticket.subject}
                                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280', backgroundColor: '#e5e7eb', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{ticket.ticketId}</span>
                                </h1>
                                <p className="support-subtitle" style={{ fontSize: '0.75rem' }}>
                                    Started by {ticket.customer.name} on {new Date(ticket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`status-badge ${
                                ticket.status === 'Open' ? 'status-open' :
                                ticket.status === 'In Progress' ? 'status-progress' :
                                ticket.status === 'Resolved' ? 'status-resolved' : 'status-closed'
                            }`}>
                                {ticket.status}
                            </span>
                        </div>

                        <div className="chat-messages">
                            {ticket.messages.map((msg, index) => {
                                const currentUserId = localStorage.getItem('userId');
                                // Fallback logic if userId is not in localstorage or different format
                                const isMe = (msg.sender?._id || msg.sender) === currentUserId || 
                                             (userRole === 'customer' && !msg.sender?.role) || // Weak check, assuming current user is customer
                                             (msg.sender?.role === userRole);

                                return (
                                    <div key={index} className={`message-row ${isMe ? 'me' : 'them'}`}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                            <div className="message-info">
                                                <span style={{ fontWeight: 600 }}>{msg.sender?.name || 'User'}</span>
                                                <span>•</span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="message-bubble">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <form onSubmit={handleSendReply} className="chat-form">
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type your reply..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    disabled={ticket.status === 'Closed'}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!reply.trim() || sending || ticket.status === 'Closed'}
                                    className="btn btn-primary"
                                    style={{ opacity: (!reply.trim() || sending || ticket.status === 'Closed') ? 0.5 : 1 }}
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                            {ticket.status === 'Closed' && (
                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>This ticket is closed. You can no longer reply.</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Info (Desktop only) */}
                    <div className="info-sidebar">
                        <h3 className="support-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ticket Details</h3>
                        
                        <div className="info-item">
                            <p className="info-label">Category</p>
                            <p className="info-value" style={{ backgroundColor: '#f9fafb', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }}>{ticket.category}</p>
                        </div>
                        <div className="info-item">
                            <p className="info-label">Priority</p>
                            <p className={`priority-badge ${
                                ticket.priority === 'Critical' ? 'priority-critical' : 
                                ticket.priority === 'High' ? 'priority-high' : 'priority-medium'
                            }`} style={{ fontSize: '0.875rem' }}>{ticket.priority}</p>
                        </div>
                        <div className="info-item">
                            <p className="info-label">Assigned Agent</p>
                            <div className="flex-center">
                                <div className="avatar-circle">
                                    {ticket.assignedTo?.name?.[0] || 'A'}
                                </div>
                                <span className="info-value">{ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <p className="info-label">Last Updated</p>
                            <div className="flex-center info-value" style={{ fontWeight: 400 }}>
                                <Clock size={14} style={{ marginRight: '0.25rem', color: '#9ca3af' }} />
                                {new Date(ticket.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TicketDetails;
