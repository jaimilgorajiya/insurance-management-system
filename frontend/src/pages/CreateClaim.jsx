import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert } from '../utils/swalUtils';
import { ArrowLeft, Check, ChevronRight, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const steps = [
    { id: 1, title: 'Select Policy' },
    { id: 2, title: 'Incident Details' },
    { id: 3, title: 'Upload Evidence' },
    { id: 4, title: 'Review & Submit' }
];

const CreateClaim = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingPolicies, setLoadingPolicies] = useState(false);
    const fileInputRef = useRef(null);
    
    // Data
    const [customers, setCustomers] = useState([]);
    const [policies, setPolicies] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        policyId: '',
        type: 'Theft',
        incidentDate: '',
        description: '',
        requestedAmount: ''
    });
    const [files, setFiles] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (userRole === 'admin' || userRole === 'agent') {
            fetchCustomers();
        }
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/customer/all`, {
               headers: { 'Authorization': `Bearer ${token}` }
            });
            // Backend returns { customers: [...] } or { data: [...] } depending on endpoint
            const list = res.data.customers || res.data.data || [];
            setCustomers(list);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchPolicies = async (customerId) => {
        if (!customerId) return;
        setLoadingPolicies(true);
        try {
            const token = localStorage.getItem('token');
            // Use the specific endpoint we fixed
            const res = await axios.get(`${API_BASE_URL}/customer/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) {
                const customerData = res.data.data;
                // Only show active policies for creating new claims
                const activePolicies = (customerData.purchasedPolicies || []).filter(p => p.status === 'active');
                setPolicies(activePolicies);
            }
        } catch (error) {
            console.error("Error fetching policies:", error);
            showErrorAlert('Failed to load customer policies');
        } finally {
            setLoadingPolicies(false);
        }
    };

    const handleCustomerChange = (e) => {
        const custId = e.target.value;
        setFormData({ ...formData, customerId: custId, policyId: '' });
        fetchPolicies(custId);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        // Validating file size (e.g., 5MB limit)
        const validFiles = selectedFiles.filter(file => file.size <= 5 * 1024 * 1024);
        
        if (validFiles.length !== selectedFiles.length) {
            showErrorAlert('Some files were skipped because they exceed 5MB limit');
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                requestedAmount: Number(formData.requestedAmount)
            };
            
            // 1. Create Claim
            const res = await axios.post(`${API_BASE_URL}/claims`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                const claimId = res.data.data._id;
                const claimNumber = res.data.data.claimNumber;

                // 2. Upload Documents (if any)
                if (files.length > 0) {
                    await uploadDocuments(claimId, token);
                }

                showSuccessAlert('Claim submitted successfully', `Your claim ID is ${claimNumber}`);
                navigate('/admin/claims');
            }
        } catch (error) {
            console.error("Error creating claim:", error);
            showErrorAlert(error.response?.data?.message || 'Failed to submit claim');
        } finally {
            setLoading(false);
        }
    };

    const uploadDocuments = async (claimId, token) => {
        const uploadPromises = files.map(file => {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('type', file.type.includes('image') ? 'Image' : 'Document');
            
            return axios.post(`${API_BASE_URL}/claims/${claimId}/documents`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
        });

        try {
            await Promise.all(uploadPromises);
        } catch (err) {
            console.error("Error uploading documents:", err);
            // Show the specific error from the first failed request if possible
            const msg = err.response?.data?.message || 'Claim created, but some documents failed to upload.';
            showErrorAlert(msg);
        }
    };

    // Step Rendering
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
                        <div className="form-group">
                            <label className="form-label">Select Customer</label>
                            <select 
                                className="form-select"
                                value={formData.customerId}
                                onChange={handleCustomerChange}
                            >
                                <option value="">-- Choose Customer --</option>
                                {customers.map(c => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Policy</label>
                             <select 
                                className="form-select"
                                value={formData.policyId}
                                onChange={(e) => setFormData({...formData, policyId: e.target.value})}
                                disabled={!formData.customerId || loadingPolicies}
                                style={{ backgroundColor: (!formData.customerId || loadingPolicies) ? '#f3f4f6' : 'white' }}
                            >
                                <option value="">-- Choose Policy --</option>
                                {policies.map(p => (
                                    <option key={p.policy._id} value={p.policy._id}>
                                        {p.policy.policyName} ({p.policy.planName}) - ID: {p.policy._id.slice(-6)}
                                    </option>
                                ))}
                            </select>
                            {loadingPolicies && <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '4px' }}>Loading policies...</p>}
                        </div>
                    </div>
                );
            case 2:
                const isMaturity = formData.type === 'Maturity';
                const selectedPolicy = policies.find(p => p.policy._id === formData.policyId);
                const isTravelPolicy = selectedPolicy?.policy?.policyType?.name?.toLowerCase().includes('travel');

                // Maturity Calculation
                let maturityInfo = null;
                if (isMaturity && selectedPolicy && formData.incidentDate) {
                    const startDate = new Date(selectedPolicy.purchaseDate);
                    const claimDate = new Date(formData.incidentDate);
                    const policy = selectedPolicy.policy;
                    
                    let expiryDate = new Date(startDate);
                    if (policy.tenureUnit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + policy.tenureValue);
                    else if (policy.tenureUnit === 'months') expiryDate.setMonth(expiryDate.getMonth() + policy.tenureValue);
                    else expiryDate.setDate(expiryDate.getDate() + policy.tenureValue);

                    let payable = 0;
                    let type = "ON_TIME";
                    
                    if (claimDate >= expiryDate) {
                        payable = policy.coverageAmount;
                        type = "ON_TIME";
                    } else {
                        type = "EARLY";
                        const totalDuration = expiryDate.getTime() - startDate.getTime();
                        const elapsedDuration = claimDate.getTime() - startDate.getTime();
                        if (totalDuration > 0) {
                            const ratio = Math.max(0, elapsedDuration / totalDuration);
                            payable = policy.coverageAmount * ratio;
                        } else {
                            payable = policy.coverageAmount;
                        }
                    }
                    
                    maturityInfo = {
                        startDate,
                        expiryDate,
                        payable: Math.round(payable * 100) / 100,
                        type
                    };
                }

                return (
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem' }}>Claim Category</label>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="claimCategory" 
                                        checked={!isMaturity}
                                        onChange={() => setFormData({...formData, type: 'Theft', requestedAmount: ''})} 
                                    />
                                    <span style={{ fontWeight: 500, color: '#0f172a' }}>Accident / Incident</span>
                                </label>
                                <label 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        cursor: isTravelPolicy ? 'not-allowed' : 'pointer',
                                        opacity: isTravelPolicy ? 0.5 : 1
                                    }}
                                    title={isTravelPolicy ? "Maturity claims are not applicable for Travel Isolation Policies" : ""}
                                >
                                    <input 
                                        type="radio" 
                                        name="claimCategory" 
                                        checked={isMaturity}
                                        disabled={isTravelPolicy}
                                        onChange={() => {
                                            if (isTravelPolicy) return;
                                            setFormData({
                                                ...formData, 
                                                type: 'Maturity',
                                                requestedAmount: '' // Reset to force calculation/entry
                                            });
                                        }}
                                    />
                                    <span style={{ fontWeight: 500, color: '#0f172a' }}>Policy Maturity</span>
                                </label>
                            </div>
                            {isTravelPolicy && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>* Maturity claims are not available for Travel policies.</p>}
                        </div>

                        {!isMaturity && (
                            <div className="form-group">
                                <label className="form-label">Incident Type</label>
                                <select 
                                    className="form-select"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="Theft">Theft</option>
                                    <option value="Accident">Accident</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Fire">Fire</option>
                                    <option value="Death">Death</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">{isMaturity ? 'Maturity / Completion Date' : 'Incident Date'}</label>
                            <input 
                                type="date"
                                className="form-input"
                                value={formData.incidentDate}
                                onChange={(e) => setFormData({...formData, incidentDate: e.target.value})}
                            />
                        </div>

                        {/* Maturity Details Section */}
                        {isMaturity && maturityInfo && (
                            <div className="form-group" style={{ gridColumn: 'span 2', layout: 'flex', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Policy Start Date</span>
                                        <span style={{ fontWeight: 500 }}>{maturityInfo.startDate.toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Policy Expiry Date</span>
                                        <span style={{ fontWeight: 500 }}>{maturityInfo.expiryDate.toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Coverage Amount</span>
                                        <span style={{ fontWeight: 500 }}>${selectedPolicy.policy.coverageAmount.toLocaleString()}</span>
                                    </div>
                                    {/* Eligible Amount hidden as per request */}
                                    {/* <div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Eligible Maturity Amount</span>
                                        <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '1.1rem' }}>${maturityInfo.payable.toLocaleString()}</span>
                                    </div> */}
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: maturityInfo.type === 'EARLY' ? '#fff7ed' : '#f0fdf4', border: `1px solid ${maturityInfo.type === 'EARLY' ? '#fdba74' : '#86efac'}` }}>
                                    <p style={{ fontSize: '0.875rem', color: maturityInfo.type === 'EARLY' ? '#c2410c' : '#15803d', margin: 0 }}>
                                        {maturityInfo.type === 'EARLY' 
                                            ? "⚠️ Early maturity detected. Payable amount adjusted based on policy duration."
                                            : "✅ Policy maturity completed. Full coverage eligible."}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">{isMaturity ? 'Requested Payout Amount ($)' : 'Estimated Claim Amount ($)'}</label>
                            <input 
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={formData.requestedAmount}
                                onChange={(e) => setFormData({...formData, requestedAmount: e.target.value})}
                                style={{ backgroundColor: 'white' }}
                            /> 
                            
                            {/* Validation / Warnings */}
                            {isMaturity && maturityInfo && Number(formData.requestedAmount) > maturityInfo.payable && (
                                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem', fontWeight: 600 }}>
                                    ⛔ Error: Requested amount cannot exceed eligible amount (${maturityInfo.payable.toLocaleString()})
                                </p>
                            )}

                            {!isMaturity && selectedPolicy?.policy?.coverageAmount && Number(formData.requestedAmount) > selectedPolicy.policy.coverageAmount && (
                                <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                    ⚠️ Warning: Claim amount exceeds policy coverage (${selectedPolicy.policy.coverageAmount.toLocaleString()})
                                </p>
                            )}
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">{isMaturity ? 'Remarks / Notes' : 'Description of Incident'}</label>
                            <textarea 
                                className="form-input"
                                style={{ height: '120px', resize: 'vertical' }}
                                placeholder={isMaturity ? "Enter any additional remarks..." : "Describe what happened..."}
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>
                );
            case 3: // Upload Evidence
                return (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div 
                            className="file-dropzone"
                            style={{
                                border: '2px dashed #94a3b8',
                                borderRadius: '8px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#f8fafc',
                                marginBottom: '1.5rem',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#94a3b8';
                                const droppedFiles = Array.from(e.dataTransfer.files);
                                setFiles(prev => [...prev, ...droppedFiles]);
                            }}
                        >
                            <Upload size={32} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                            <h4 style={{ color: '#334155', marginBottom: '0.25rem' }}>Click or Drag files to upload</h4>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Images, PDF (Max 5MB)</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                multiple 
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>

                        {files.length > 0 && (
                            <div className="file-list">
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Selected Files ({files.length})</h4>
                                {files.map((file, index) => (
                                    <div key={index} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0',
                                        borderRadius: '6px', marginBottom: '0.5rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {file.type.includes('image') ? <ImageIcon size={20} color="#2563eb" /> : <FileText size={20} color="#2563eb" />}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
                                                    {file.name.length > 30 ? file.name.slice(0, 30) + '...' : file.name}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFile(index)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <X size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="review-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3 className="review-section-title">Confirm Details</h3>
                        <div className="review-grid">
                            <div className="review-item">
                                <span className="review-label">Customer</span>
                                <span className="review-value">{customers.find(c => c._id === formData.customerId)?.name}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Policy ID</span>
                                <span className="review-value">{formData.policyId.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Type</span>
                                <span className="review-value">{formData.type}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Date</span>
                                <span className="review-value">{formData.incidentDate}</span>
                            </div>
                            {formData.type !== 'Maturity' && (
                                <div className="review-item">
                                    <span className="review-label">Requested Amount</span>
                                    <span className="review-value" style={{ color: '#2563eb', fontSize: '1.1rem' }}>${Number(formData.requestedAmount).toLocaleString()}</span>
                                </div>
                            )}
                             <div className="review-item">
                                <span className="review-label">Documents</span>
                                <span className="review-value">{files.length} attached</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <span className="review-label">Description</span>
                            <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>{formData.description}</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Layout>
            <div className="onboarding-container">
                <div className="page-header">
                    <div>
                        <button onClick={() => navigate('/admin/claims')} className="btn-outline" style={{marginBottom: '1rem', border: 'none', paddingLeft: 0}}>
                            <ArrowLeft size={18} /> Back to Claims
                        </button>
                        <h1 className="page-title">Create New Claim</h1>
                    </div>
                </div>

                {/* Stepper */}
                <div className="stepper-container">
                    {steps.filter(step => !(formData.type === 'Maturity' && step.id === 3)).map((step, index, arr) => (
                        <div key={step.id} className="stepper-item">
                            <div className={`stepper-circle ${
                                currentStep === step.id ? 'active' : 
                                currentStep > step.id ? 'completed' : 'inactive'
                            }`}>
                                {currentStep > step.id ? <Check size={16} /> : step.id}
                            </div>
                            <div className="stepper-content">
                                <span className="stepper-label">Step {step.id}</span>
                                <span className="stepper-title">{step.title}</span>
                            </div>
                            {index < arr.length - 1 && (
                                <div className={`stepper-line ${currentStep > step.id ? 'completed' : 'inactive'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="form-container">
                    <h2 className="step-title">{steps[currentStep-1].title}</h2>
                    
                    {renderStepContent()}

                    {/* Navigation Buttons */}
                    <div className="form-navigation" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <button
                            onClick={() => {
                                if (currentStep === 4 && formData.type === 'Maturity') {
                                    setCurrentStep(2);
                                    return;
                                }
                                setCurrentStep(curr => curr - 1);
                            }}
                            className="btn-outline"
                            style={{ opacity: currentStep === 1 ? 0.5 : 1, cursor: currentStep === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Back
                        </button>

                        {currentStep === 4 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary"
                                style={{ opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Submitting...' : 'Submit Claim'}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    // Validation
                                    if (currentStep === 1 && (!formData.customerId || !formData.policyId)) return showErrorAlert('Please select customer and policy');
                                    
                                    const isMaturity = formData.type === 'Maturity';
                                    if (currentStep === 2) {
                                        if (!formData.incidentDate) return showErrorAlert('Please fill in required details');
                                        if (!isMaturity && !formData.requestedAmount) return showErrorAlert('Please enter requested amount');
                                    }
                                    
                                    // Step 3 (Files) is optional but skipped for Maturity
                                    if (currentStep === 2 && isMaturity) {
                                        // Maturity Validation
                                        const selectedPolicy = policies.find(p => p.policy._id === formData.policyId);
                                        if (selectedPolicy) {
                                            const startDate = new Date(selectedPolicy.purchaseDate);
                                            const claimDate = new Date(formData.incidentDate);
                                            const policy = selectedPolicy.policy;
                                            
                                            let expiryDate = new Date(startDate);
                                            if (policy.tenureUnit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + policy.tenureValue);
                                            else if (policy.tenureUnit === 'months') expiryDate.setMonth(expiryDate.getMonth() + policy.tenureValue);
                                            else expiryDate.setDate(expiryDate.getDate() + policy.tenureValue);

                                            let payable = 0;
                                            if (claimDate >= expiryDate) {
                                                payable = policy.coverageAmount;
                                            } else {
                                                const totalDuration = expiryDate.getTime() - startDate.getTime();
                                                const elapsedDuration = claimDate.getTime() - startDate.getTime();
                                                if (totalDuration > 0) {
                                                    const ratio = Math.max(0, elapsedDuration / totalDuration);
                                                    payable = policy.coverageAmount * ratio;
                                                } else {
                                                    payable = policy.coverageAmount;
                                                }
                                            }
                                            
                                            // Rounding for consistent comparison
                                            payable = Math.round(payable * 100) / 100;

                                            if (formData.requestedAmount && Number(formData.requestedAmount) > payable) {
                                                 return showErrorAlert(`Requested amount exceeds eligible limit ($${payable.toLocaleString()})`);
                                            }
                                            
                                            // If amount not entered, use calculated amount (stored but not forced on user to type)
                                            if (!formData.requestedAmount) {
                                                setFormData(prev => ({ ...prev, requestedAmount: payable }));
                                            }
                                        }

                                        setCurrentStep(4);
                                        return;
                                    }
                                    
                                    setCurrentStep(curr => curr + 1);
                                }}
                                className="btn-primary"
                            >
                                {currentStep === 2 && formData.type === 'Maturity' ? 'Review & Submit' : 'Next Step'} <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateClaim;
