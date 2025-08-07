import React, { useRef, useState } from "react";

export default function UploadCard({ onUploadSuccess }) {
  const [expanded, setExpanded] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef();

  const cardWidth = 500; // Fixed width for both states

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
    setUploadStatus("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPdfFile(e.dataTransfer.files[0]);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) return;
    setUploading(true);
    setUploadStatus("");
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadStatus("Upload successful!");
        setPdfFile(null);
        if (onUploadSuccess) onUploadSuccess(); // <--- notify parent
      } else {
        const data = await res.json();
        setUploadStatus(data.error || "Upload failed.");
      }
    } catch (err) {
      setUploadStatus("Upload failed.");
    }
    setUploading(false);
  };

  const handleDropzoneClick = () => {
    fileInputRef.current.click();
  };

  // Collapsed view
  if (!expanded) {
    return (
      <div
        style={{
          width: cardWidth,
          margin: "24px auto",
          borderRadius: 12,
          background: "#182635",
          boxShadow: "0 2px 16px #0008",
          padding: 24,
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "center",
        }}
        onClick={() => setExpanded(true)}
      >
        <h3 style={{ color: "#FFB347", margin: 0 }}>
          Upload PDF
        </h3>
        <div style={{ color: "#FF6600", marginTop: 8, fontSize: 14 }}>
          Click to expand
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      style={{
        width: cardWidth,
        margin: "24px auto",
        borderRadius: 12,
        background: "#182635",
        boxShadow: "0 2px 16px #0008",
        padding: 24,
        cursor: "default",
        transition: "all 0.2s"
      }}
    >
      <h3
        style={{ color: "#FFB347", margin: 0, marginBottom: 20, cursor: "pointer" }}
        onClick={() => setExpanded(false)}
        title="Click to collapse"
      >
        Upload PDF
      </h3>
      <div>
        <div
          onClick={handleDropzoneClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #FFB347",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
            marginBottom: 24,
            marginTop: 20,
            background: pdfFile ? "#fff3e0" : "#222c3a",
            color: "#FF6600",
            cursor: "pointer"
          }}
        >
          <input
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            id="pdf-upload"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <strong>Upload PDF</strong> or drag & drop here
          {pdfFile && <div style={{ marginTop: 16, color: "#222" }}>Selected: {pdfFile.name}</div>}
        </div>
        {pdfFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              marginBottom: 24,
              padding: "10px 24px",
              borderRadius: 4,
              border: "none",
              background: "linear-gradient(90deg, #FFB347 0%, #FF6600 100%)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px #FFB34744",
              transition: "background 0.2s",
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        )}
        {uploadStatus && (
          <div style={{ marginBottom: 24, color: uploadStatus.includes("success") ? "#FF6600" : "red" }}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}