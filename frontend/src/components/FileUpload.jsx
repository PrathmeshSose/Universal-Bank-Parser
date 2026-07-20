import { useState, useEffect } from "react";
import { fetchBanks } from "../services/api";
import "../styles/FileUpload.css";

function FileUpload({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [bankName, setBankName] = useState("HDFC"); // Default to HDFC
  const [uploading, setUploading] = useState(false);
  const [banksList, setBanksList] = useState([]);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banks = await fetchBanks();
        setBanksList(banks);
        if (banks.length > 0) {
          setBankName(banks[0]);
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
        // Fallback if API fails
        setBanksList(["HDFC", "SBI", "ICICI", "Axis Bank"]);
      }
    };
    loadBanks();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a PDF.");
      return;
    }

    setUploading(true);
    try {
      // Pass file, bank name, and optional password back to Home
      await onUpload(selectedFile, bankName, password);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h3>Upload Bank Statement</h3>

      <div className="form-group">
        <label htmlFor="bankSelect">Select Bank Format</label>
        <select 
          id="bankSelect"
          value={bankName} 
          onChange={(e) => setBankName(e.target.value)}
          className="premium-input"
        >
          {banksList.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="pdfPassword">PDF Password (Optional)</label>
        <input 
          type="password" 
          id="pdfPassword"
          placeholder="Leave blank if not protected"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="premium-input"
        />
        <small className="help-text">Many banks use your PAN or DOB as the password.</small>
      </div>

      <div className="file-upload-wrapper">
        <label className="upload-label">
          {selectedFile ? 'Change PDF' : 'Choose PDF'}
          <input
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            id="fileInput"
            style={{ display: "none" }} 
          />
        </label>
      </div>

      {selectedFile && (
        <>
          <p className="filename">📄 {selectedFile.name}</p>

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </>
      )}
    </div>
  );
}

export default FileUpload;