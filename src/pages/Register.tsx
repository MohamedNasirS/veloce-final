import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import FileUpload from '../components/FileUpload';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
    phone: '',
    address: '',
    registrationNumber: '',
    taxId: '',
    description: ''
  });

  const [documents, setDocuments] = useState({
    gstCertificate: null as File | null,
    panCard: null as File | null,
    bankDocument: null as File | null,
    authorizedSignatory: null as File | null,
    companyRegistration: null as File | null,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check required fields
    if (!formData.name || !formData.email || !formData.password || !formData.company || !formData.role || !formData.phone || !formData.address) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check required documents
    if (!documents.gstCertificate || !documents.panCard || !documents.bankDocument || !documents.companyRegistration) {
      setError('Please upload all required documents');
      setLoading(false);
      return;
    }

    // Check total file size
    let totalSize = 0;
    Object.values(documents).forEach(file => {
      if (file) totalSize += file.size;
    });

    // 19MB limit (slightly under 20MB to be safe)
    const maxTotalSize = 19 * 1024 * 1024;
    if (totalSize > maxTotalSize) {
      setError('Total file size exceeds limit. Please reduce file sizes or compress your documents.');
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword from the data sent to backend
      const { confirmPassword, ...registrationData } = formData;
      
      await register({ 
        ...registrationData, 
        documents 
      });
      
      alert('Registration submitted successfully! Your account is pending approval. You will be notified once approved.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
            <CardDescription>Join the WasteBid platform and start trading</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      placeholder="Confirm password"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                      placeholder="Your Company Ltd."
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste_generator">Waste Generator</SelectItem>
                        <SelectItem value="recycler">Recycler</SelectItem>
                        <SelectItem value="aggregator">Aggregator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      placeholder="Company registration number"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="address">Company Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Enter your company address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Document Verification</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload the following documents for verification. All documents should be clear and legible.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload 
                    label="GST Certificate" 
                    required 
                    maxSizeMB={5}
                    value={documents.gstCertificate} 
                    onChange={(file) => handleDocumentChange('gstCertificate', file)} 
                  />
                  
                  <FileUpload 
                    label="PAN Card" 
                    required 
                    maxSizeMB={5}
                    value={documents.panCard} 
                    onChange={(file) => handleDocumentChange('panCard', file)} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload 
                    label="Bank Document" 
                    required 
                    maxSizeMB={5}
                    value={documents.bankDocument} 
                    onChange={(file) => handleDocumentChange('bankDocument', file)} 
                  />
                  
                  <FileUpload 
                    label="Authorized Signatory" 
                    maxSizeMB={5}
                    value={documents.authorizedSignatory} 
                    onChange={(file) => handleDocumentChange('authorizedSignatory', file)} 
                  />
                </div>
                
                <FileUpload 
                  label="Company Registration" 
                  required 
                  maxSizeMB={5}
                  value={documents.companyRegistration} 
                  onChange={(file) => handleDocumentChange('companyRegistration', file)} 
                />
                
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium text-blue-700">File Upload Guidelines:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Each file must be less than 5MB</li>
                    <li>Total upload size must be less than 19MB</li>
                    <li>Accepted formats: PDF, JPG, PNG</li>
                    <li>For large files, please compress before uploading</li>
                  </ul>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="Tax identification number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your business activities and waste management needs"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
