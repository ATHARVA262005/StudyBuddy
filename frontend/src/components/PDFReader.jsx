import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

export const PDFReader = ({ onTextExtracted }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRange, setPageRange] = useState({ start: 1, end: 1 });
  const [topic, setTopic] = useState('');
  const [hasExtractedText, setHasExtractedText] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [tesseractWorker, setTesseractWorker] = useState(null);
  const workerInitialized = useRef(false);

  useEffect(() => {
    // Check if PDF.js is already loaded
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
    } else {
      // Set up a listener to detect when PDF.js is loaded
      const checkPdfJs = setInterval(() => {
        if (window.pdfjsLib) {
          setPdfJsLoaded(true);
          clearInterval(checkPdfJs);
        }
      }, 100);
      
      // Clean up the interval
      return () => clearInterval(checkPdfJs);
    }
  }, []);

  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker({
          logger: progress => console.log('Tesseract loading:', progress),
          errorHandler: err => console.error('Tesseract error:', err)
        });
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessedit_ocr_engine_mode: 3,
          preserve_interword_spaces: '1'
        });
        setTesseractWorker(worker);
        workerInitialized.current = true;
      } catch (err) {
        console.error('Failed to initialize Tesseract worker:', err);
        setError('OCR initialization failed. Some features might not work properly.');
      }
    };

    if (!workerInitialized.current) {
      initWorker();
    }

    return () => {
      if (tesseractWorker) {
        tesseractWorker.terminate();
      }
    };
  }, []);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        setPageCount(pdf.numPages);
        setPageRange({ start: 1, end: Math.min(5, pdf.numPages) });
      } catch (err) {
        setError('Error reading PDF: ' + err.message);
      }
    }
  };

  const extractTextFromPage = async (pdf, pageNum) => {
    try {
      const page = await pdf.getPage(pageNum);
      let extractedText = '';

      // 1. Get text content with all possible options enabled
      const textContent = await page.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
        includeMarkedContent: true
      });

      // Sort text items by their vertical position first, then horizontal
      const sortedItems = textContent.items.sort((a, b) => {
        const yDiff = Math.abs(b.transform[5] - a.transform[5]);
        if (yDiff < 5) { // If items are roughly on the same line
          return a.transform[4] - b.transform[4]; // Sort by x position
        }
        return b.transform[5] - a.transform[5]; // Sort by y position
      });

      // Extract text preserving layout
      let currentY = null;
      let lineTexts = [];
      let currentLine = [];

      sortedItems.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (currentY === null) {
          currentY = y;
        }

        if (Math.abs(y - currentY) > 5) { // New line detected
          if (currentLine.length > 0) {
            lineTexts.push(currentLine.join(' '));
            currentLine = [];
          }
          currentY = y;
        }
        currentLine.push(item.str);
      });

      if (currentLine.length > 0) {
        lineTexts.push(currentLine.join(' '));
      }

      // Combine lines with proper spacing
      const standardText = lineTexts.join('\n');

      // 2. Try OCR if text seems incomplete
      if (standardText.split(/\s+/).length < 50 && tesseractWorker && workerInitialized.current) {
        try {
          const scale = 2.0; // Higher resolution for better OCR
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Use white background and high-quality rendering
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          await page.render({
            canvasContext: context,
            viewport,
            background: 'white',
            intent: 'print'
          }).promise;

          // Configure OCR for maximum accuracy
          await tesseractWorker.setParameters({
            tessedit_ocr_engine_mode: 3, // Use both LSTM and Legacy
            preserve_interword_spaces: '1',
            textord_heavy_nr: 1,
            tessedit_pageseg_mode: 1,
            textord_min_linesize: 3,
            tessedit_prefer_joined_punct: '0',
            tessedit_write_images: true,
            tessedit_create_pdf: '1'
          });

          const { data } = await tesseractWorker.recognize(canvas);
          
          // Combine OCR result with standard text
          const combinedText = combineAndCleanTexts([standardText, data.text]);
          extractedText = combinedText;

          // Cleanup
          canvas.width = 0;
          canvas.height = 0;
        } catch (ocrError) {
          console.error(`OCR attempt failed for page ${pageNum}:`, ocrError);
          extractedText = standardText; // Fallback to standard text
        }
      } else {
        extractedText = standardText;
      }

      return extractedText || `[No text could be extracted from page ${pageNum}]`;
    } catch (error) {
      console.error(`Error processing page ${pageNum}:`, error);
      return `[Error extracting text from page ${pageNum}]`;
    }
  };

  const combineAndCleanTexts = (textArray) => {
    // Join all text content first
    const fullText = textArray
      .filter(Boolean)
      .join('\n')
      .replace(/\s+/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Remove duplicate lines while preserving order
    const lines = fullText.split('\n');
    const uniqueLines = Array.from(new Set(lines));

    return uniqueLines.join('\n');
  };

  const extractTextFromPDF = async (file, range) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    const textParts = [];

    for (let i = range.start; i <= range.end; i++) {
      const text = await extractTextFromPage(pdf, i);
      if (text.trim()) {
        textParts.push(`\n=== Page ${i} ===\n\n${text}\n`);
      }
    }

    const extractedText = textParts.join('\n');
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the selected pages');
    }

    return extractedText;
  };

  const handleExtractText = async () => {
    if (!file || !topic.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file, pageRange);
      onTextExtracted(text, topic);
      setHasExtractedText(true);
    } catch (err) {
      setError('Error processing PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePages = async () => {
    if (!file || !topic.trim()) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file, pageRange);
      onTextExtracted(text, topic); // This will update the TextExtractor component
      setHasExtractedText(true);
    } catch (err) {
      setError('Error processing PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pdfJsLoaded) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center">
        <p className="text-gray-300">Loading PDF reader components...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
      <div className="bg-gradient-to-r from-gray-800 to-indigo-900 px-4 py-5 sm:px-6 border-b border-gray-700">
        <h2 className="text-xl font-medium text-gray-100">Upload PDF Document</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-300">Select a PDF file to extract and analyze</p>
      </div>
      
      <div className="px-4 py-5 sm:p-6 bg-gray-900">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic Name
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter the topic name for better analysis"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-400"
              required
            />
          </div>

          {!file ? (
            <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-xl hover:border-indigo-500 transition-all duration-300 bg-gray-800/50">
              <div className="space-y-4 text-center">
                <div className="mx-auto h-20 w-20 text-indigo-400 relative">
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-xl"></div>
                  <svg 
                    className="relative h-full w-full" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none"
                    >
                      <span className="inline-flex items-center px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload a file
                      </span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept=".pdf" 
                        onChange={handleFileChange}
                      />
                    </label>
                    <span className="text-gray-500">No file chosen</span>
                  </div>
                  
                  <p className="text-gray-400">or drag and drop</p>
                  
                  <div className="text-center space-y-1">
                    <p className="text-sm text-indigo-400">PDF up to 50MB recommended</p>
                    <p className="text-xs text-gray-500">Larger files may impact browser performance</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300">
                    Current file: <span className="text-indigo-400">{file.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Change PDF
                </button>
              </div>

              {pageCount > 0 && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Pages (Total: {pageCount})
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      max={pageCount}
                      value={pageRange.start}
                      onChange={(e) => setPageRange({ ...pageRange, start: parseInt(e.target.value) || 1 })}
                      className="block w-20 rounded-md bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min={pageRange.start}
                      max={pageCount}
                      value={pageRange.end}
                      onChange={(e) => setPageRange({ ...pageRange, end: parseInt(e.target.value) || pageRange.start })}
                      className="block w-20 rounded-md bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {hasExtractedText && (
                      <button
                        onClick={handleUpdatePages}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Updating...
                          </span>
                        ) : (
                          'Update Pages'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {file && !hasExtractedText && (
            <div>
              <button
                type="button"
                onClick={handleExtractText}
                disabled={!file || !topic.trim() || isProcessing || error}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                  ${!file || !topic.trim() || isProcessing || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
                `}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Extract Text & Generate Guide'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
