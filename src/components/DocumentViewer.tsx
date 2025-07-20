import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Document {
  id: string;
  type: string;
  originalName: string;
  fileName: string;
  relativePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface UserDocuments {
  documents: Document[];
  userFolder: string;
  totalDocuments: number;
}

interface FolderStructure {
  userFolder: string;
  folderPath: string;
  subfolders: string[];
  folderExists: boolean;
}

const DocumentViewer: React.FC = () => {
  const [userDocuments, setUserDocuments] = useState<UserDocuments | null>(null);
  const [folderStructure, setFolderStructure] = useState<FolderStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'folder'>('documents');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch documents and folder structure in parallel
      const [documentsResponse, folderResponse] = await Promise.all([
        fetch(`http://0.0.0.0:3001/api/auth/documents/${user.id}`),
        fetch(`http://0.0.0.0:3001/api/auth/folder/${user.id}`)
      ]);

      const documentsData = await documentsResponse.json();
      const folderData = await folderResponse.json();

      setUserDocuments(documentsData);
      setFolderStructure(folderData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId: string, originalName: string) => {
    try {
      const response = await fetch(`http://0.0.0.0:3001/api/auth/documents/${user.id}/${documentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      gstCertificate: 'GST Certificate',
      panCard: 'PAN Card',
      bankDocument: 'Bank Document',
      authorizedSignatory: 'Authorized Signatory Letter',
      companyRegistration: 'Company Registration'
    };
    return labels[type] || type;
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons = {
      gstCertificate: '📄',
      panCard: '🆔',
      bankDocument: '🏦',
      authorizedSignatory: '✍️',
      companyRegistration: '🏢'
    };
    return icons[type] || '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600 mt-2">Manage and view your uploaded documents</p>
      </div>

      {/* User Folder Info */}
      {folderStructure && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📁</span>
            <div>
              <h3 className="font-semibold text-blue-900">Your Document Folder</h3>
              <p className="text-blue-700 text-sm">
                <strong>Folder Name:</strong> {folderStructure.userFolder}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Status: {folderStructure.folderExists ? '✅ Created' : '❌ Not Found'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents ({userDocuments?.totalDocuments || 0})
          </button>
          <button
            onClick={() => setActiveTab('folder')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'folder'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Folder Structure
          </button>
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          {userDocuments && userDocuments.documents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userDocuments.documents.map((doc) => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">{getDocumentTypeIcon(doc.type)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {getDocumentTypeLabel(doc.type)}
                          </h3>
                          <p className="text-sm text-gray-600 truncate" title={doc.originalName}>
                            {doc.originalName}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Size:</span>
                        <span className="text-gray-900">{formatFileSize(doc.fileSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="text-gray-900">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.relativePath && (
                        <div className="text-xs text-gray-400 truncate" title={doc.relativePath}>
                          Path: {doc.relativePath}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => downloadDocument(doc.id, doc.originalName)}
                      className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <span className="mr-2">⬇️</span>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl">📄</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No documents found</h3>
              <p className="text-gray-500 mt-2">Upload some documents during registration to see them here.</p>
            </div>
          )}
        </div>
      )}

      {/* Folder Structure Tab */}
      {activeTab === 'folder' && folderStructure && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Folder Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Folder Name:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {folderStructure.userFolder}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  folderStructure.folderExists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {folderStructure.folderExists ? 'Exists' : 'Not Found'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Server Path:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-md truncate">
                  {folderStructure.folderPath}
                </span>
              </div>
            </div>
          </div>

          {folderStructure.subfolders.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Document Type Folders</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {folderStructure.subfolders.map((subfolder) => (
                  <div key={subfolder} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl mr-3">📁</span>
                    <div>
                      <p className="font-medium">{getDocumentTypeLabel(subfolder)}</p>
                      <p className="text-sm text-gray-500">{subfolder}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {folderStructure.folderExists && folderStructure.subfolders.length === 0 && (
            <div className="text-center py-8">
              <span className="text-4xl">📂</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Empty Folder</h3>
              <p className="text-gray-500 mt-2">Your document folder exists but contains no subfolders yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;