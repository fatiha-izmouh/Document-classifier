import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProcessedDocument {
  id: string;
  filename: string;
  classification: string;
  confidence: number;
  extractedText: string;
  processedAt: Date;
  fileSize: number;
}

interface HistoryContextType {
  history: ProcessedDocument[];
  addToHistory: (document: ProcessedDocument) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ProcessedDocument[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('docuscribe-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((doc: any) => ({
          ...doc,
          processedAt: new Date(doc.processedAt)
        }));
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Failed to load history from localStorage:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('docuscribe-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (document: ProcessedDocument) => {
    setHistory(prev => [document, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('docuscribe-history');
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};