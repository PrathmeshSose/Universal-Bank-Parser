import { useState, useEffect } from "react";
import "../styles/PDFViewer.css";

function PDFViewer({ file }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      return;
    }

    // Create a URL and store it
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    // Cleanup: revoke the URL when the file changes or component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="pdf-container">
      <h3>PDF Preview</h3>

      {!pdfUrl ? (
        <div className="pdf-placeholder">
          <p>No PDF Selected</p>
          <p>Please upload a bank statement.</p>
        </div>
      ) : (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="pdf-frame"
        />
      )}
    </div>
  );
}

export default PDFViewer;