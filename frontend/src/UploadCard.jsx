import React, { useRef, useState } from "react";

export default function UploadCard({ onUploadSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef();

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
      
      const data = await res.json();
      
      if (res.ok) {
        setUploadStatus(`✅ Upload successful! Processing started for "${data.filename}". Check the Documents tab for status updates.`);
        setPdfFile(null);
        if (onUploadSuccess) onUploadSuccess(); // Notify parent to switch tabs
      } else {
        setUploadStatus(`❌ Upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setUploadStatus(`❌ Upload failed: ${err.message || 'Network error'}`);
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  const handleDropzoneClick = () => {
    fileInputRef.current.click();
  };

  const clearStatus = () => {
    setUploadStatus("");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#182635",
        borderRadius: 8,
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 20px 16px 20px",
        borderBottom: "1px solid #2A3A4A",
        background: "#0F1A23"
      }}>
        <h3 style={{
          color: "#FFB347",
          margin: "0 0 8px 0",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          📤 Upload Documents
        </h3>
        <p style={{
          color: "#8BA0B8",
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.4"
        }}>
          Upload PDF documents to analyze with AI. Supports text-based and image-based PDFs.
        </p>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}>
        {/* Drop Zone */}
        <div
          onClick={handleDropzoneClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #FFB347",
            borderRadius: "12px",
            padding: "40px 24px",
            textAlign: "center",
            marginBottom: "24px",
            background: pdfFile ? "#1a2a3a" : "#0F1A23",
            color: pdfFile ? "#FFB347" : "#8BA0B8",
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderColor: pdfFile ? "#FF6600" : "#FFB347",
            position: "relative",
            overflow: "hidden"
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
          
          {/* Upload Icon */}
          <div style={{
            fontSize: "48px",
            marginBottom: "16px",
            opacity: 0.8
          }}>
            📄
          </div>
          
          <div style={{
            fontSize: "16px",
            fontWeight: "600",
            marginBottom: "8px",
            color: pdfFile ? "#FFB347" : "#FFB347"
          }}>
            {pdfFile ? "File Selected!" : "Upload PDF Document"}
          </div>
          
          <div style={{
            fontSize: "14px",
            opacity: 0.8,
            marginBottom: "8px"
          }}>
            {pdfFile ? "Ready to upload" : "Click to browse or drag & drop"}
          </div>
          
          {pdfFile && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              background: "#182635",
              borderRadius: "8px",
              border: "1px solid #2A3A4A",
              color: "#FFB347",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              📎 {pdfFile.name}
              <br />
              <span style={{ fontSize: "11px", opacity: 0.7 }}>
                Size: {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
          
          {/* Drag & Drop Hint */}
          <div style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "11px",
            opacity: 0.5,
            color: "#8BA0B8"
          }}>
            Supports PDF files up to 50MB
          </div>
        </div>

        {/* Upload Button */}
        {pdfFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              padding: "14px 28px",
              borderRadius: "8px",
              border: "none",
              background: uploading 
                ? "linear-gradient(90deg, #666 0%, #888 100%)" 
                : "linear-gradient(90deg, #FFB347 0%, #FF6600 100%)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "16px",
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: uploading 
                ? "0 2px 8px #66644" 
                : "0 4px 16px #FFB34766",
              transition: "all 0.2s ease",
              width: "100%",
              marginBottom: "20px"
            }}
          >
            {uploading ? (
              <span>
                🔄 Uploading... Please wait
              </span>
            ) : (
              <span>
                🚀 Upload & Process Document
              </span>
            )}
          </button>
        )}

        {/* Status Messages */}
        {uploadStatus && (
          <div style={{
            padding: "16px",
            borderRadius: "8px",
            background: uploadStatus.includes("✅") 
              ? "#1a3a1a" 
              : uploadStatus.includes("❌") 
                ? "#3a1a1a" 
                : "#1a2a3a",
            border: "1px solid",
            borderColor: uploadStatus.includes("✅") 
              ? "#4CAF50" 
              : uploadStatus.includes("❌") 
                ? "#F44336" 
                : "#2A3A4A",
            color: uploadStatus.includes("✅") 
              ? "#4CAF50" 
              : uploadStatus.includes("❌") 
                ? "#F44336" 
                : "#FFB347",
            fontSize: "14px",
            lineHeight: "1.4",
            position: "relative"
          }}>
            {uploadStatus}
            <button
              onClick={clearStatus}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "16px",
                opacity: 0.7,
                padding: "4px"
              }}
              title="Clear message"
            >
              ×
            </button>
          </div>
        )}

        {/* Info Section */}
        <div style={{
          marginTop: "auto",
          padding: "16px",
          background: "#0F1A23",
          borderRadius: "8px",
          border: "1px solid #2A3A4A"
        }}>
          <div style={{
            color: "#8BA0B8",
            fontSize: "12px",
            lineHeight: "1.4"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>💡 Tips:</strong>
            </div>
            <div>• Text-based PDFs process faster</div>
            <div>• Image-based PDFs use OCR for text extraction</div>
            <div>• Processing happens in the background</div>
            <div>• Check Documents tab for status updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
