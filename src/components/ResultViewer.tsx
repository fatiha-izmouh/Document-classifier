import React, { useState, useMemo } from 'react';

interface ResultViewerProps {
  result: {
    filename: string;
    extractedText: string;
    classification: string;
    confidence: string; // you can change to string | number if needed
    fields: { [key: string]: string };
  } | null;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState('fields');

  if (!result) return null;

  // Safely parse confidence and format as percentage
  const confidenceNum = parseFloat(result.confidence);
  const confidenceDisplay = !isNaN(confidenceNum)
    ? `${(confidenceNum * 100).toFixed(2)}%`
    : result.confidence;

  // Memoize first lines summary to avoid recalculations on re-renders
  const firstLines = useMemo(() => {
    return result.extractedText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
      .join('\n');
  }, [result.extractedText]);

  // Memoize filtered fields
  const nonEmptyFields = useMemo(() => {
    return result.fields
      ? Object.entries(result.fields).filter(([_, value]) => value)
      : [];
  }, [result.fields]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Results</h3>
        <div className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-600">
          {result.classification}
          {result.confidence !== "N/A" && ` • ${confidenceDisplay}`}
        </div>
      </div>
      
      <div className="border-b border-gray-200 mb-4">
        <div className="flex -mb-px">
          <button 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'fields' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('fields')}
          >
            Extracted Fields
          </button>
          <button 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('text')}
          >
            Full Text
          </button>
          <button 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'metadata' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {activeTab === 'fields' && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            {nonEmptyFields.length > 0 ? (
              <ul className="space-y-2">
                {nonEmptyFields.map(([field, value]) => (
                  <li key={field} className="text-sm text-gray-600">
                    <strong>{field}:</strong> {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No relevant fields extracted.</p>
            )}
          </div>
        )}
        
        {activeTab === 'text' && (
          <>
            <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-600">{result.extractedText}</pre>
            </div>
            {result.extractedText.length > 1000 && (
              <p className="text-xs text-gray-500">
                Showing full content. Download JSON for raw data.
              </p>
            )}
          </>
        )}
        
        {activeTab === 'summary' && (
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium mb-2">Document Preview:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{firstLines || "No content available for summary."}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Document Type</h5>
                <p className="text-sm font-medium">{result.classification}</p>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Word Count</h5>
                <p className="text-sm font-medium">
                  {result.extractedText.split(/\s+/).filter(Boolean).length}
                </p>
              </div>
              {nonEmptyFields.length > 0 && (
                <div className="bg-white p-3 rounded-md border border-gray-200 col-span-2">
                  <h5 className="text-xs font-medium text-gray-500 mb-1">Key Information</h5>
                  <p className="text-sm text-gray-600">
                    {nonEmptyFields.slice(0, 2).map(([field, value]) => `${field}: ${value}`).join(', ')}
                    {nonEmptyFields.length > 2 && '...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Filename</h4>
                <p className="text-sm font-medium truncate">{result.filename}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Document Class</h4>
                <p className="text-sm font-medium">{result.classification}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Confidence Score</h4>
                <p className="text-sm font-medium">{result.confidence}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Processing Date</h4>
                <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultViewer;
