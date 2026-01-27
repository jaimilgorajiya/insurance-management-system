import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../utils/swalUtils';

const EditCustomer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [documentModal, setDocumentModal] = useState({ isOpen: false, document: null });
    const [otherDocsModal, setOtherDocsModal] = useState({ isOpen: false, docName: '', file: null });

    // Form data state
    const [formData, setFormData] = useState({
        // Step 1: Personal Details
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male',
        occupation: '',
        annualIncome: '',
        
        // Step 2: Contact Information
        email: '',
        phone: '',
        alternatePhone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        
        // Nominee Details
        addNominee: false,
        nomineeName: '',
        nomineeRelationship: '',
        nomineeDob: '',
        nomineeContact: '',
        
        // Step 3: KYC Documents
        documents: {
            governmentId: null,
            proofOfAddress: null,
            incomeProof: null,
            nomineeId: null
        },
        
        // Step 4: Policy Selection (empty for now)
        selectedPolicy: null,
        otherDocuments: []
    });

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
            const customer = data.data.customer;

            // Transform backend data to form structure
            setFormData({
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
                gender: customer.gender || 'Male',
                occupation: customer.occupation || '',
                annualIncome: customer.annualIncome || '',
                
                email: customer.email || '',
                phone: customer.mobile || '',
                alternatePhone: customer.alternatePhone || '',
                addressLine1: customer.address?.addressLine1 || '',
                addressLine2: customer.address?.addressLine2 || '',
                city: customer.address?.city || '',
                state: customer.address?.state || '',
                zipCode: customer.address?.zipCode || '',
                country: customer.address?.country || '',
                
                // Nominee Details
                addNominee: !!(customer.nomineeDetails && customer.nomineeDetails.name),
                nomineeName: customer.nomineeDetails?.name || '',
                nomineeRelationship: customer.nomineeDetails?.relationship || '',
                nomineeDob: customer.nomineeDetails?.dateOfBirth ? customer.nomineeDetails.dateOfBirth.split('T')[0] : '',
                nomineeContact: customer.nomineeDetails?.contact || '',

                documents: {
                    governmentId: customer.kycDocuments?.governmentId ? { 
                        name: customer.kycDocuments.governmentId.originalName,
                        existing: true,
                        uploadDate: new Date(customer.kycDocuments.governmentId.uploadDate).toLocaleDateString()
                    } : null,
                    proofOfAddress: customer.kycDocuments?.proofOfAddress ? { 
                        name: customer.kycDocuments.proofOfAddress.originalName,
                        existing: true,
                        uploadDate: new Date(customer.kycDocuments.proofOfAddress.uploadDate).toLocaleDateString()
                    } : null,
                    incomeProof: customer.kycDocuments?.incomeProof ? { 
                        name: customer.kycDocuments.incomeProof.originalName,
                        existing: true,
                        uploadDate: new Date(customer.kycDocuments.incomeProof.uploadDate).toLocaleDateString()
                    } : null,
                    nomineeId: customer.kycDocuments?.nomineeId ? { 
                        name: customer.kycDocuments.nomineeId.originalName,
                        existing: true,
                        uploadDate: new Date(customer.kycDocuments.nomineeId.uploadDate).toLocaleDateString()
                    } : null
                },
                selectedPolicy: customer.selectedPolicy || null,
                otherDocuments: customer.kycDocuments?.otherDocuments ? customer.kycDocuments.otherDocuments.map(doc => ({
                    name: doc.originalName || doc.name,
                    existing: true,
                    uploadDate: new Date(doc.uploadDate).toLocaleDateString(),
                    file: null, // No file object for existing docs
                    ...doc
                })) : []
            });

        } catch (error) {
            console.error("Error fetching customer:", error);
            showErrorAlert("Failed to load customer details");
            navigate('/admin/customers');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Personal Details', key: 'personal' },
        { number: 2, title: 'Contact Information', key: 'contact' },
        { number: 3, title: 'KYC Documents', key: 'kyc' },
        { number: 4, title: 'Select Policy', key: 'policy' },
        { number: 5, title: 'Review & Submit', key: 'review' }
    ];

    // Validation functions - reused and slightly adapted for existing documents check
    const validateStep1 = () => {
        return formData.firstName.trim() && 
               formData.lastName.trim() && 
               formData.dateOfBirth && 
               formData.occupation.trim() && 
               formData.annualIncome;
    };

    const validateStep2 = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Basic phone validation allowing existing format
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        
        return formData.email.trim() && 
               emailRegex.test(formData.email) &&
               formData.phone.trim() && 
               phoneRegex.test(formData.phone.replace(/\s/g, '')) &&
               formData.addressLine1.trim() && 
               formData.city.trim() && 
               formData.state.trim() && 
               formData.zipCode.trim() && 
               formData.country.trim();
    };

    const validateStep3 = () => {
        // Validation passes if document exists (either new or pre-existing)
        const basicDocs = formData.documents.governmentId && 
               formData.documents.proofOfAddress && 
               formData.documents.incomeProof;
        
        if (formData.addNominee) {
            return basicDocs && formData.documents.nomineeId;
        }
        return basicDocs;
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return true; 
            default: return false;
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDocumentUpload = (documentType, file) => {
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showWarningAlert('Please upload only image files (JPEG, PNG, GIF) or PDF documents.', 'Invalid File Type');
            return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showWarningAlert('File size must be less than 10MB.', 'File Too Large');
            return;
        }
        
        const documentData = {
            file: file,
            name: file.name,
            uploadDate: new Date().toLocaleDateString(),
            type: file.type,
            size: file.size,
            existing: false, // Explicitly mark as new
            isNew: true // Additional flag for clarity
        };
        
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [documentType]: documentData
            }
        }));
    };

    const nextStep = () => {
        if (canProceedToNext() && currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const openDocumentModal = async (doc, docType) => {
        if (doc.file) {
            // New local file
            setDocumentModal({ isOpen: true, document: { ...doc, type: doc.file.type || 'unknown' }, url: URL.createObjectURL(doc.file), isPdf: doc.file.type === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf') });
        } else if (doc.existing) {
            // Existing file - fetch from server
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/customer-onboarding/document/${id}/${docType}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch document');

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const isPdf = doc.name.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';

                setDocumentModal({ 
                    isOpen: true, 
                    document: { ...doc, type: blob.type }, 
                    url, 
                    isPdf 
                });
            } catch (err) {
                console.error(err);
                showErrorAlert('Failed to view document');
            }
        }
    };

    const closeDocumentModal = () => {
        if (documentModal.url) {
            URL.revokeObjectURL(documentModal.url);
        }
        setDocumentModal({ isOpen: false, document: null, url: null });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            
            // Prepare FormData for multipart/form-data submission
            const formDataToSubmit = new FormData();
            
            // Add personal details
            formDataToSubmit.append('firstName', formData.firstName);
            formDataToSubmit.append('lastName', formData.lastName);
            formDataToSubmit.append('dateOfBirth', formData.dateOfBirth);
            formDataToSubmit.append('gender', formData.gender);
            formDataToSubmit.append('occupation', formData.occupation);
            formDataToSubmit.append('annualIncome', formData.annualIncome);
            
            // Add contact information
            formDataToSubmit.append('email', formData.email);
            formDataToSubmit.append('phone', formData.phone);
            if (formData.alternatePhone) formDataToSubmit.append('alternatePhone', formData.alternatePhone);
            formDataToSubmit.append('addressLine1', formData.addressLine1);
            if (formData.addressLine2) formDataToSubmit.append('addressLine2', formData.addressLine2);
            formDataToSubmit.append('city', formData.city);
            formDataToSubmit.append('state', formData.state);
            formDataToSubmit.append('zipCode', formData.zipCode);
            formDataToSubmit.append('country', formData.country);
            
            // Nominee Details
            formDataToSubmit.append('addNominee', formData.addNominee);
            if (formData.addNominee) {
                formDataToSubmit.append('nomineeName', formData.nomineeName);
                formDataToSubmit.append('nomineeRelationship', formData.nomineeRelationship);
                formDataToSubmit.append('nomineeDob', formData.nomineeDob);
                formDataToSubmit.append('nomineeContact', formData.nomineeContact);
            }

            // Add documents if new files uploaded
            if (formData.documents.governmentId && !formData.documents.governmentId.existing) {
                formDataToSubmit.append('governmentId', formData.documents.governmentId.file);
            }
            if (formData.documents.proofOfAddress && !formData.documents.proofOfAddress.existing) {
                formDataToSubmit.append('proofOfAddress', formData.documents.proofOfAddress.file);
            }
            if (formData.documents.incomeProof && !formData.documents.incomeProof.existing) {
                formDataToSubmit.append('incomeProof', formData.documents.incomeProof.file);
            }
            if (formData.addNominee && formData.documents.nomineeId && !formData.documents.nomineeId.existing) {
                 formDataToSubmit.append('nomineeId', formData.documents.nomineeId.file);
            }

            // Add Other Documents
            if (formData.otherDocuments && formData.otherDocuments.length > 0) {
                formData.otherDocuments.forEach((doc) => {
                    if (doc.isNew) {
                        formDataToSubmit.append('otherDocuments', doc.file);
                        formDataToSubmit.append('otherDocumentNames', doc.name);
                    }
                });
            }

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/customer-onboarding/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type here, let browser set it with boundary for FormData
                },
                body: formDataToSubmit
            });
            
            if (res.status === 401) {
                showWarningAlert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/');
                return;
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update customer');
            }
            
            await showSuccessAlert('Customer updated successfully!');
            navigate('/admin/customers');
            
        } catch (error) {
            console.error('Error updating customer:', error);
            setIsSubmitting(false);
            showErrorAlert(`Error updating customer: ${error.message}`);
        }
    };

    // Icons
    const CheckIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const UploadIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    if (isLoading) {
        return <Layout><div className="center-screen">Loading customer data...</div></Layout>;
    }

    return (
        <Layout>
            <div className="onboarding-container">
                {/* Header */}
                <div className="onboarding-header">
                    <h1 className="onboarding-title">Edit Customer</h1>
                    <p className="onboarding-subtitle">Update customer information and documents</p>
                </div>

                {/* Stepper */}
                <div className="stepper-container">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="stepper-item">
                                <div className={`stepper-circle ${
                                    currentStep > step.number ? 'completed' : 
                                    currentStep === step.number ? 'active' : 'inactive'
                                }`}>
                                    {currentStep > step.number ? (
                                        <CheckIcon />
                                    ) : (
                                        <span>{step.number}</span>
                                    )}
                                </div>
                                <div className="stepper-content">
                                    <div className="stepper-label">Step {step.number}</div>
                                    <div className="stepper-title">{step.title}</div>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`stepper-line ${
                                    currentStep > step.number ? 'completed' : 'inactive'
                                }`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Content */}
                <div className="form-container">
                    {/* Step 1: Personal Details */}
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h2 className="step-title">Personal Details</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter first name"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter last name"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Occupation</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter occupation"
                                        value={formData.occupation}
                                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Annual Income</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="$0"
                                        value={formData.annualIncome}
                                        onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Information */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h2 className="step-title">Contact Information</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="customer@email.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+1 234-567-8900"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Alternate Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+1 234-567-8900"
                                        value={formData.alternatePhone}
                                        onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Address Line 1</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Street address"
                                        value={formData.addressLine1}
                                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Address Line 2</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Apartment, suite, etc."
                                        value={formData.addressLine2}
                                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ZIP Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="ZIP"
                                        value={formData.zipCode}
                                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                    />
                                </div>

                                {/* Nominee Section */}
                                <div className="form-group form-group-full" style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.addNominee}
                                            onChange={(e) => handleInputChange('addNominee', e.target.checked)}
                                            style={{ width: '1.25rem', height: '1.25rem' }}
                                        />
                                        Add Nominee Details
                                    </label>
                                </div>

                                {formData.addNominee && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Nominee Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Full Name"
                                                value={formData.nomineeName}
                                                onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Relationship</label>
                                            <select
                                                className="form-select"
                                                value={formData.nomineeRelationship}
                                                onChange={(e) => handleInputChange('nomineeRelationship', e.target.value)}
                                            >
                                                <option value="">Select Relationship</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Child">Child</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Sibling">Sibling</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nominee DOB</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.nomineeDob}
                                                onChange={(e) => handleInputChange('nomineeDob', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nominee Contact</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="Phone Number"
                                                value={formData.nomineeContact}
                                                onChange={(e) => handleInputChange('nomineeContact', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: KYC Documents */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 className="step-title" style={{ margin: 0 }}>KYC Documents</h2>
                                <button 
                                    type="button"
                                    onClick={() => setOtherDocsModal({ ...otherDocsModal, isOpen: true })}
                                    style={{ 
                                        backgroundColor: '#3b82f6', color: 'white', border: 'none', 
                                        padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: 500
                                    }}
                                >
                                    + Upload other documents
                                </button>
                            </div>
                            <div className="documents-grid">
                                {['governmentId', 'proofOfAddress', 'incomeProof'].map((docType) => (
                                    <div key={docType} className="document-upload-section">
                                        <div className="upload-area">
                                            <UploadIcon />
                                            <h3 className="upload-title">
                                                {docType === 'governmentId' ? 'Government ID' : 
                                                 docType === 'proofOfAddress' ? 'Proof of Address' : 'Income Proof'}
                                            </h3>
                                            <p className="upload-subtitle">Click to update/replace</p>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleDocumentUpload(docType, e.target.files[0])}
                                                className="file-input"
                                                id={docType}
                                            />
                                            <label htmlFor={docType} className="upload-btn">Select File</label>
                                        </div>
                                        {formData.documents[docType] && (
                                            <div className="uploaded-file">
                                                <span className="file-name">{formData.documents[docType].name}</span>
                                                <span className="file-date">
                                                    {formData.documents[docType].existing ? 'Existing' : 'New Upload'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {formData.addNominee && (
                                    <div className="document-upload-section">
                                        <div className="upload-area">
                                            <UploadIcon />
                                            <h3 className="upload-title">Nominee ID Proof</h3>
                                            <p className="upload-subtitle">Drag and drop or click to upload</p>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleDocumentUpload('nomineeId', e.target.files[0])}
                                                className="file-input"
                                                id="nomineeId"
                                            />
                                            <label htmlFor="nomineeId" className="upload-btn">Select File</label>
                                        </div>
                                        {formData.documents.nomineeId && (
                                            <div className="uploaded-file">
                                                <span className="file-name">{formData.documents.nomineeId.name}</span>
                                                {formData.documents.nomineeId.uploadDate && (
                                                    <span className="file-date">Uploaded: {formData.documents.nomineeId.uploadDate}</span>
                                                )}
                                                {formData.documents.nomineeId.existing && (
                                                    <button 
                                                        className="view-btn"
                                                        onClick={() => {
                                                             window.open(`${import.meta.env.VITE_API_BASE_URL}/customer-onboarding/document/${customerId}/nomineeId`, '_blank');
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Extra Documents List */}
                            {formData.otherDocuments.length > 0 && (
                                <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Additional Documents</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                        {formData.otherDocuments.map((doc, idx) => (
                                            <div key={idx} className="uploaded-file" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginTop: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <span className="file-name" title={doc.name} style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                        {doc.name}
                                                    </span>
                                                    <button 
                                                        className="view-btn"
                                                        style={{ color: '#ef4444', borderColor: '#ef4444', padding: '0.25rem 0.5rem', margin: 0 }}
                                                        onClick={() => {
                                                            const newDocs = [...formData.otherDocuments];
                                                            newDocs.splice(idx, 1);
                                                            setFormData({ ...formData, otherDocuments: newDocs });
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <span className="file-date" style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                                    {doc.existing ? `Existing • ${doc.uploadDate}` : `New • ${doc.uploadDate}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Documents Modal */}
                            {otherDocsModal.isOpen && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                                }}>
                                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '400px' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Upload Document</h3>
                                        
                                        <div className="form-group">
                                            <label className="form-label">Document Name</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                placeholder="e.g. Birth Certificate"
                                                value={otherDocsModal.docName}
                                                onChange={(e) => setOtherDocsModal({ ...otherDocsModal, docName: e.target.value })}
                                            />
                                        </div>

                                        <div className="document-upload-section" style={{ marginTop: '1rem' }}>
                                            <div className="upload-area">
                                                <UploadIcon />
                                                <h3 className="upload-title">Upload File</h3>
                                                <p className="upload-subtitle">Drag and drop or click to upload</p>
                                                <input
                                                    type="file"
                                                    onChange={(e) => setOtherDocsModal({ ...otherDocsModal, file: e.target.files[0] })}
                                                    className="file-input"
                                                    id="otherDoc"
                                                />
                                                <label htmlFor="otherDoc" className="upload-btn">Select File</label>
                                            </div>
                                            {otherDocsModal.file && (
                                                <div className="uploaded-file">
                                                    <span className="file-name">{otherDocsModal.file.name}</span>
                                                    <button 
                                                        onClick={() => setOtherDocsModal({ ...otherDocsModal, file: null })}
                                                        style={{ 
                                                            marginLeft: 'auto', background: 'none', border: 'none', 
                                                            color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' 
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                            <button 
                                                onClick={() => setOtherDocsModal({ isOpen: false, docName: '', file: null })}
                                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (!otherDocsModal.docName || !otherDocsModal.file) return alert('Please fill in detail');
                                                    setFormData({
                                                        ...formData,
                                                        otherDocuments: [...formData.otherDocuments, { 
                                                            name: otherDocsModal.docName, 
                                                            file: otherDocsModal.file, 
                                                            uploadDate: new Date().toLocaleDateString(),
                                                            existing: false,
                                                            isNew: true
                                                        }]
                                                    });
                                                    setOtherDocsModal({ isOpen: false, docName: '', file: null });
                                                }}
                                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                            >
                                                Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Select Policy */}
                    {currentStep === 4 && (
                        <div className="form-step">
                            <h2 className="step-title">Select Policy</h2>
                            <div className="empty-state">
                                <div className="empty-state-icon">📋</div>
                                <h3 className="empty-state-title">No policies available at the moment</h3>
                                <p className="empty-state-description">
                                    Policy selection will be available once policies are configured in the system.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review & Submit */}
                    {currentStep === 5 && (
                        <div className="form-step">
                            <h2 className="step-title">Review & Update</h2>
                            
                            <div className="review-summary">
                                <div className="summary-header">
                                    <CheckIcon />
                                    <span>Ready to update</span>
                                </div>
                                <p className="summary-description">
                                    Please review all the information before updating the customer.
                                </p>
                                <div className="summary-checklist">
                                    <div className="checklist-item">• Personal details verified</div>
                                    <div className="checklist-item">• Contact information provided</div>
                                    <div className="checklist-item">• KYC documents checked</div>
                                </div>
                            </div>

                            <div className="review-sections">
                                {/* Personal Details Review */}
                                <div className="review-section">
                                    <h3 className="review-section-title">Personal Details</h3>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-label">Name:</span>
                                            <span className="review-value">{formData.firstName} {formData.lastName}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Date of Birth:</span>
                                            <span className="review-value">{formData.dateOfBirth}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Gender:</span>
                                            <span className="review-value">{formData.gender}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Occupation:</span>
                                            <span className="review-value">{formData.occupation}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Annual Income:</span>
                                            <span className="review-value">${formData.annualIncome}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information Review */}
                                <div className="review-section">
                                    <h3 className="review-section-title">Contact Information</h3>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-label">Email:</span>
                                            <span className="review-value">{formData.email}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Phone:</span>
                                            <span className="review-value">{formData.phone}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Address:</span>
                                            <span className="review-value">
                                                {formData.addressLine1}
                                                {formData.addressLine2 && `, ${formData.addressLine2}`}
                                                <br />
                                                {formData.city}, {formData.state} {formData.zipCode}
                                                <br />
                                                {formData.country}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Policy Review */}
                                <div className="review-section">
                                    <h3 className="review-section-title">Selected Policy</h3>
                                    <div className="review-item">
                                        <span className="review-value">No policy selected</span>
                                    </div>
                                </div>

                                {/* KYC Documents Review */}
                                <div className="review-section">
                                    <h3 className="review-section-title">KYC Documents</h3>
                                    <div className="documents-review">
                                        {Object.entries(formData.documents).map(([key, doc]) => (
                                            doc && (
                                                <div key={key} className="document-review-item">
                                                    <span className="document-name">{doc.name}</span>
                                                    <span className="file-date" style={{marginLeft: 'auto', fontSize: '0.75rem', marginRight: '1rem'}}>
                                                        {doc.existing ? '(Existing)' : '(New)'}
                                                    </span>
                                                    <button 
                                                        className="view-btn"
                                                        onClick={() => openDocumentModal(doc, key)}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="form-navigation">
                        <button 
                            className="btn-secondary"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            Previous
                        </button>
                        
                        {currentStep < 5 ? (
                            <button 
                                className={`btn-primary ${!canProceedToNext() ? 'disabled' : ''}`}
                                onClick={nextStep}
                                disabled={!canProceedToNext()}
                            >
                                Next Step
                            </button>
                        ) : (
                            <button 
                                className="btn-submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Customer'}
                            </button>
                        )}
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
                                <h3 className="modal-title">{documentModal.document?.name}</h3>
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
                            <div className="modal-footer" style={{marginTop: '1rem', textAlign: 'right'}}>
                                <button className="btn-secondary" onClick={closeDocumentModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EditCustomer;
