import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
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
                        <SelectItem value="waste-generator">Waste Generator</SelectItem>
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
                    label="GST Certificate *"
                    value={documents.gstCertificate}
                    onChange={(file) => handleDocumentChange('gstCertificate', file)}
                    required
                    description="Upload your company's GST registration certificate"
                  />
                  <FileUpload
                    label="PAN Card *"
                    value={documents.panCard}
                    onChange={(file) => handleDocumentChange('panCard', file)}
                    required
                    description="Upload company or personal PAN card"
                  />
                  <FileUpload
                    label="Bank Document *"
                    value={documents.bankDocument}
                    onChange={(file) => handleDocumentChange('bankDocument', file)}
                    required
                    description="Upload bank statement or cancelled cheque"
                  />
                  <FileUpload
                    label="Authorized Signatory Letter"
                    value={documents.authorizedSignatory}
                    onChange={(file) => handleDocumentChange('authorizedSignatory', file)}
                    description="Upload letter authorizing signatory (if applicable)"
                  />
                  <div className="md:col-span-2">
                    <FileUpload
                      label="Company Registration / License *"
                      value={documents.companyRegistration}
                      onChange={(file) => handleDocumentChange('companyRegistration', file)}
                      required
                      description="Upload company registration certificate or relevant business license"
                    />
                  </div>
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Important:</p>
                <p>Your account will be reviewed by our team. You will receive an email notification once your account is approved and you can start using the platform.</p>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
