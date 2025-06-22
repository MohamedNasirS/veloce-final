import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Document {
  id: string;
  type: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const DocumentViewer: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/documents/${user.id}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId: string, originalName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/documents/${user.id}/${documentId}`);
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

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Documents</h2>
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="border p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{getDocumentTypeLabel(doc.type)}</h3>
                <p className="text-gray-600">{doc.originalName}</p>
                <p className="text-sm text-gray-500">
                  Size: {formatFileSize(doc.fileSize)} | 
                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => downloadDocument(doc.id, doc.originalName)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Download
              </button>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-gray-500">No documents found.</p>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;