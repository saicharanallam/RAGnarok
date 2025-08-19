import React, { useState, useRef } from "react";
import UploadCard from "./UploadCard";
import PDFListCard from "./PDFListCard";
import LLMInteractCard from "./LLMInteractCard";
import FireBackground from "./FireBackground";
import './styles.css';

export function HomePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'pdfs'
    const pdfListRef = useRef();

    const handlePDFUploaded = () => {
        if (pdfListRef.current) {
            pdfListRef.current.refreshPDFs();
        }
        // Switch to PDFs tab after upload
        setActiveTab('pdfs');
    };

    const sidebarWidth = sidebarOpen ? 480 : 10; // Reduced width for better proportions

    return (
        <>
            <FireBackground />
            <div style={{
                minHeight: "100vh",
                position: "relative",
                zIndex: 1,
                padding: 0,
                margin: 0,
            }}>
                {/* Logo Header */}
                <header
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        background: "transparent",
                        boxShadow: "none",
                        borderBottom: "none",
                        padding: "32px 0 16px 0"
                    }}
                >
                    {/* Collapse/Expand Button with left margin */}
                    <button
                        onClick={() => setSidebarOpen((open) => !open)}
                        style={{
                            marginLeft: 24,
                            marginRight: 24,
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "none",
                            background: "#FFB347",
                            color: "#182635",
                            fontWeight: "bold",
                            fontSize: 24,
                            boxShadow: "0 4px 32px 0 #FFB34766, 0 2px 8px #0004",
                            cursor: "pointer",
                            transition: "background 0.2s"
                        }}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpen ? "⮜" : "⮞"}
                    </button>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "linear-gradient(135deg, #FFB347 60%, #FF6600 100%)",
                            borderRadius: 24,
                            padding: "10px 32px 10px 20px",
                            boxShadow: "0 4px 32px 0 #FFB34766, 0 2px 8px #0004",
                            maxWidth: 420,
                            margin: "0 auto"
                        }}
                    >
                        <img
                            src="/ragnarok_yellow_favicon.ico"
                            alt="RAGnarok Logo"
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: "#101B24",
                                boxShadow: "0 0 24px 8px #FFB34799, 0 2px 8px #0004",
                                marginRight: 18,
                                objectFit: "cover"
                            }}
                        />
                        <span
                            style={{
                                fontSize: 34,
                                fontWeight: 900,
                                color: "transparent",
                                background: "#081826",
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                letterSpacing: 2,
                                textShadow: "none"
                            }}
                        >
                            RAGnarok
                        </span>
                    </div>
                </header>

                {/* Sidebar + Main Content */}
                <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
                    {/* Sidebar */}
                    <div
                        style={{
                            width: sidebarWidth,
                            background: "#182635",
                            transition: "width 0.3s ease",
                            overflow: "hidden",
                            boxShadow: "2px 0 16px #0003",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative"
                        }}
                    >
                        {sidebarOpen && (
                            <>
                                {/* Tab Navigation */}
                                <div style={{
                                    display: "flex",
                                    background: "#0F1A23",
                                    borderBottom: "1px solid #2A3A4A",
                                    marginBottom: 0
                                }}>
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        style={{
                                            flex: 1,
                                            padding: "16px 20px",
                                            background: activeTab === 'upload' ? "#FFB347" : "transparent",
                                            color: activeTab === 'upload' ? "#182635" : "#8BA0B8",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: activeTab === 'upload' ? "600" : "400",
                                            transition: "all 0.2s ease",
                                            borderTopLeftRadius: "8px"
                                        }}
                                    >
                                        📤 Upload
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pdfs')}
                                        style={{
                                            flex: 1,
                                            padding: "16px 20px",
                                            background: activeTab === 'pdfs' ? "#FFB347" : "transparent",
                                            color: activeTab === 'pdfs' ? "#182635" : "#8BA0B8",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: activeTab === 'pdfs' ? "600" : "400",
                                            transition: "all 0.2s ease",
                                            borderTopRightRadius: "8px"
                                        }}
                                    >
                                        📚 Documents ({activeTab === 'pdfs' ? 'Active' : ''})
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div style={{ 
                                    flex: 1, 
                                    overflow: "hidden",
                                    padding: "20px 16px"
                                }}>
                                    {activeTab === 'upload' && (
                                        <div style={{ height: "100%" }}>
                                            <UploadCard
                                                onUploadSuccess={handlePDFUploaded}
                                                style={{ height: "100%" }}
                                            />
                                        </div>
                                    )}
                                    {activeTab === 'pdfs' && (
                                        <div style={{ height: "100%" }}>
                                            <PDFListCard
                                                ref={pdfListRef}
                                                style={{ height: "100%" }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats Bar */}
                                <div style={{
                                    background: "#0F1A23",
                                    borderTop: "1px solid #2A3A4A",
                                    padding: "12px 16px",
                                    fontSize: "12px",
                                    color: "#8BA0B8",
                                    textAlign: "center"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>🔥 RAGnarok v1.0</span>
                                        <span style={{ color: "#FFB347" }}>⚡ Local AI</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Main Content */}
                    <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        padding: "24px 0",
                        minWidth: 0,
                        overflow: "auto"
                    }}>
                        <LLMInteractCard
                            className="card-shadow"
                            style={{
                                maxWidth: 700, // Increased for better chat experience
                                width: "100%",
                                minWidth: 320,
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomePage;
