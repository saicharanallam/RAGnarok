import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";

const PDFListCard = forwardRef((props, ref) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPDFs, setTotalPDFs] = useState(0);

  const fetchPDFs = (page = 1) => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: "15" // Reduced for better tabbed view
    });
    
    fetch(`/api/pdfs?${params}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.pdfs && data.pagination) {
          // New pagination format
          setPdfs(data.pdfs);
          setTotalPages(data.pagination.pages);
          setTotalPDFs(data.pagination.total);
          setCurrentPage(data.pagination.page);
        } else {
          // Fallback for old format
          setPdfs(data.pdfs || data);
          setTotalPages(1);
          setTotalPDFs(data.pdfs?.length || data.length || 0);
          setCurrentPage(1);
        }
        setLoading(false);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching PDFs:", error);
        setError(error.message);
        setPdfs([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPDFs();
    
    // Auto-refresh every 8 seconds if there are processing PDFs
    const interval = setInterval(() => {
      if (pdfs.some(pdf => pdf.processing_status === 'processing' || pdf.processing_status === 'pending')) {
        fetchPDFs(currentPage);
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [currentPage]);

  useImperativeHandle(ref, () => ({
    refreshPDFs: () => fetchPDFs(currentPage)
  }));

  // Filter PDFs based on search and status
  const filteredPDFs = pdfs.filter(pdf => {
    const matchesSearch = pdf.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || pdf.processing_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchPDFs(newPage);
    }
  };

  const getStatusIcon = (status, extractionMethod) => {
    switch (status) {
      case 'completed':
        return (
          <span style={{ color: "#4CAF50", fontSize: 12 }}>
            ✓ {extractionMethod === 'text' && '📄'}
            {extractionMethod === 'ocr' && '🔍'}
            {extractionMethod === 'mixed' && '📄🔍'}
          </span>
        );
      case 'processing':
        return <span style={{ color: "#2196F3", fontSize: 12 }}>🔄</span>;
      case 'failed':
        return <span style={{ color: "#F44336", fontSize: 12 }}>❌</span>;
      case 'pending':
        return <span style={{ color: "#FF9800", fontSize: 12 }}>⏳</span>;
      default:
        return <span style={{ color: "#999", fontSize: 12 }}>❓</span>;
    }
  };

  const getStatusText = (status, chunkCount, extractionMethod) => {
    switch (status) {
      case 'completed':
        return `${chunkCount} chunks`;
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
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
      {/* Header with search and filters */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #2A3A4A",
        background: "#0F1A23"
      }}>
        <h3 style={{
          color: "#FFB347",
          margin: "0 0 16px 0",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          📚 Document Library
        </h3>
        
        {/* Search and Filter Bar */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "12px"
        }}>
          <input
            type="text"
            placeholder="Search PDFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #2A3A4A",
              borderRadius: "6px",
              background: "#182635",
              color: "#fff",
              fontSize: "14px"
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #2A3A4A",
              borderRadius: "6px",
              background: "#182635",
              color: "#fff",
              fontSize: "14px",
              minWidth: "100px"
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#8BA0B8"
        }}>
          <span>Total: {totalPDFs} documents</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 20px" }}>
        {error && (
          <div style={{
            color: "#F44336",
            margin: "20px 0",
            padding: "12px",
            background: "#3c1c1c",
            borderRadius: "6px",
            border: "1px solid #F44336"
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => fetchPDFs(currentPage)} 
              style={{
                marginLeft: "12px",
                padding: "6px 12px",
                fontSize: "12px",
                background: "#FFB347",
                color: "#182635",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div style={{
            color: "#FFB347",
            margin: "20px 0",
            textAlign: "center",
            fontSize: "14px"
          }}>
            🔄 Loading documents...
          </div>
        )}

        {!loading && !error && filteredPDFs.length === 0 && (
          <div style={{
            color: "#8BA0B8",
            margin: "40px 0",
            textAlign: "center",
            fontSize: "14px"
          }}>
            {searchTerm || filterStatus !== "all" 
              ? "No documents match your search/filter criteria."
              : "No PDFs uploaded yet. Upload your first document to get started!"
            }
          </div>
        )}

        {!loading && filteredPDFs.length > 0 && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            {/* PDF List */}
            <div style={{ padding: "16px 0" }}>
              {filteredPDFs.map((pdf) => (
                <div
                  key={pdf.id}
                  style={{
                    padding: "16px",
                    margin: "8px 0",
                    background: "#0F1A23",
                    borderRadius: "8px",
                    border: "1px solid #2A3A4A",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px"
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {pdf.filename}
                      </div>
                      <div style={{
                        color: "#8BA0B8",
                        fontSize: "12px"
                      }}>
                        Uploaded: {new Date(pdf.uploaded).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px"
                    }}>
                      {getStatusIcon(pdf.processing_status, pdf.extraction_method)}
                      <span style={{
                        color: pdf.processing_status === 'completed' ? "#4CAF50" : 
                               pdf.processing_status === 'processing' ? "#2196F3" :
                               pdf.processing_status === 'failed' ? "#F44336" : "#FF9800",
                        fontSize: "11px",
                        fontWeight: "500"
                      }}>
                        {getStatusText(pdf.processing_status, pdf.chunk_count, pdf.extraction_method)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Error details for failed PDFs */}
                  {pdf.processing_status === 'failed' && pdf.processing_error && (
                    <div style={{
                      marginTop: "8px",
                      padding: "8px",
                      background: "#3c1c1c",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "#F44336",
                      border: "1px solid #F44336"
                    }}>
                      <strong>Error:</strong> {pdf.processing_error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                padding: "20px 0",
                borderTop: "1px solid #2A3A4A"
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #2A3A4A",
                    background: currentPage <= 1 ? "#1a2a3a" : "#182635",
                    color: currentPage <= 1 ? "#4a5a6a" : "#FFB347",
                    borderRadius: "4px",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                >
                  ← Previous
                </button>
                
                <span style={{ color: "#8BA0B8", fontSize: "12px" }}>
                  {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #2A3A4A",
                    background: currentPage >= totalPages ? "#1a2a3a" : "#182635",
                    color: currentPage >= totalPages ? "#4a5a6a" : "#FFB347",
                    borderRadius: "4px",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PDFListCard;
