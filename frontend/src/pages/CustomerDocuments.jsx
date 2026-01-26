import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showErrorAlert } from '../utils/swalUtils';
import { FileText, Download, Eye, Calendar, User, Mail, ChevronLeft, ArrowLeft } from 'lucide-react';

const CustomerDocuments = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customerInfo, setCustomerInfo] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCustomerDocs();
    }, [customerId]);

    const fetchCustomerDocs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/documents/customers/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCustomerInfo(data.data.customer);
                setDocuments(data.data.documents);
            } else {
                showErrorAlert(data.message);
                navigate('/admin/documents');
            }
        } catch (error) {
            console.error("Error fetching customer documents:", error);
            showErrorAlert("Failed to load customer documents");
        } finally {
            setLoading(false);
        }
    };

    const fetchDocPreview = async (doc) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/document/${customerId}/${doc.docTypeKey}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load preview");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            return url;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const handleView = async (doc) => {
        setSelectedDoc(doc);
        setIsViewModalOpen(true);
        const url = await fetchDocPreview(doc);
        if (url) {
            setPreviewUrl(url);
        } else {
            showErrorAlert("Could not load document preview");
        }
    };

    const handleCloseView = () => {
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedDoc(null);
        setIsViewModalOpen(false);
    };

    const handleDownload = async (doc) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/document/${customerId}/${doc.docTypeKey}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Failed to download file");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.docName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            showErrorAlert("Could not download file");
        }
    };


    return (
        <Layout>
            <div className="onboarding-container">
                <div style={{ marginBottom: '1.5rem' }}>
                    <button 
                        onClick={() => navigate('/admin/documents')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Back to Customer List
                    </button>
                </div>

                {customerInfo && (
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                        <div>
                            <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>{customerInfo.name}</h1>
                            <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {customerInfo.email}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> {documents.length} Total Documents</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading customer documents...</div>
                    ) : (
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Document Name</th>
                                    <th>Category</th>
                                    <th>Format</th>
                                    <th>Upload Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc._id}>
                                        <td><div style={{ fontWeight: 600 }}>{doc.docName}</div></td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600, 
                                                backgroundColor: doc.docTypeKey === 'governmentId' ? '#eff6ff' : doc.docTypeKey === 'proofOfAddress' ? '#f0fdf4' : '#faf5ff',
                                                color: doc.docTypeKey === 'governmentId' ? '#2563eb' : doc.docTypeKey === 'proofOfAddress' ? '#10b981' : '#9333ea'
                                            }}>
                                                {doc.docTypeName}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '2px 8px', 
                                                border: '1px solid #e2e8f0', 
                                                borderRadius: '4px', 
                                                fontSize: '0.7rem', 
                                                textTransform: 'uppercase',
                                                fontWeight: 700,
                                                color: '#64748b'
                                            }}>
                                                {doc.fileType}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>{new Date(doc.uploadDate).toLocaleDateString()}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="action-btn" 
                                                    onClick={() => handleView(doc)}
                                                    style={{ color: '#2563eb' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    className="action-btn" 
                                                    onClick={() => handleDownload(doc)}
                                                    style={{ color: '#64748b' }}
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Quick View Modal */}
                {isViewModalOpen && selectedDoc && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '900px', width: '90%', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">{selectedDoc.docName}</h3>
                                <button className="modal-close" onClick={handleCloseView}>×</button>
                            </div>
                            <div className="modal-body" style={{ flex: 1, padding: '1rem', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {previewUrl ? (
                                    selectedDoc.fileType.toLowerCase().match(/(jpg|jpeg|png|gif|webp|image)/) ? (
                                        <img 
                                            src={previewUrl} 
                                            alt={selectedDoc.docName} 
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                        />
                                    ) : (
                                        <iframe 
                                            src={previewUrl}
                                            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                                            title="Document Preview"
                                        />
                                    )
                                ) : (
                                    <div style={{ color: '#64748b' }}>Loading preview...</div>
                                )}
                            </div>
                            <div className="modal-footer">
                               
                                <button className="btn-primary" onClick={() => handleDownload(selectedDoc)}>
                                    <Download size={18} /> Download Copy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CustomerDocuments;
