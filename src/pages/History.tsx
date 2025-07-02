import React, { useState } from 'react';
import { useHistory } from '@/contexts/HistoryContext';
import Header from '@/components/Header';
import { History as HistoryIcon, Search, Download, Trash2, FileText, Calendar, Tag } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const History = () => {
  const { history, clearHistory } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const filteredHistory = history.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.classification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadDocument = (doc: any) => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${doc.filename.split(".")[0]}_result.json`;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <HistoryIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-blue-600">Document History</h1>
                  <p className="text-sm text-gray-500">{history.length} processed documents</p>
                </div>
              </div>
              {history.length > 0 && (
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>

            {history.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {history.length === 0 ? 'No documents processed yet' : 'No documents found'}
                </h3>
                <p className="text-gray-500">
                  {history.length === 0 
                    ? 'Process your first document to see it appear here'
                    : 'Try adjusting your search terms'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-xs">
                                {doc.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.fileSize)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Tag className="h-3 w-3 text-teal-600" />
                            <span className="text-sm font-medium text-teal-600">
                              {doc.classification}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {Math.round(doc.confidence * 100)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.processedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => setSelectedDocument(doc)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => downloadDocument(doc)}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {selectedDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedDocument.filename}
                    </h3>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Classification</p>
                      <p className="font-medium">{selectedDocument.classification}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Confidence</p>
                      <p className="font-medium">{Math.round(selectedDocument.confidence * 100)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Processed</p>
                      <p className="font-medium">{formatDate(selectedDocument.processedAt)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Extracted Text</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap text-gray-600">
                        {selectedDocument.extractedText}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;