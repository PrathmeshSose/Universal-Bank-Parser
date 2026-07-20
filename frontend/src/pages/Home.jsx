import { useState } from "react";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import PDFViewer from "../components/PDFViewer";
import DataTable from "../components/DataTable";
import ValidationCard from "../components/ValidationCard";
import Loader from "../components/Loader";
import { uploadPDF, exportToCSV } from "../services/api";
import "../styles/Home.css";

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000); // Auto-hide after 5 seconds
  };

  // Now receives bankName and optional password from FileUpload component
  const handleUpload = async (file, bankName, password) => {
    setSelectedFile(file);
    setLoading(true);
    setMessage(null);

    try {
      const data = await uploadPDF(file, bankName, password);

      const tx = data.transactions || (Array.isArray(data) ? data : []);

      if (tx && tx.length > 0) {
        setTransactions(tx);
        showMessage("PDF Uploaded and Extracted Successfully!");
      } else {
        setTransactions([]);
        showMessage("No transactions found in this document.", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage(`Upload Failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      showMessage("No transactions available to export.", "error");
      return;
    }

    try {
      await exportToCSV(transactions);
      showMessage("CSV Export Downloaded!");
    } catch (error) {
      console.error(error);
      showMessage(`Export Failed: ${error.message}`, "error");
    }
  };

  const handleTransactionChange = (index, field, value) => {
    const updated = [...transactions];
    updated[index][field] = value;
    setTransactions(updated);
  };

  return (
    <>
      <Navbar />

      <div className="home-container">
        {message && (
          <div className={`message-banner ${message.type}`} style={{
            padding: '15px', 
            marginBottom: '20px', 
            borderRadius: '5px',
            background: message.type === 'error' ? '#f8d7da' : '#d4edda',
            color: message.type === 'error' ? '#721c24' : '#155724',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{message.type === 'error' ? '❌ ' : '✅ '}{message.text}</span>
            <button 
              onClick={() => setMessage(null)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        )}

        <h2>Universal Bank Statement Parser</h2>

        <p>
          Upload your bank statement PDF for AI-powered transaction extraction.
        </p>

        {/* Pass handleUpload to FileUpload */}
        <FileUpload onUpload={handleUpload} />

        {loading && <Loader />}

        <div className="content-container">
          <PDFViewer file={selectedFile} />

          <div className="right-panel">
            <DataTable 
              transactions={transactions} 
              onChange={handleTransactionChange} 
            />

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                className="export-btn"
                onClick={handleExport}
                disabled={transactions.length === 0}
              >
                Download Verified CSV
              </button>
            </div>

            <ValidationCard transactions={transactions} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;