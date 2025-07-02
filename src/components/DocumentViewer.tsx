import React from 'react';
import { FileText, Download } from 'lucide-react';

interface DocumentViewerProps {
  file: File | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ file }) => {
  if (!file) return null;

  const fileUrl = URL.createObjectURL(file);

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-docuBlue-500 to-docuTeal-500 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Document aperçu</h3>
              <p className="text-sm text-white/80">{file.name}</p>
            </div>
          </div>
          <div className="text-xs bg-white/20 px-3 py-1 rounded-full">
            {(file.size / 1024).toFixed(1)} KB
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-200">
          <iframe
            src={fileUrl}
            className="w-full h-[60vh]"
            title="Document Preview"
          >
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Votre navigateur ne supporte pas l'affichage des PDFs.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Télécharger le PDF
              </a>
            </div>
          </iframe>
        </div>
        
        <div className="mt-6 flex justify-center">
          <a
            href={fileUrl}
            download={file.name}
            className="inline-flex items-center space-x-2 bg-docuBlue-500 hover:bg-docuBlue-600 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger l'original</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;