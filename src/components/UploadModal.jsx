import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { policyApi } from "../lib/api";
import { useI18n } from "../i18n/context";
import "./UploadModal.css";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
function formatSize(bytes) { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

function UploadModal({ onClose, onUploaded }) {
  const { t } = useI18n();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    setError(""); setNotice("");
    const incoming = Array.from(fileList);
    const invalid = incoming.find((file) => !ALLOWED_TYPES.has(file.type));
    if (invalid) { setError(`${invalid.name} ${t("is not a supported policy file.")}`); return; }
    const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) { setError(`${oversized.name} ${t("is larger than 10 MB.")}`); return; }
    setFiles((current) => {
      const room = MAX_FILES - current.length;
      if (incoming.length > room) setError(t("Upload no more than 5 files at once."));
      return [...current, ...incoming.slice(0, Math.max(room, 0))];
    });
  };
  const handleDrop = (event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer.files); };
  const removeFile = (index) => { setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); setError(""); };
  const handleUpload = async () => {
    if (!files.length || submitting) return;
    setSubmitting(true); setError(""); setNotice("");
    try {
      const result = await policyApi.upload(files);
      setNotice(`${result.documents.length} ${t(result.documents.length === 1 ? "policy file uploaded securely." : "policy files uploaded securely.")}`);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.(result.documents);
    } catch (requestError) { setError(requestError.message || t("Unable to upload policy files.")); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="upload-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <div className="upload-modal-card" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <div className="upload-modal-header"><h2 id="upload-modal-title" className="upload-modal-title">{t("Upload Policy")}</h2><button className="upload-modal-close" onClick={onClose} disabled={submitting} aria-label={t("Close upload dialog")}><X size={17} aria-hidden="true" /></button></div>
        <p className="upload-modal-description">{t("Upload a photo or document of a policy — screenshots, PDFs, and files shared through messaging apps all work.")}</p>
        <div className={`upload-dropzone ${isDragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => !submitting && inputRef.current?.click()} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !submitting) inputRef.current?.click(); }} role="button" tabIndex={0} aria-label={t("Choose policy files")}>
          <FileText className="upload-dropzone-icon" size={32} aria-hidden="true" />
          <p className="upload-dropzone-text">{t("Drag and drop files here, or click to browse")}</p>
          <span className="upload-dropzone-hint">{t("JPG, PNG, PDF, DOC, or DOCX · 10 MB each · 5 files maximum")}</span>
          <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" hidden onChange={(event) => addFiles(event.target.files)} />
        </div>
        {files.length > 0 && <div className="upload-file-list">{files.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="upload-file-item"><span className="upload-file-name">{file.name}</span><span className="upload-file-size">{formatSize(file.size)}</span><button type="button" className="upload-file-remove" onClick={() => removeFile(index)} disabled={submitting} aria-label={`${t("Remove")} ${file.name}`}><X size={15} aria-hidden="true" /></button></div>)}</div>}
        {error && <p className="upload-feedback upload-feedback--error" role="alert">{error}</p>}
        {notice && <p className="upload-feedback upload-feedback--success" role="status">{notice}</p>}
        <button type="button" className="upload-submit-button" disabled={files.length === 0 || submitting} onClick={handleUpload}>{submitting ? t("Uploading…") : `${t("Upload")}${files.length > 0 ? ` (${files.length})` : ""}`}</button>
      </div>
    </div>
  );
}
export default UploadModal;