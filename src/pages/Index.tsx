import { useState } from 'react';
import Header from '../components/Header';
import UploadBox from '../components/UploadBox';
import ResultViewer from '../components/ResultViewer';
import DocumentViewer from '../components/DocumentViewer';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Safely access environment variable
  const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : 'http://127.0.0.1:8000';

  const handleFileUpload = (uploadedFile: File) => {
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      alert('Please upload a file in PDF, PNG, JPG, or JPEG format.');
      return;
    }

    console.log('Uploaded file:', uploadedFile.name);
    setFile(uploadedFile);
    setResult(null);
    alert(`${uploadedFile.name} is ready for processing.`);
  };

  const handleAnalyze = async () => {
    if (!file) {
      console.log('No file selected');
      alert('Please upload a file first.');
      return;
    }

    console.log('Processing file:', file.name);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      console.log('fields from backend:', data.fields);

      const actualResult = {
        filename: file.name,
        extractedText: data.content || 'No text extracted',
        classification: data.classification || 'Unknown',
        confidence: data.confidence || '0.0',
        fields: data.fields || {} // Include extracted fields
//rendering
      };

      console.log('Setting result:', actualResult);
      setResult(actualResult);
      alert('Document processed successfully!');
    } catch (error: unknown) {
      console.error('Error during analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`An error occurred: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    alert('File cleared.');
  };

  const downloadJSON = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${result.filename.split('.')[0]}_result.json`;
    link.click();

    alert(`Saved results for ${result.filename}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className={`grid gap-8 ${file ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Left Column - Main Content */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow document-card">
                <h2 className="text-2xl font-semibold text-blue-900 mb-6">
                  Document Processing
                </h2>
                <UploadBox onFileUpload={handleFileUpload} />

                {file && (
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleClearFile}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow transition"
                      >
                        Clear File
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={loading || !file}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded shadow transition"
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              ></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Analyze Document'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="bg-white rounded-2xl shadow flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-blue-700">Processing Document</p>
                    <p className="text-sm text-gray-500">
                      Extracting text and classifying...
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-8">
                  <ResultViewer result={result} />
                  <div className="flex justify-end">
                    <button
                      onClick={downloadJSON}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 inline-block"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download JSON
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Document Viewer */}
            {file && !loading && (
              <div className="lg:sticky lg:top-8 lg:self-start">
                <DocumentViewer file={file} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;