import { useState, useRef } from "react";
import "./UploadModal.css";

function UploadModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      name: f.name,
      size: (f.size / 1024).toFixed(0) + " KB",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-card">
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Upload Policy</h2>
          <button className="upload-modal-close" onClick={onClose}>×</button>
        </div>

        <p className="upload-modal-description">
          Upload a photo or document of a policy — screenshots, PDFs, or
          files shared via WhatsApp all work.
        </p>

        <div
          className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <div className="upload-dropzone-icon">📄</div>
          <p className="upload-dropzone-text">
            Drag and drop files here, or click to browse
          </p>
          <span className="upload-dropzone-hint">
            Supports JPG, PNG, PDF, DOCX
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="upload-file-list">
            {files.map((file, i) => (
              <div key={i} className="upload-file-item">
                <span className="upload-file-name">{file.name}</span>
                <span className="upload-file-size">{file.size}</span>
                <button
                  className="upload-file-remove"
                  onClick={() => removeFile(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="upload-submit-button"
          disabled={files.length === 0}
          onClick={() => {
            alert(`${files.length} file(s) would be uploaded (demo only)`);
            onClose();
          }}
        >
          Upload {files.length > 0 ? `(${files.length})` : ""}
        </button>
      </div>
    </div>
  );
}

export default UploadModal;