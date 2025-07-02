import { useState } from 'react';
import Header from '../components/Header';
import UploadBox from '../components/UploadBox';
import ResultViewer from '../components/ResultViewer';
import DocumentViewer from '../components/DocumentViewer';
import { Database } from 'lucide-react';
import { useHistory } from '@/contexts/HistoryContext'; // ✅ added

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToHistory } = useHistory(); // ✅ added

  const FASTAPI_URL = 'http://127.0.0.1:8000';
  const DOTNET_URL = 'http://localhost:5175';
  const currentUserId = 1;

  const API_BASE_URL =
    typeof process !== 'undefined' && process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL
      : 'http://127.0.0.1:5175';

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

  // const handleAnalyze = async () => {
  //   if (!file) {
  //     alert('Please upload a file first.');
  //     return;
  //   }

  //   setLoading(true);
  //   setResult(null);

  //   const formData = new FormData();
  //   formData.append('file', file);

  //   try {
  //     const response = await fetch(`${FASTAPI_URL}/upload/`, {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Server error: ${response.status} - ${errorText}`);
  //     }

  //     const data = await response.json();

  //     const actualResult = {
  //       filename: file.name,
  //       extractedText: data.content || 'No text extracted',
  //       classification: data.classification || 'Unknown',
  //       confidence: data.confidence || '0.0',
  //       fields: data.fields || {},
  //     };

  //     setResult(actualResult);

  //     // ✅ Add to history
  //     addToHistory({
  //       id: Date.now().toString(),
  //       filename: file.name,
  //       classification: actualResult.classification,
  //       confidence: actualResult.confidence,
  //       extractedText: actualResult.extractedText,
  //       processedAt: new Date(),
  //       fileSize: file.size,
  //     });

  //     alert('Document processed successfully!');
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  //     alert(`Error during analysis: ${errorMessage}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleAnalyze = async () => {
  if (!file) {
    alert("Please upload a file first.");
    return;
  }

  setLoading(true);
  setResult(null);

  // Simulated delay
  setTimeout(() => {
    const classifications = ["devis", "facture", "attestation d'honneur", "contrat_MAR"];
    const randomIndex = Math.floor(Math.random() * classifications.length);
    const randomConfidence = (Math.random() * 0.2 + 0.7).toFixed(2); // from 0.70 to 0.90

    const mockResult = {
      filename: file.name,
      extractedText: `DEVIS : 1493.2025
 Numéro Client : DC-2025-1493
 Date de devis : 02/01/2025
 Adresse des travaux : Idem adresse client
 N° CPLUS/61997
 VAL 31/12/2024
 M. Pascal Blaise
 14 av Paul Vaillant Couturier
 94140 ALFORTVILLE
 Tél : 01-01-01-01-01
 E-mail : abdelhakim.o@pixel-crm.com
 Zone : H1               Précarité : Très modeste
 Type de chauffage : Combustible / Fioul
 Type de logement : Maison individuelle / +15 ans / 100 m²
 Détail
 Qté
 P.U HT P.U TTC TVA
 Total HT
 Total TTC
 BAR-TH-129 : Installation d’une pompe à chaleur air/air- La puissance Thermique Nominale est de 5,30 kW, calculée selon le règlement
 n°206/2012 de la commission du 6 mars 2012.- Le coefficient de Performance Saisonnier est de 4,10, calculé selon le règlement
 n°206/2012 de la commission du 6 mars 2012.- La surface chauffée par la PAC est de 100,00 m2
 Marque : DE DIETRICH
 Référence : POMPE A CHALEUR DE DIETRICH AIR/AIR CLIM'UP MULTISPLIT
 MUSE 50-2- Kwh Cumac : 77 900- Prime CEE : 506,35 €
 Matériel(s) fourni(s) et mis en place par notre société DEMO
 représentée par DEMO DEMO, SIRET 88780650300000, Certificat rge Numéro
 CPLUS/61997 attribué le 01/04/2022 valable jusqu'au 31/12/2024, Assurance civile N°
 TEST
 POMPE A CHALEUR HITACHI
 POMPE A CHALEUR HITACHI
 POMPE A CHALEUR DE DIETRICH AIR/AIR CLIM'UP MULTISPLIT MUSE 50-2
 Caractéristiques techniques : CLIM'UP MULTISPLIT MUSE 50-2
 Unité extérieure :- SEER en mode froid : 7,1- Puissance en froid : 5,3 kW- SCOP en mode chaud : 4,1- Puissance en chaud : 5,6 kW- Tonnes équivalent CO2 : 0,64 T eq CO2- Température extérieur minimum de fonctionnement (en mode chaud) : -15°C- Niveau sonore (pression acoustique) : 55 dB- Nombre d'unité intérieure pouvant être raccordée : 2
 Fonctions- Unité extérieure équipée d'un compresseur ROTARY DC INVERTER
 Dimensions et poids- Hauteur (mm) : 545  - Largeur (mm) : 800  - Profondeur (mm) : 315- Poids à vide (kg) : 36
 Classe énergétique climatiseur : A++ (sur une échelle allant de A++ à E)
 1,00
 947,87 € 1 000,00 € 5,50 %
 1,00 U 2 083,33 € 2 500,00 € 20,00
 %
 S.A.R.L DEMO COMPANY - 20 B VOIE DU MORT RU - 91050 LONGPONT SUR ORGE - au capital de 80 000 € 
RCS D'EVRY SIRET : 152 185 011 000 15 - TVA Intra : FR 33 152 111 011 - Tel : 08 71 34 01 02
 947,87 €
 2 083,33 €
 1 000,00 €
 2 500,00 €
 1/
 2
DEVIS 1493.2025 du 02/01/202`,
      classification: classifications[randomIndex],
      confidence: parseFloat(randomConfidence),
      fields: {
        Numéro_Client : "DC-2025-1493",
        Date_de_devis : "02/01/2025",
        Adresse_des_travaux : "Idem adresse client",
        Adresse :"14 av Paul Vaillant Couturier",
        Tél : "01-01-01-01-01",
        E_mail : "abdelhakim.o@pixel-crm.com",
        Zone : "H1",
        Type_de_chauffage : "Combustible / Fioul",
        Type_de_logement : "Maison individuelle / +15 ans / 100 m²",
        BIC : "AN129NB",
        IBAN : "9383645282018",
        Total_HT :"3031,20€",
        Total_TVA :"468,80€",
        Total_TTC : "3500,00",
        Reste_à_payer : "2993,65"
      },
    };

    setResult(mockResult);
    alert("Document processed successfully!");
    const historyEntry = {
      id: Date.now().toString(),
      filename: file.name,
      classification: mockResult.classification,
      confidence: mockResult.confidence,
      extractedText: mockResult.extractedText,
      processedAt: new Date(),
      fileSize: file.size,
    };

    addToHistory(historyEntry);
    setLoading(false);
  }, 1000);
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

  const handleSaveToDatabase = async () => {
    if (!result) return;

    try {
      const response = await fetch(`${DOTNET_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          documentTypeId: 1,
          originalFilePath: result.filename,
          uploadedAt: new Date().toISOString(),
          extractedData: {
            fields: JSON.stringify(result.fields),
            extractedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save: ${response.status} - ${errorText}`);
      }

      alert('Document saved to database successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving to database: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className={`grid gap-8 ${file ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow document-card">
                <h2 className="text-2xl font-semibold text-blue-900 mb-6">Document Processing</h2>
                <UploadBox onFileUpload={handleFileUpload} />

                {file && (
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
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
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
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
                    <p className="text-sm text-gray-500">Extracting text and classifying...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-8">
                  <ResultViewer result={result} />
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={downloadJSON}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download JSON
                    </button>
                    <button
                      onClick={handleSaveToDatabase}
                      className="inline-flex items-center bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition-colors"
                    >
                      <Database className="h-5 w-5 mr-2" />
                      Save to Database
                    </button>
                  </div>
                </div>
              )}
            </div>

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
