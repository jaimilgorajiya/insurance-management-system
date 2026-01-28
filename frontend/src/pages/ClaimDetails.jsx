import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showConfirmAction } from '../utils/swalUtils';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, User, Upload } from 'lucide-react';
import axios from 'axios';

const ClaimDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userRole = localStorage.getItem('userRole');
    // Derive Server URL for static assets (remove /api suffix if present)
    const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

    useEffect(() => {
        fetchClaimDetails();
    }, [id]);

    const fetchClaimDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/claims/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) {
                setClaim(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching claim details:", error);
            showErrorAlert('Failed to load claim details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus, approvedAmt = null) => {
        const isConfirmed = await showConfirmAction(
            `${newStatus} Claim`,
            `Are you sure you want to mark this claim as ${newStatus}?`,
            `Yes, ${newStatus} it`,
            newStatus === 'Rejected' ? '#ef4444' : '#10b981'
        );

        if (!isConfirmed) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const payload = { status: newStatus };
            if (approvedAmt) payload.approvedAmount = approvedAmt;

            const res = await axios.put(`${API_BASE_URL}/claims/${id}/status`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                showSuccessAlert(`Claim ${newStatus} successfully`);
                fetchClaimDetails(); // Refresh
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showErrorAlert("Failed to update status");
        } finally {
            setProcessing(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/claims/${id}/notes`, {
                text: noteText,
                isInternal: true 
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                setNoteText('');
                fetchClaimDetails();
            }
        } catch (error) {
            showErrorAlert("Failed to add note");
        }
    };

    const handleUploadDocument = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', file.type.includes('image') ? 'Image' : 'Document');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/claims/${id}/documents`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.success) {
                showSuccessAlert('Document uploaded successfully');
                fetchClaimDetails();
            }
        } catch (error) {
            console.error("Upload error:", error);
            const msg = error.response?.data?.message || "Failed to upload document";
            showErrorAlert(msg);
        }
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'Approved': { backgroundColor: '#dcfce7', color: '#15803d' },
            'Rejected': { backgroundColor: '#fee2e2', color: '#b91c1c' },
            'Submitted': { backgroundColor: '#eff6ff', color: '#1d4ed8' },
            'Settled': { backgroundColor: '#f3e8ff', color: '#7e22ce' }
        };
        return styles[status] || { backgroundColor: '#eff6ff', color: '#1d4ed8' };
    };

    if (loading) return <Layout><div className="center-screen">Loading details...</div></Layout>;
    if (!claim) return <Layout><div className="center-screen">Claim not found.</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                {/* Header Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button 
                        onClick={() => navigate('/admin/claims')} 
                        className="btn-outline" 
                        style={{ border: 'none', paddingLeft: 0, marginBottom: '1rem', color: '#64748b' }}
                    >
                        <ArrowLeft size={18} /> Back to Claims
                    </button>

                    <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Claim #{claim.claimNumber}</h1>
                                <span className="badge-status" style={getStatusBadgeStyle(claim.status)}>
                                    {claim.status}
                                </span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {userRole === 'admin' && claim.status !== 'Approved' && claim.status !== 'Rejected' && claim.status !== 'Settled' && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    disabled={processing}
                                    className="btn-outline"
                                    style={{ borderColor: '#fecaca', color: '#ef4444', backgroundColor: '#fef2f2' }}
                                >
                                    <XCircle size={18} /> Reject
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate('Approved', claim.requestedAmount)}
                                    disabled={processing}
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <CheckCircle size={18} /> Approve
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    {/* Left Column - Main Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Incident Info */}
                        <div className="stat-card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} color="#2563eb" /> Incident Details
                            </h3>
                            <div className="review-grid">
                                <div className="review-item">
                                    <span className="review-label">Type</span>
                                    <span className="review-value">{claim.type}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Incident Date</span>
                                    <span className="review-value">{new Date(claim.incidentDate).toLocaleDateString()}</span>
                                </div>
                                <div className="review-item">
                                    <span className="review-label">Requested Amount</span>
                                    <span className="review-value" style={{ color: '#2563eb', fontSize: '1.1rem' }}>${claim.requestedAmount.toLocaleString()}</span>
                                </div>
                                {claim.approvedAmount > 0 && (
                                    <div className="review-item">
                                        <span className="review-label">Approved Amount</span>
                                        <span className="review-value" style={{ color: '#16a34a', fontSize: '1.1rem' }}>${claim.approvedAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <span className="review-label">Description</span>
                                <p style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                                    {claim.description}
                                </p>
                            </div>
                        </div>

                        {/* Customer & Policy Info */}
                         <div className="stat-card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={20} color="#2563eb" /> Policy & Customer
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Customer</h4>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}><span style={{fontWeight: 600}}>{claim.customer?.name}</span></p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>{claim.customer?.email}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{claim.customer?.mobile || 'No phone'}</p>
                                    <button 
                                        onClick={() => navigate(`/admin/customer/${claim.customer?._id}`)}
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.5rem', textDecoration: 'underline' }}
                                    >
                                        View Profile
                                    </button>
                                </div>
                                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Policy Details</h4>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}><span style={{fontWeight: 600}}>{claim.policy?.planName}</span></p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Type: {claim.policy?.policyType?.name}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Coverage: ${claim.policy?.coverageAmount?.toLocaleString()}</p>
                                    <button 
                                        onClick={() => navigate(`/admin/policies/${claim.policy?._id}`)}
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.5rem', textDecoration: 'underline' }}
                                    >
                                        View Policy
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <FileText size={20} color="#2563eb" /> Documents & Evidence
                                </h3>
                                {userRole !== 'customer' && (
                                    <label 
                                        style={{ 
                                            cursor: 'pointer', 
                                            fontSize: '0.85rem', 
                                            color: '#2563eb', 
                                            fontWeight: 500, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.25rem' 
                                        }}
                                    >
                                        <input 
                                            type="file" 
                                            style={{ display: 'none' }} 
                                            onChange={(e) => {
                                                if(e.target.files?.[0]) handleUploadDocument(e.target.files[0]);
                                            }}
                                        />
                                        <Upload size={16} /> Add New
                                    </label>
                                )}
                            </div>

                            {claim.documents && claim.documents.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {claim.documents.map((doc, index) => (
                                        <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'auto' }}>
                                                <FileText size={24} color="#64748b" />
                                                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500, wordBreak: 'break-all' }}>{doc.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                <button 
                                                    onClick={() => setSelectedDoc(doc)}
                                                    style={{ 
                                                        fontSize: '0.75rem', 
                                                        color: '#2563eb', 
                                                        textDecoration: 'underline', 
                                                        background: 'none', 
                                                        border: 'none', 
                                                        cursor: 'pointer', 
                                                        padding: 0 
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>No documents uploaded.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Timeline & Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Timeline */}
                        <div className="stat-card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={20} color="#2563eb" /> Timeline
                            </h3>
                            <div style={{ position: 'relative', borderLeft: '2px solid #e2e8f0', marginLeft: '0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {claim.timeline?.slice().reverse().map((event, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-1.95rem', top: '0.25rem', width: '0.8rem', height: '0.8rem', borderRadius: '50%', backgroundColor: '#e0e7ff', border: '2px solid #6366f1' }}></div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{event.status}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{new Date(event.date).toLocaleString()}</p>
                                        {event.note && <p style={{ fontSize: '0.8rem', color: '#475569' }}>{event.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="stat-card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Notes</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                                {claim.notes?.length === 0 && <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>No notes yet.</p>}
                                {claim.notes?.map((note, index) => (
                                    <div key={index} style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>{note.text}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                                            <span>{note.createdBy?.name || 'User'}</span>
                                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {userRole !== 'customer' && (
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <textarea
                                        className="form-input"
                                        style={{ height: '80px', marginBottom: '0.75rem', resize: 'none' }}
                                        placeholder="Add an internal note..."
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                    ></textarea>
                                    <button 
                                        onClick={handleAddNote}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#1e293b',
                                            color: 'white',
                                            padding: '0.5rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Add Note
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Quick View Modal */}
            {selectedDoc && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div style={{ 
                        backgroundColor: 'white', borderRadius: '0.5rem', width: '90%', maxWidth: '800px', maxHeight: '90vh', 
                        display: 'flex', flexDirection: 'column', overflow: 'hidden' 
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{selectedDoc.name}</h3>
                            <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <XCircle size={24} color="#64748b" />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center' }}>
                            {selectedDoc.url.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={`${SERVER_URL}/${selectedDoc.url}`} style={{ width: '100%', height: '500px', border: 'none' }} title="Document Preview"></iframe>
                            ) : (
                                <img src={`${SERVER_URL}/${selectedDoc.url}`} alt="Document" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                            )}
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                             <a 
                                href={`${SERVER_URL}/${selectedDoc.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Upload size={16} /> Open in New Tab
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
export default ClaimDetails;
