import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showConfirmDelete } from '../utils/swalUtils';
import Swal from 'sweetalert2';

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
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${newStatus} this customer's KYC?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!'
        });

        if (!result.isConfirmed) return;

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
            await showSuccessAlert(`Customer KYC ${newStatus} successfully`);
        } catch (err) {
            console.error(err);
            showErrorAlert('Error updating KYC status');
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
            showErrorAlert('Error viewing document');
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

    const calculateExpiryDate = (purchaseDate, tenureValue, tenureUnit) => {
        if (!purchaseDate || !tenureValue || !tenureUnit) return 'N/A';
        const date = new Date(purchaseDate);
        if (isNaN(date.getTime())) return 'N/A';
        
        const value = parseInt(tenureValue);
        
        switch (tenureUnit.toLowerCase()) {
            case 'days':
                date.setDate(date.getDate() + value);
                break;
            case 'months':
                date.setMonth(date.getMonth() + value);
                break;
            case 'years':
                date.setFullYear(date.getFullYear() + value);
                break;
            default:
                break;
        }
        return date.toLocaleDateString();
    };

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
                        
                        {(localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'agent') && (
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
                        )}
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
                            {customer.assignedAgentId && (
                                <div className="review-item">
                                    <span className="review-label">Assigned Agent</span>
                                    <span className="review-value">
                                        {customer.assignedAgentId.name || 'N/A'} ({customer.assignedAgentId.email || 'N/A'})
                                    </span>
                                </div>
                            )}
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

                {/* Purchased Policy Details */}
                <div className="review-section" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="review-section-title" style={{ marginBottom: 0 }}>Purchased Policy Details</h3>
                        <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => navigate(`/admin/customers/${customer._id}/buy-policy`)}
                        >
                            + Buy Policy
                        </button>
                    </div>
                    {customer.purchasedPolicies && customer.purchasedPolicies.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {customer.purchasedPolicies.map((purchase, index) => {
                                const policy = purchase.policy;
                                if (!policy) return null;
                                return (
                                    <div key={index} style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        backgroundColor: 'white',
                                        position: 'relative'
                                    }}>
                                        {/* Status Badge */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                padding: '0.25rem 0.75rem', 
                                                borderRadius: '9999px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600,
                                                backgroundColor: policy.policySource === 'THIRD_PARTY' ? '#fff7ed' : '#f0fdf4',
                                                color: policy.policySource === 'THIRD_PARTY' ? '#c2410c' : '#15803d',
                                                border: `1px solid ${policy.policySource === 'THIRD_PARTY' ? '#fdba74' : '#86efac'}`
                                            }}>
                                                {policy.policySource === 'THIRD_PARTY' ? 'Third-Party' : 'In-House'}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500, marginTop: '2px' }}>
                                                    Expires: {calculateExpiryDate(purchase.purchaseDate, policy.tenureValue, policy.tenureUnit)}
                                                </div>
                                                {purchase.policyDocument && (
                                                    <a 
                                                        href={`${API_BASE_URL.replace('/api', '')}/${purchase.policyDocument}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'inline-block', fontSize: '0.75rem', color: '#2563eb', marginTop: '4px', textDecoration: 'none', fontWeight: 500 }}
                                                    >
                                                        View Policy Document
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                                            {policy.policyName}
                                        </h3>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                            {policy.policyType?.name} • {policy.planName}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Premium Amount</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                                    ${policy.premiumAmount?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Coverage Limit</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                                    ${policy.coverageAmount?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Policy Tenure</div>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                    {policy.tenureValue} {policy.tenureUnit}
                                                </div>
                                            </div>
                                            {policy.provider && (
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Provider</div>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {policy.provider.name}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : customer.selectedPolicy ? (
                        // Fallback for legacy single policy
                        <div style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            backgroundColor: 'white',
                            position: 'relative',
                            maxWidth: '600px'
                        }}>
                             {/* Badge */}
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '9999px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    backgroundColor: customer.selectedPolicy.policySource === 'THIRD_PARTY' ? '#fff7ed' : '#f0fdf4',
                                    color: customer.selectedPolicy.policySource === 'THIRD_PARTY' ? '#c2410c' : '#15803d',
                                    border: `1px solid ${customer.selectedPolicy.policySource === 'THIRD_PARTY' ? '#fdba74' : '#86efac'}`,
                                }}>
                                    {customer.selectedPolicy.policySource === 'THIRD_PARTY' ? 'Third-Party' : 'In-House'}
                                </div>
                                {/* Legacy doesn't store purchase date usually, but if it does, show it. Assuming today if missing or hidden. */}
                             </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                                {customer.selectedPolicy.policyName}
                            </h3>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                {customer.selectedPolicy.policyType?.name} • {customer.selectedPolicy.planName}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Premium Amount</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                        ${customer.selectedPolicy.premiumAmount?.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Coverage Limit</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                        ${customer.selectedPolicy.coverageAmount?.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Policy Tenure</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                        {customer.selectedPolicy.tenureValue} {customer.selectedPolicy.tenureUnit}
                                    </div>
                                </div>
                                {customer.selectedPolicy.provider && (
                                     <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Provider</div>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                            {customer.selectedPolicy.provider.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                            <p style={{ color: '#64748b' }}>No policy purchased yet.</p>
                        </div>
                    )}
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
