import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertOctagon, Sparkles, FileText, CheckCircle2, X } from 'lucide-react';

export const FileUpload = ({ onFileUpload, isProcessing, selectedBank, setSelectedBank, onLoadSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0); // Prevents flickering when hovering over child elements

  const validateAndProcessFile = useCallback((file) => {
    setErrorMessage('');

    // Validate file size: 5MB max
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed is ${MAX_SIZE_MB}MB.`
      );
      return;
    }

    // Validate file type
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
      setErrorMessage(
        `Unsupported format: .${extension}. Only PDF, PNG, JPG, or JPEG files are accepted.`
      );
      return;
    }

    setUploadedFile(file);
    onFileUpload(file);
  }, [onFileUpload]);

  // ─── Drag Handlers ────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Must call preventDefault to allow drop
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  }, [validateAndProcessFile]);

  // ─── Click to Browse ──────────────────────────────────────────────────────
  const handleBrowseClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-700" />
            Upload Bank Statement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            PDF or image (PNG / JPG) up to 5 MB. Files are processed in RAM only — never stored.
          </p>
        </div>

        {/* Parsing Format */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-medium">Parsing Format:</span>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-md px-3 py-1.5 font-medium focus:ring-2 focus:ring-purple-600 outline-none cursor-pointer"
          >
            <option value="generic_auto">📄 Generic Bank Statement</option>
            <option value="format_tabular">📊 Tabular Format (Columns)</option>
            <option value="format_receipt">🧾 Scanned Receipt / Image</option>
            <option value="format_pdf_text">📑 PDF with Selectable Text</option>
            <option value="auto_detect">⚡ Auto-Detect Format (AI)</option>
          </select>
        </div>
      </div>

      {/* ─── Drag & Drop Zone ─────────────────────────────────────────────── */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
          isDragging
            ? 'border-purple-500 bg-purple-100/70 scale-[1.01] shadow-inner'
            : uploadedFile
            ? 'border-emerald-400 bg-emerald-50/60'
            : 'border-purple-200 bg-gradient-to-b from-purple-50/30 to-slate-50/50 hover:border-purple-400 hover:bg-purple-50/40'
        }`}
        style={{ minHeight: '160px' }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {isProcessing ? (
          /* Processing State */
          <div className="flex flex-col items-center justify-center py-10 gap-3 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shadow-inner">
              <div className="w-6 h-6 border-[3px] border-purple-700 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-purple-900">AI Extraction in progress...</p>
              <p className="text-xs text-slate-500 mt-1">Processing {uploadedFile?.name}</p>
            </div>
          </div>
        ) : uploadedFile ? (
          /* File Uploaded Success State */
          <div className="flex items-center justify-between p-5 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">{uploadedFile.name}</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(1)} KB — Loaded successfully. AI data extracted below.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="pointer-events-auto text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 transition"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Default Drop Zone State */
          <div className="flex flex-col items-center justify-center py-10 gap-3 pointer-events-none">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner transition-colors ${isDragging ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-700'}`}>
              {isDragging ? (
                <FileText className="w-7 h-7 animate-bounce" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {isDragging ? 'Release to upload your statement!' : 'Drag and drop your Bank Statement here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Accepts PDF, PNG, JPG up to 5 MB
              </p>
            </div>

            {/* Browse Button — pointer-events re-enabled */}
            <button
              onClick={handleBrowseClick}
              className="pointer-events-auto mt-1 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg transition shadow-md"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Validation Error */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 animate-shake">
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Upload Error: </strong> {errorMessage}
          </div>
        </div>
      )}

      <div className="pt-1 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>No PDF? Test with built-in demo data (contains intentional math errors to demonstrate validation):</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setUploadedFile(null); onLoadSample('sample1'); }}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold rounded-lg border border-purple-200 transition"
            title="Loads 6 demo transactions (₹) with 2 red math errors to test inline editing"
          >
            🧪 Demo: 6 Transactions with Math Errors (₹)
          </button>
          <button
            onClick={() => { setUploadedFile(null); onLoadSample('sample2'); }}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold rounded-lg border border-emerald-200 transition"
            title="Loads 4 clean demo transactions with no errors"
          >
            ✅ Demo: 4 Clean Verified Transactions (₹)
          </button>
        </div>
      </div>
    </div>
  );
};
