
import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { X, Upload, FileText, Image } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  value,
  onChange,
  required = false,
  description
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (validTypes.includes(file.type)) {
        onChange(file);
      } else {
        alert('Please select a valid file format (PDF, JPG, PNG)');
      }
    } else {
      onChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getFileIcon = () => {
    if (!value) return <Upload className="w-8 h-8 text-gray-400" />;
    
    if (value.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    
    if (value.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <div
        className={`border-2 border-dashed rounded-md p-4 transition-colors cursor-pointer ${
          dragOver 
            ? 'border-green-400 bg-green-50' 
            : value 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />
        
        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon()}
              <div>
                <p className="font-medium text-sm">{value.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFileSelect(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
