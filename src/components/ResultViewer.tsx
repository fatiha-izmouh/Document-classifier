
import React, { useState } from 'react';

interface ResultViewerProps {
  result: {
    filename: string;
    extractedText: string;
    classification: string;
    confidence: string | number;
  } | null;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState('text');
  
  if (!result) return null;
  
  // Truncate long text for display
  const displayText = result.extractedText.length > 1000 
    ? result.extractedText.substring(0, 997) + '...'
    : result.extractedText;
  
  // Get first few lines for summary
  const firstLines = result.extractedText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 3)
    .join('\n');
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Results</h3>
        <div className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-600">
          {result.classification}
          {result.confidence !== "N/A" && ` • ${typeof result.confidence === 'number' ? Math.round(result.confidence * 100) : result.confidence}%`}
        </div>
      </div>
      
      <div className="border-b border-gray-200 mb-4">
        <div className="flex -mb-px">
          <button 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('text')}
          >
            Text Content
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
        {activeTab === 'text' && (
          <>
            <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-600">{displayText}</pre>
            </div>
            {result.extractedText.length > 1000 && (
              <p className="text-xs text-gray-500">
                Showing first 1000 characters. Download JSON for full content.
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
