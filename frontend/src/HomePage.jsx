import React, { useState } from "react";

export default function HomePage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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
      } else {
        const data = await res.json();
        setUploadStatus(data.error || "Upload failed.");
      }
    } catch (err) {
      setUploadStatus("Upload failed.");
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #ccc" }}>
      <h2>RAGnarok Assistant</h2>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #888",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          marginBottom: 24,
          background: pdfFile ? "#e0ffe0" : "#fafafa",
        }}
      >
        <input
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          id="pdf-upload"
          onChange={handleFileChange}
        />
        <label htmlFor="pdf-upload" style={{ cursor: "pointer" }}>
          <strong>Upload PDF</strong> or drag & drop here
        </label>
        {pdfFile && <div style={{ marginTop: 16 }}>Selected: {pdfFile.name}</div>}
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
            background: "#1976d2",
            color: "#fff",
            fontWeight: "bold",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      )}
      {uploadStatus && (
        <div style={{ marginBottom: 24, color: uploadStatus.includes("success") ? "green" : "red" }}>
          {uploadStatus}
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Ask a question..."
          style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          disabled={!pdfFile}
        />
      </div>
      <div
        style={{
          minHeight: 80,
          background: "#eee",
          color: "#888",
          borderRadius: 4,
          padding: 16,
          textAlign: "center",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      >
        LLM response will appear here (coming soon)
      </div>
    </div>
  );
}