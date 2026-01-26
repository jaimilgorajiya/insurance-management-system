import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentModal, setDocumentModal] = useState({ isOpen: false, document: null, type: null });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCustomerDetails();
    }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/details/${id}`, {
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

            if (!res.ok) throw new Error('Failed to fetch customer details');

            const data = await res.json();
            setCustomer(data.data.customer);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKycUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this customer's KYC?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ kycStatus: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update KYC status');

            const data = await res.json();
            setCustomer(data.customer);
            alert(`Customer KYC ${newStatus} successfully`);
        } catch (err) {
            alert('Error updating KYC status');
            console.error(err);
        }
    };

    const fetchDocument = async (documentType, filename) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/document/${id}/${documentType}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch document');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            
            // Determine file type from blob or filename extension
            const isPdf = filename.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';
            
            setDocumentModal({ 
                isOpen: true, 
                url, 
                type: documentType, 
                name: filename,
                isPdf 
            });

        } catch (err) {
            alert('Error viewing document');
            console.error(err);
        }
    };

    const closeDocumentModal = () => {
        if (documentModal.url) {
            URL.revokeObjectURL(documentModal.url);
        }
        setDocumentModal({ isOpen: false, document: null, type: null, url: null });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'badge-kyc approved';
            case 'rejected': return 'badge-kyc rejected';
            default: return 'badge-kyc pending';
        }
    };

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    if (loading) return <Layout><div className="center-screen">Loading customer details...</div></Layout>;
    if (error) return <Layout><div className="center-screen text-error">{error}</div></Layout>;
    if (!customer) return <Layout><div className="center-screen">Customer not found</div></Layout>;

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <button onClick={() => navigate('/admin/customers')} className="btn-outline" style={{marginBottom: '1rem', border: 'none', paddingLeft: 0}}>
                            ← Back to Customers
                        </button>
                        <h1 className="page-title">{customer.name}</h1>
                        <p className="page-subtitle">Customer ID: {customer._id}</p>
                    </div>
                    <div className="header-actions" style={{ alignItems: 'center' }}>
                        <span className={`badge-status ${customer.status}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
                            {capitalize(customer.status)}
                        </span>
                        <span className={`badge-kyc ${customer.kycStatus}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
                            KYC: {capitalize(customer.kycStatus)}
                        </span>
                        
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                <button 
                                    className="btn-primary"
                                    style={{ backgroundColor: '#10b981', opacity: customer.kycStatus === 'approved' ? 0.5 : 1, cursor: customer.kycStatus === 'approved' ? 'not-allowed' : 'pointer' }}
                                    onClick={() => handleKycUpdate('approved')}
                                    disabled={customer.kycStatus === 'approved'}
                                >
                                    Approve KYC
                                </button>
                                <button 
                                    className="btn-primary"
                                    style={{ backgroundColor: '#ef4444', opacity: customer.kycStatus === 'rejected' ? 0.5 : 1, cursor: customer.kycStatus === 'rejected' ? 'not-allowed' : 'pointer' }}
                                    onClick={() => handleKycUpdate('rejected')}
                                    disabled={customer.kycStatus === 'rejected'}
                                >
                                    Reject KYC
                                </button>
                            </div>
                    </div>
                </div>

                <div className="form-grid">
                    {/* Personal Details */}
                    <div className="review-section">
                        <h3 className="review-section-title">Personal Details</h3>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">First Name</span>
                                <span className="review-value">{customer.firstName}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Last Name</span>
                                <span className="review-value">{customer.lastName}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Date of Birth</span>
                                <span className="review-value">{new Date(customer.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Gender</span>
                                <span className="review-value">{customer.gender}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Occupation</span>
                                <span className="review-value">{customer.occupation}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Annual Income</span>
                                <span className="review-value">${customer.annualIncome}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="review-section">
                        <h3 className="review-section-title">Contact Information</h3>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Email</span>
                                <span className="review-value">{customer.email}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Phone</span>
                                <span className="review-value">{customer.mobile}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Alternate Phone</span>
                                <span className="review-value">{customer.alternatePhone || 'N/A'}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Address</span>
                                <span className="review-value">
                                    {customer.address?.addressLine1}
                                    {customer.address?.addressLine2 && `, ${customer.address.addressLine2}`}
                                    <br />
                                    {customer.address?.city}, {customer.address?.state} {customer.address?.zipCode}
                                    <br />
                                    {customer.address?.country}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC Documents */}
                <div style={{ marginTop: '2rem' }}>
                    <h2 className="step-title">KYC Documents</h2>
                    <div className="documents-grid">
                        {['governmentId', 'proofOfAddress', 'incomeProof'].map(docType => {
                            const doc = customer.kycDocuments?.[docType];
                            if (!doc) return null;

                            return (
                                <div key={docType} className="document-upload-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 className="upload-title" style={{ marginTop: 0 }}>
                                            {docType === 'governmentId' ? 'Government ID' : 
                                             docType === 'proofOfAddress' ? 'Proof of Address' : 'Income Proof'}
                                        </h3>
                                        <div className="file-name">{doc.originalName}</div>
                                        <div className="file-date">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</div>
                                        {/* Status badge for document can remain if desired, or be removed if irrelevant */}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <button 
                                            className="btn-outline" 
                                            onClick={() => fetchDocument(docType, doc.originalName)}
                                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                        >
                                            View Document
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Document Modal */}
                {documentModal.isOpen && (
                    <div className="modal-overlay" onClick={closeDocumentModal} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                            backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem',
                            maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', position: 'relative',
                            width: documentModal.isPdf ? '800px' : 'auto'
                        }}>
                            <div className="modal-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <h3 className="modal-title">{documentModal.name}</h3>
                                <button onClick={closeDocumentModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center' }}>
                                {documentModal.isPdf ? (
                                    <iframe src={documentModal.url} width="100%" height="600px" title="PDF Document"></iframe>
                                ) : (
                                    <img 
                                        src={documentModal.url} 
                                        alt="Document"
                                        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CustomerDetails;
