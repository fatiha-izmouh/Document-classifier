import React, { useState, useRef } from 'react';

interface UploadBoxProps {
  onFileUpload: (file: File) => void;
}

const UploadBox: React.FC<UploadBoxProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setError('Please upload a file in PDF, PNG, JPG, or JPEG format');
      return false;
    }
    
    // 10MB size limit
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should not exceed 10MB');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`dropzone-border p-8 transition-all duration-300 ease-in-out
        ${isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'} 
        ${error ? 'border-red-500 bg-red-50' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        id="file-upload"
      />
      
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">
          {isDragging ? "Drop your file here" : "Upload Document"}
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Drag and drop a PDF, PNG, JPG, or JPEG file here, or click to browse
        </p>
        <button
          type="button"
          onClick={handleButtonClick}
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
        >
          Select File
        </button>
        
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        
        <p className="mt-4 text-xs text-gray-500">
          Supported formats: PDF, PNG, JPG, JPEG (max 10MB)
        </p>
      </div>
    </div>
  );
};

export default UploadBox;