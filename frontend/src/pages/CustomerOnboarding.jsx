import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../utils/swalUtils';

const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const CustomerOnboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documentModal, setDocumentModal] = useState({ isOpen: false, document: null });
    const [errors, setErrors] = useState({}); // Validation errors
    const [policies, setPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
    const [loadingPolicies, setLoadingPolicies] = useState(false);
    const [selectedPolicyDetails, setSelectedPolicyDetails] = useState(null);

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
        
        // Step 3: KYC Documents
        documents: {
            governmentId: null,
            proofOfAddress: null,
            incomeProof: null
        },
        
        // Step 4: Policy Selection (empty for now)
        selectedPolicy: null
    });

    const steps = [
        { number: 1, title: 'Personal Details', key: 'personal' },
        { number: 2, title: 'Contact Information', key: 'contact' },
        { number: 3, title: 'KYC Documents', key: 'kyc' },
        { number: 4, title: 'Select Policy', key: 'policy' },
        { number: 5, title: 'Review & Submit', key: 'review' }
    ];

    React.useEffect(() => {
        if (currentStep === 4) {
            fetchPoliciesAndTypes();
        }
    }, [currentStep]);

    const fetchPoliciesAndTypes = async () => {
        setLoadingPolicies(true);
        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            
            // Fetch Policies
            const policiesRes = await fetch(`${API_BASE_URL}/policies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const policiesData = await policiesRes.json();
            
            // Fetch Policy Types
            const typesRes = await fetch(`${API_BASE_URL}/admin/policy-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const typesData = await typesRes.json();

            if (policiesRes.ok && typesRes.ok) {
                setPolicies(policiesData.data.filter(p => p.status === 'active'));
                setPolicyTypes(typesData.data.filter(t => t.status === 'active'));
            } else {
                showErrorAlert('Failed to load policy data');
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            showErrorAlert("Failed to fetch policy data");
        } finally {
            setLoadingPolicies(false);
        }
    };


    // Validation functions
    const validateStep1 = () => {
        return formData.firstName.trim() && 
               formData.lastName.trim() && 
               formData.dateOfBirth && 
               formData.occupation.trim() && 
               formData.annualIncome;
    };

    const validateStep2 = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phone = formData.phone.replace(/\D/g, ''); // Remove non-digits for validation
        
        return formData.email.trim() && 
               emailRegex.test(formData.email) &&
               !errors.email && // Ensure no active email error
               formData.phone.trim() && 
               phone.length === 10 && // Stricter 10-digit check
               !errors.phone && // Ensure no active phone error
               formData.addressLine1.trim() && 
               formData.city.trim() && 
               formData.state.trim() && 
               formData.zipCode.trim() && 
               formData.country.trim();
    };

    const validateStep3 = () => {
        return formData.documents.governmentId && 
               formData.documents.proofOfAddress && 
               formData.documents.incomeProof;
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return !!formData.selectedPolicy; // Policy step is no longer optional
            default: return false;
        }
    };

    const validateField = (field, value) => {
        let error = '';
        if (field === 'phone') {
             if (value.length !== 10) error = 'Mobile number must be exactly 10 digits';
             if (!/^\d*$/.test(value)) error = 'Mobile number must contain only digits';
        } else if (field === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = 'Invalid email format';
            }
        }
        return error;
    };

    const handleInputChange = (field, value) => {
        if (field === 'phone') {
             if (!/^\d*$/.test(value)) return;
             if (value.length > 10) return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
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
            size: file.size
        };
        
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [documentType]: documentData
            }
        }));
    };

    const handlePolicySelect = (policy) => {
        setFormData(prev => ({ ...prev, selectedPolicy: policy._id }));
        setSelectedPolicyDetails(policy);
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

    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            // Prepare form data for multipart/form-data submission
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
            if (formData.alternatePhone) {
                formDataToSubmit.append('alternatePhone', formData.alternatePhone);
            }
            formDataToSubmit.append('addressLine1', formData.addressLine1);
            if (formData.addressLine2) {
                formDataToSubmit.append('addressLine2', formData.addressLine2);
            }
            formDataToSubmit.append('city', formData.city);
            formDataToSubmit.append('state', formData.state);
            formDataToSubmit.append('zipCode', formData.zipCode);
            formDataToSubmit.append('country', formData.country);
            
            // Add KYC documents
            if (formData.documents.governmentId) {
                formDataToSubmit.append('governmentId', formData.documents.governmentId.file);
            }
            if (formData.documents.proofOfAddress) {
                formDataToSubmit.append('proofOfAddress', formData.documents.proofOfAddress.file);
            }
            if (formData.documents.incomeProof) {
                formDataToSubmit.append('incomeProof', formData.documents.incomeProof.file);
            }
            
            // Add selected policy if any
            if (formData.selectedPolicy) {
                formDataToSubmit.append('selectedPolicy', formData.selectedPolicy);
            }
            
            console.log('Submitting onboarding data...');
            
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            
            const response = await fetch(`${API_BASE_URL}/customer-onboarding/onboard`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSubmit
            });
            
            const result = await response.json();
            
            if (response.status === 401) {
                showWarningAlert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/');
                return;
            }

            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit onboarding');
            }
            
            await showSuccessAlert('Customer onboarding submitted successfully! Welcome email sent to customer.');
            navigate('/admin/customers');
            
        } catch (error) {
            console.error('Error submitting onboarding:', error);
            setIsSubmitting(false);
            showErrorAlert(`Error submitting onboarding: ${error.message}`);
        }
    };

    const openDocumentModal = (document) => {
        setDocumentModal({ isOpen: true, document });
    };

    const closeDocumentModal = () => {
        setDocumentModal({ isOpen: false, document: null });
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

    return (
        <Layout>
            <div className="onboarding-container">
                {/* Header */}
                <div className="onboarding-header">
                    <h1 className="onboarding-title">Customer Onboarding</h1>
                    <p className="onboarding-subtitle">Complete the step-by-step process to onboard a new customer</p>
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
                                    {errors.email && <span style={{color: 'red', fontSize: '0.875rem'}}>{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="1234567890"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                    {errors.phone && <span style={{color: 'red', fontSize: '0.875rem'}}>{errors.phone}</span>}
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
                            </div>
                        </div>
                    )}

                    {/* Step 3: KYC Documents */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <h2 className="step-title">KYC Documents</h2>
                            <div className="documents-grid">
                                {/* Government ID */}
                                <div className="document-upload-section">
                                    <div className="upload-area">
                                        <UploadIcon />
                                        <h3 className="upload-title">Government ID (Passport/Driver License)</h3>
                                        <p className="upload-subtitle">Drag and drop or click to upload</p>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('governmentId', e.target.files[0])}
                                            className="file-input"
                                            id="governmentId"
                                        />
                                        <label htmlFor="governmentId" className="upload-btn">Select File</label>
                                    </div>
                                    {formData.documents.governmentId && (
                                        <div className="uploaded-file">
                                            <span className="file-name">{formData.documents.governmentId.name}</span>
                                            <span className="file-date">Uploaded: {formData.documents.governmentId.uploadDate}</span>
                                            <button 
                                                className="view-btn"
                                                onClick={() => openDocumentModal(formData.documents.governmentId)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Proof of Address */}
                                <div className="document-upload-section">
                                    <div className="upload-area">
                                        <UploadIcon />
                                        <h3 className="upload-title">Proof of Address</h3>
                                        <p className="upload-subtitle">Drag and drop or click to upload</p>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('proofOfAddress', e.target.files[0])}
                                            className="file-input"
                                            id="proofOfAddress"
                                        />
                                        <label htmlFor="proofOfAddress" className="upload-btn">Select File</label>
                                    </div>
                                    {formData.documents.proofOfAddress && (
                                        <div className="uploaded-file">
                                            <span className="file-name">{formData.documents.proofOfAddress.name}</span>
                                            <span className="file-date">Uploaded: {formData.documents.proofOfAddress.uploadDate}</span>
                                            <button 
                                                className="view-btn"
                                                onClick={() => openDocumentModal(formData.documents.proofOfAddress)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Income Proof */}
                                <div className="document-upload-section">
                                    <div className="upload-area">
                                        <UploadIcon />
                                        <h3 className="upload-title">Income Proof</h3>
                                        <p className="upload-subtitle">Drag and drop or click to upload</p>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleDocumentUpload('incomeProof', e.target.files[0])}
                                            className="file-input"
                                            id="incomeProof"
                                        />
                                        <label htmlFor="incomeProof" className="upload-btn">Select File</label>
                                    </div>
                                    {formData.documents.incomeProof && (
                                        <div className="uploaded-file">
                                            <span className="file-name">{formData.documents.incomeProof.name}</span>
                                            <span className="file-date">Uploaded: {formData.documents.incomeProof.uploadDate}</span>
                                            <button 
                                                className="view-btn"
                                                onClick={() => openDocumentModal(formData.documents.incomeProof)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Select Policy */}
                    {currentStep === 4 && (
                        <div className="form-step">
                            <h2 className="step-title">Select Policy</h2>

                            {/* Policy Type Filter */}
                            <div className="policy-type-filter" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Filter by Policy Type <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select 
                                    className="form-select"
                                    value={selectedTypeFilter}
                                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                                >
                                    <option value="">-- Select Policy Type --</option>
                                    {policyTypes.map(type => (
                                        <option key={type._id} value={type._id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            {loadingPolicies ? (
                                <div className="text-center p-8">Loading policies...</div>
                            ) : !selectedTypeFilter ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>🔍</div>
                                    <h3 className="empty-state-title">Please select a policy type</h3>
                                    <p className="empty-state-description">
                                        Choose a policy type from the dropdown above to view available plans.
                                    </p>
                                </div>
                                ) : (
                                    (() => {
                                        const filteredByType = policies.filter(p => p.policyType?._id === selectedTypeFilter);
                                        const customerAge = calculateAge(formData.dateOfBirth);
                                        const eligiblePolicies = filteredByType.filter(p => customerAge >= (p.minAge || 0) && customerAge <= (p.maxAge || 100));

                                        if (filteredByType.length === 0) {
                                            return (
                                                <div className="empty-state">
                                                    <div className="empty-state-icon">📋</div>
                                                    <h3 className="empty-state-title">No policies found</h3>
                                                    <p className="empty-state-description">
                                                        There are no active policies available for the selected type.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        if (eligiblePolicies.length === 0) {
                                            return (
                                                <div className="empty-state">
                                                    <div className="empty-state-icon" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>⚠️</div>
                                                    <h3 className="empty-state-title">No eligible policies</h3>
                                                    <p className="empty-state-description">
                                                        No available policies match the customer's age criteria (Age: {customerAge} years). 
                                                        Please check the Date of Birth or select a different policy type.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="policies-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                                {filteredByType.map(policy => {
                                                    const isSelected = formData.selectedPolicy === policy._id;
                                                    const isThirdParty = policy.policySource === 'THIRD_PARTY';
                                                    const isEligible = customerAge >= (policy.minAge || 0) && customerAge <= (policy.maxAge || 100);
                                        
                                        return (
                                            <div 
                                                key={policy._id}
                                                onClick={() => isEligible && handlePolicySelect(policy)}
                                                title={!isEligible ? `Not eligible. Required Age: ${policy.minAge} - ${policy.maxAge} years` : ''}
                                                style={{
                                                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    padding: '0',
                                                    cursor: isEligible ? 'pointer' : 'not-allowed',
                                                    backgroundColor: isSelected ? '#eff6ff' : isEligible ? 'white' : '#f8f8f8',
                                                    opacity: isEligible ? 1 : 0.6,
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isSelected ? '0 10px 15px -3px rgba(37, 99, 235, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                {/* Header Section */}
                                                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
                                                    {/* Badge */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            padding: '0.25rem 0.75rem', 
                                                            borderRadius: '9999px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 600,
                                                            backgroundColor: isThirdParty ? '#fff7ed' : '#f0fdf4',
                                                            color: isThirdParty ? '#c2410c' : '#15803d',
                                                            border: `1px solid ${isThirdParty ? '#fdba74' : '#86efac'}`,
                                                            marginBottom: '0.75rem'
                                                        }}>
                                                            {isThirdParty ? 'Third-Party' : 'In-House'}
                                                        </div>
                                                        
                                                        {/* Ineligible Badge */}
                                                        {!isEligible && (
                                                            <div style={{
                                                                fontSize: '0.7rem',
                                                                color: '#ef4444',
                                                                fontWeight: 600,
                                                                backgroundColor: '#fef2f2',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #fecaca'
                                                            }}>
                                                                Age mismatch ({policy.minAge}-{policy.maxAge} yrs)
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Selection Checkmark */}
                                                    {isSelected && (
                                                        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#2563eb' }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', paddingRight: '2rem' }}>
                                                        {policy.policyName}
                                                    </h3>
                                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                        {policy.policyType?.name} • {policy.planName}
                                                    </div>
                                                    
                                                    {isThirdParty && policy.provider && (
                                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />
                                                            </svg>
                                                            <span style={{ fontWeight: 500 }}>{policy.provider.name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Middle Section - Premium */}
                                                <div style={{ padding: '1.25rem', backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.03)' : 'transparent' }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                                                            ${policy.premiumAmount?.toLocaleString()}
                                                        </span>
                                                        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                                                            / {policy.tenureValue} {policy.tenureUnit}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Bottom Section - Details */}
                                                <div style={{ padding: '1.25rem', paddingTop: '0', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                                        <span style={{ color: '#64748b' }}>Coverage Limit</span>
                                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>${policy.coverageAmount?.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                                        <span style={{ color: '#64748b' }}>Policy Duration</span>
                                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{policy.tenureValue} {policy.tenureUnit}</span>
                                                    </div>
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                                        <span style={{ color: '#64748b' }}>Min Age</span>
                                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{policy.minAge} Years</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()
                    )}
                </div>
            )}
                    {/* Step 5: Review & Submit */}
                    {currentStep === 5 && (
                        <div className="form-step">
                            <h2 className="step-title">Review & Submit</h2>
                            
                            <div className="review-summary">
                                <div className="summary-header">
                                    <CheckIcon />
                                    <span>All information has been collected</span>
                                </div>
                                <p className="summary-description">
                                    Please review all the information before submitting the onboarding request.
                                </p>
                                <div className="summary-checklist">
                                    <div className="checklist-item">• Personal details verified</div>
                                    <div className="checklist-item">• Contact information provided</div>
                                    <div className="checklist-item">• KYC documents uploaded</div>
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
                                    {selectedPolicyDetails ? (
                                        <div className="review-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedPolicyDetails.policyName}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                Premium: <span style={{ fontWeight: 600 }}>${selectedPolicyDetails.premiumAmount}</span> • 
                                                Coverage: <span style={{ fontWeight: 600 }}>${selectedPolicyDetails.coverageAmount}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="review-item">
                                            <span className="review-value" style={{ color: '#ef4444' }}>No policy selected</span>
                                        </div>
                                    )}
                                </div>

                                {/* KYC Documents Review */}
                                <div className="review-section">
                                    <h3 className="review-section-title">KYC Documents</h3>
                                    <div className="documents-review">
                                        {Object.entries(formData.documents).map(([key, doc]) => (
                                            doc && (
                                                <div key={key} className="document-review-item">
                                                    <span className="document-name">{doc.name}</span>
                                                    <button 
                                                        className="view-btn"
                                                        onClick={() => openDocumentModal(doc)}
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
                    <div className="form-navigation" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        {currentStep < 5 && !canProceedToNext() && (
                            <div className="validation-warning" style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                * All fields are required to proceed
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
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
                                {isSubmitting ? 'Submitting...' : 'Submit Onboarding'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Modal */}
                {documentModal.isOpen && documentModal.document && (
                    <div className="modal-overlay" onClick={closeDocumentModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{documentModal.document.name}</h3>
                                <button className="modal-close" onClick={closeDocumentModal}>×</button>
                            </div>
                            <div className="modal-body">
                                {documentModal.document.type.startsWith('image/') ? (
                                    <img 
                                        src={URL.createObjectURL(documentModal.document.file)} 
                                        alt={documentModal.document.name}
                                        className="document-preview"
                                    />
                                ) : (
                                    <div className="pdf-preview">
                                        <p>PDF Document: {documentModal.document.name}</p>
                                        <p>Use browser's PDF viewer to view this document</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
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

export default CustomerOnboarding;