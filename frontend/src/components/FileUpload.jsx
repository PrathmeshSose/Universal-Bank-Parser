import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Lock, 
  AlertCircle, 
  Building2, 
  Loader2, 
  FileCheck,
  Shield,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { BANK_CATEGORIES } from '../utils/bankList.js';
import { uploadBankStatementApi, getAuthToken } from '../services/api.js';

export const FileUpload = ({ 
  onUploadSuccess, 
  activeBank, 
  onSelectBank,
  customBankName,
  setCustomBankName,
  onRequireAuth 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [clientName, setClientName] = useState('');
  const [statementPeriod, setStatementPeriod] = useState('');
  
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Only PDF statement files are supported (text or scanned).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB limit. Please upload a smaller statement.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a bank statement PDF file.');
      return;
    }

    if (activeBank === 'Other' && (!customBankName || !customBankName.trim())) {
      setErrorMsg('Please enter the name of the bank.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      if (onRequireAuth) {
        onRequireAuth();
        return;
      }
    }

    setIsUploading(true);
    setErrorMsg('');
    setUploadStage('Streaming document into server RAM...');

    try {
      setTimeout(() => setUploadStage('Executing OCR text detection...'), 900);
      setTimeout(() => setUploadStage('Parsing financial transactions with AI...'), 2600);

      // Call API per Section 5.3 spec
      const finalBankName = activeBank === 'Other' ? `${customBankName.trim()} (Other)` : activeBank;
      const response = await uploadBankStatementApi(selectedFile, finalBankName, pdfPassword, clientName, statementPeriod);

      setUploadStage('Extraction Complete!');
      setTimeout(() => {
        setIsUploading(false);
        if (onUploadSuccess) {
          onUploadSuccess(response, selectedFile);
        }
      }, 500);

    } catch (err) {
      setIsUploading(false);
      setErrorMsg(err.message || 'Failed to extract statement data.');
    }
  };

  return (
    <div className="upload-container animate-fade">
      <div className="upload-card glass-card">
        <div className="upload-header">
          <div className="upload-title-wrap">
            <Building2 size={24} className="text-cyan" />
            <div>
              <h3>Statement Ingestion Hub</h3>
              <p>Upload a customer's bank statement PDF for AI extraction & balance audit.</p>
            </div>
          </div>

          <div className="bank-config-badge">
            <label>Target Bank:</label>
            <select 
              value={activeBank} 
              onChange={(e) => onSelectBank(e.target.value)}
              className="bank-select-input"
            >
              {BANK_CATEGORIES.map((cat) => (
                <optgroup key={cat.label} label={cat.label}>
                  {cat.banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          
          {activeBank === 'Other' && (
            <input 
              type="text" 
              className="bank-select-input"
              placeholder="Enter Custom Bank Name" 
              value={customBankName || ''}
              onChange={(e) => setCustomBankName(e.target.value)}
              style={{ marginTop: '8px', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}
            />
          )}
        </div>
        </div>

        {/* Client Details Row — Banking Context */}
        <div className="client-details-row">
          <div className="client-field">
            <label className="client-label">👤 Account Holder Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar / ABC Pvt Ltd"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="client-field">
            <label className="client-label">📅 Statement Period</label>
            <input
              type="month"
              value={statementPeriod}
              onChange={(e) => setStatementPeriod(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Dropzone */}
        <div 
          className={`dropzone ${dragOver ? 'dragover' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf"
            style={{ display: 'none' }} 
          />

          {selectedFile ? (
            <div className="selected-file-preview">
              <div className="file-icon-box">
                <FileCheck size={36} className="text-cyan" />
              </div>
              <div className="file-info-text">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-meta">
                  {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="dropzone-empty">
              <div className="drop-icon-circle">
                <UploadCloud size={32} className="text-accent" />
              </div>
              <h4>Drag & drop bank statement PDF here</h4>
              <p>or click to browse your local device (Max 10MB)</p>
              <div className="supported-tags">
                <span className="tag">15+ Indian Banks</span>
                <span className="tag">Scanned OCR Support</span>
                <span className="tag">Password-Protected</span>
              </div>
            </div>
          )}
        </div>

        {/* Optional PDF Password Field */}
        <div className="upload-options-row">
          <div className="password-input-group">
            <Lock size={16} className="input-icon" />
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="PDF Password (if password protected)"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              className="form-input"
            />
            <button 
              type="button" 
              className="icon-btn pass-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="zero-storage-note">
            <Shield size={14} className="text-cyan" />
            <span>Zero-Disk RAM Ingestion Policy</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Extraction Progress or Submit Button */}
        {isUploading ? (
          <div className="upload-progress-card">
            <div className="spinner-row">
              <Loader2 size={24} className="animate-spin text-cyan" />
              <span className="progress-stage-text">{uploadStage}</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill"></div>
            </div>
          </div>
        ) : (
          <div className="upload-submit-row">
            <button 
              className="btn btn-primary btn-lg submit-parse-btn"
              disabled={!selectedFile || isUploading}
              onClick={handleSubmit}
            >
              <FileText size={18} />
              <span>Extract Bank Statement with AI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
