import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";

const PDFListCard = forwardRef((props, ref) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const cardWidth = 500;

  const fetchPDFs = () => {
    setLoading(true);
    fetch("/api/pdfs")
      .then((res) => res.json())
      .then((data) => {
        setPdfs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshPDFs: fetchPDFs
  }));

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
        <h3 style={{ color: "#FFB347", margin: 0, marginBottom: 16 }}>
          Uploaded PDFs
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
        transition: "all 0.2s",
      }}
    >
      <h3
        style={{
          color: "#FFB347",
          margin: 0,
          marginBottom: 20,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(false)}
        title="Click to collapse"
      >
        Uploaded PDFs
      </h3>
      <div>
        {loading && (
          <div style={{ color: "#FFB347", marginTop: 16 }}>Loading...</div>
        )}
        {!loading && pdfs.length === 0 && (
          <div style={{ color: "#aaa", marginTop: 16 }}>No PDFs uploaded yet.</div>
        )}
        {!loading && pdfs.length > 0 && (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 400, // optional: ensures table doesn't shrink too much
                marginTop: 12,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      color: "#FFB347",
                      textAlign: "left",
                      paddingBottom: 8,
                      borderBottom: "1px solid #333",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Filename
                  </th>
                  <th
                    style={{
                      color: "#FFB347",
                      textAlign: "left",
                      paddingBottom: 8,
                      borderBottom: "1px solid #333",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      color: "#FFB347",
                      textAlign: "left",
                      paddingBottom: 8,
                      borderBottom: "1px solid #333",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Uploaded
                  </th>
                </tr>
              </thead>
              <tbody>
                {pdfs.map((pdf) => (
                  <tr key={pdf.id}>
                    <td style={{ color: "#fff", padding: "6px 0", whiteSpace: "nowrap" }}>
                      {pdf.filename}
                    </td>
                    <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                      {pdf.processed ? (
                        <span style={{ color: "#4CAF50", fontSize: 13 }}>
                          ✓ Processed ({pdf.chunk_count} chunks)
                        </span>
                      ) : (
                        <span style={{ color: "#FF9800", fontSize: 13 }}>
                          ⚠ Not processed
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        color: "#FFB347",
                        fontSize: 13,
                        padding: "6px 0",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {new Date(pdf.uploaded).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default PDFListCard;
