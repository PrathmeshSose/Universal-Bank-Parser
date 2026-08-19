import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Download,
  AlertTriangle
} from 'lucide-react';

export const DocumentViewer = ({ file, originalPdfUrl }) => {
  const [objectUrl, setObjectUrl] = useState('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let blobUrl = null;

    if (file) {
      blobUrl = URL.createObjectURL(file);
      setObjectUrl(blobUrl);
    } else if (originalPdfUrl) {
      setObjectUrl(originalPdfUrl);
    } else {
      setObjectUrl('');
    }

    // Cleanup: revoke blob URL to prevent memory leak on file change or unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, originalPdfUrl]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="doc-viewer-container glass-card">
      <div className="doc-viewer-toolbar">
        <div className="toolbar-left">
          <FileText size={16} className="text-cyan" />
          <span className="doc-title">{file ? file.name : 'Original Bank Statement'}</span>
        </div>

        <div className="toolbar-controls">
          <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
          <span className="zoom-level">{zoom}%</span>
          <button className="icon-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button className="icon-btn" onClick={handleRotate} title="Rotate">
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      <div className="doc-canvas-area">
        {objectUrl ? (
          <div 
            className="doc-embed-wrap" 
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease'
            }}
          >
            <iframe 
              src={`${objectUrl}#toolbar=0&navpanes=0`} 
              title="Bank Statement Document" 
              className="pdf-iframe"
            />
          </div>
        ) : (
          <div className="doc-placeholder">
            <FileText size={48} className="text-muted" />
            <p>Upload a statement to view side-by-side original document.</p>
          </div>
        )}
      </div>
    </div>
  );
};
