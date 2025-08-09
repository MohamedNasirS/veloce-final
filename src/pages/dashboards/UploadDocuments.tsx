import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import FileUpload from '../../components/FileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';

interface DocumentStatus {
    gstCertificate: boolean;
    panCard: boolean;
    bankDocument: boolean;
    authorizedSignatory: boolean;
    companyRegistration: boolean;
}

const UploadDocuments = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [documents, setDocuments] = useState({
        gstCertificate: null as File | null,
        panCard: null as File | null,
        bankDocument: null as File | null,
        authorizedSignatory: null as File | null,
        companyRegistration: null as File | null,
    });

    const [existingDocuments, setExistingDocuments] = useState<DocumentStatus>({
        gstCertificate: false,
        panCard: false,
        bankDocument: false,
        authorizedSignatory: false,
        companyRegistration: false,
    });

    const [loading, setLoading] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);

    // Fetch existing document status
    useEffect(() => {
        const fetchDocumentStatus = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/documents/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const docs = data.documents;

                    setExistingDocuments({
                        gstCertificate: !!docs.gstCertificatePath,
                        panCard: !!docs.panCardPath,
                        bankDocument: !!docs.bankDocumentPath,
                        authorizedSignatory: !!docs.authorizedSignatoryPath,
                        companyRegistration: !!docs.companyRegistrationPath,
                    });
                }
            } catch (error) {
                console.error('Error fetching document status:', error);
            } finally {
                setFetchingStatus(false);
            }
        };

        fetchDocumentStatus();
    }, [user?.id]);

    const handleDocumentChange = (field: keyof typeof documents, file: File | null) => {
        setDocuments(prev => ({ ...prev, [field]: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Check if at least one document is selected for upload
        const hasDocuments = Object.values(documents).some(doc => doc !== null);
        if (!hasDocuments) {
            toast({
                title: "No Documents Selected",
                description: "Please select at least one document to upload.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();

            // Add user data
            formData.append('name', user?.name || '');
            formData.append('email', user?.email || '');
            formData.append('company', user?.company || '');
            formData.append('role', user?.role || '');
            formData.append('phone', user?.phone || '');
            formData.append('address', user?.address || '');
            formData.append('registrationNumber', user?.registrationNumber || '');
            formData.append('taxId', user?.taxId || '');
            formData.append('description', user?.description || '');

            // Add only the documents that are selected
            Object.entries(documents).forEach(([key, file]) => {
                if (file) {
                    formData.append(key, file);
                }
            });

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update-documents`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload documents');
            }

            // Update existing documents status
            Object.entries(documents).forEach(([key, file]) => {
                if (file) {
                    setExistingDocuments(prev => ({ ...prev, [key]: true }));
                }
            });

            // Clear the form
            setDocuments({
                gstCertificate: null,
                panCard: null,
                bankDocument: null,
                authorizedSignatory: null,
                companyRegistration: null,
            });

            toast({
                title: "Documents Updated Successfully",
                description: "Your documents have been uploaded and are pending verification.",
            });

        } catch (error) {
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : 'Failed to upload documents',
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getDocumentLabel = (type: string) => {
        const labels = {
            gstCertificate: 'GST Certificate',
            panCard: 'PAN Card',
            bankDocument: 'Bank Document',
            authorizedSignatory: 'Authorized Signatory Letter',
            companyRegistration: 'Company Registration'
        };
        return labels[type] || type;
    };

    const getDocumentDescription = (type: string) => {
        const descriptions = {
            gstCertificate: 'Upload your company\'s GST registration certificate',
            panCard: 'Upload company or personal PAN card',
            bankDocument: 'Upload bank statement or cancelled cheque',
            authorizedSignatory: 'Upload letter authorizing signatory (optional)',
            companyRegistration: 'Upload company registration certificate or business license'
        };
        return descriptions[type] || '';
    };

    const isRequired = (type: string) => {
        return type !== 'authorizedSignatory';
    };

    if (fetchingStatus) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading document status...</span>
            </div>
        );
    }

    const totalDocuments = Object.values(existingDocuments).filter(Boolean).length;
    const requiredDocuments = Object.entries(existingDocuments)
        .filter(([key]) => isRequired(key))
        .filter(([, exists]) => exists).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
                    <p className="text-gray-600 mt-2">Update your identity verification documents</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{totalDocuments}/5</div>
                    <div className="text-sm text-gray-500">Documents Uploaded</div>
                </div>
            </div>

            {/* Status Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Document Status Overview
                    </CardTitle>
                    <CardDescription>
                        Current status of your uploaded documents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(existingDocuments).map(([key, exists]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    {exists ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                    <span className="text-sm font-medium">{getDocumentLabel(key)}</span>
                                    {isRequired(key) && <span className="text-red-500 text-xs">*</span>}
                                </div>
                                <Badge variant={exists ? "default" : "secondary"}>
                                    {exists ? "Uploaded" : "Missing"}
                                </Badge>
                            </div>
                        ))}
                    </div>

                    {requiredDocuments < 4 && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You have {4 - requiredDocuments} required document(s) missing.
                                Please upload all required documents for account verification.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload New Documents
                    </CardTitle>
                    <CardDescription>
                        Select and upload documents to update your verification status.
                        Only select the documents you want to replace or add.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(documents).map(([key, file]) => (
                                <div key={key} className="space-y-2">
                                    <FileUpload
                                        label={`${getDocumentLabel(key)} ${isRequired(key) ? '*' : ''}`}
                                        value={file}
                                        onChange={(file) => handleDocumentChange(key as keyof typeof documents, file)}
                                        description={getDocumentDescription(key)}
                                    />
                                    {existingDocuments[key] && (
                                        <div className="flex items-center gap-1 text-xs text-green-600">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Current document exists - uploading will replace it</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                            <p className="font-medium">Important Notes:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Only upload documents you want to update or replace</li>
                                <li>All documents should be clear and legible</li>
                                <li>Supported formats: PDF, JPG, PNG (max 5MB each)</li>
                                <li>Your account status may change to "Pending" during re-verification</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={loading} className="flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Upload Documents
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UploadDocuments;