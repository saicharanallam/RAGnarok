import React, { useState, useRef } from "react";
import UploadCard from "./UploadCard";
import PDFListCard from "./PDFListCard";
import LLMInteractCard from "./LLMInteractCard";
import FireBackground from "./FireBackground";
import './styles.css';

export function HomePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pdfListRef = useRef();

    const handlePDFUploaded = () => {
        if (pdfListRef.current) {
            pdfListRef.current.refreshPDFs();
        }
    };

    const sidebarWidth = sidebarOpen ? 560 : 10; // adjust as needed

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
                            transition: "width 0.2s",
                            overflow: "hidden",
                            boxShadow: "2px 0 8px #0002",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            paddingTop: 24,
                            position: "relative"
                        }}
                    >
                        {sidebarOpen && (
                            <div style={{ width: "100%", padding: "0 12px" }}>
                                <UploadCard
                                    onUploadSuccess={handlePDFUploaded}
                                    style={{ marginBottom: 24, width: "100%" }}
                                />
                                <PDFListCard
                                    ref={pdfListRef}
                                    style={{ width: "100%" }}
                                />
                            </div>
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
                                maxWidth: 600,
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