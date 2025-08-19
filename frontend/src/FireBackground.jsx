import React from "react";

export default function FireBackground() {
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden"
        }}>
            <svg
                width="100vw"
                height="100vh"
                viewBox="0 0 800 700"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: "absolute", left: 0, top: 0, width: "100vw", height: "100vh" }}>
                
                <defs>
                    {/* Enhanced fire glow with multiple gradients */}
                    <radialGradient id="fireGlow" cx="50%" cy="90%" r="90%" fx="50%" fy="90%">
                        <stop offset="0%" stopColor="#FFB347" stopOpacity="0.9">
                            <animate attributeName="stop-color" values="#FFB347;#FF6600;#FFB347" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="40%" stopColor="#FF6600" stopOpacity="0.7">
                            <animate attributeName="stop-color" values="#FF6600;#FF3300;#FF6600" dur="3.5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="70%" stopColor="#FF3300" stopOpacity="0.4">
                            <animate attributeName="stop-color" values="#FF3300;#CC2200;#FF3300" dur="5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#101B24" stopOpacity="0" />
                    </radialGradient>

                    {/* Secondary glow for depth */}
                    <radialGradient id="fireGlowSecondary" cx="50%" cy="85%" r="70%" fx="50%" fy="85%">
                        <stop offset="0%" stopColor="#FFD580" stopOpacity="0.3">
                            <animate attributeName="stop-color" values="#FFD580;#FFB347;#FFD580" dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
                    </radialGradient>

                    {/* Ember glow */}
                    <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#FFB347" stopOpacity="0" />
                    </radialGradient>

                    <style>{`
                        .flame {
                            animation: flicker 2.5s infinite ease-in-out alternate;
                            transform-origin: bottom center;
                        }
                        
                        .flame:nth-child(2n) {
                            animation-delay: 0.2s;
                            animation-duration: 2.1s;
                            transform: scaleX(0.92);
                        }
                        
                        .flame:nth-child(3n) {
                            animation-delay: 0.4s;
                            animation-duration: 2.8s;
                            transform: scaleX(1.08);
                        }
                        
                        .flame:nth-child(4n) {
                            animation-delay: 0.6s;
                            animation-duration: 2.3s;
                            transform: scaleX(0.96);
                        }
                        
                        .flame:nth-child(5n) {
                            animation-delay: 0.8s;
                            animation-duration: 2.6s;
                            transform: scaleX(1.04);
                        }
                        
                        @keyframes flicker {
                            0%   { transform: scaleY(1) translateY(0px) scaleX(1); opacity: 0.85; }
                            25%  { transform: scaleY(1.05) translateY(-4px) scaleX(0.98); opacity: 0.95; }
                            50%  { transform: scaleY(1.15) translateY(-8px) scaleX(1.02); opacity: 1; }
                            75%  { transform: scaleY(1.08) translateY(-6px) scaleX(0.99); opacity: 0.9; }
                            100% { transform: scaleY(1) translateY(0px) scaleX(1); opacity: 0.8; }
                        }

                        .spark {
                            animation: rise 4s infinite ease-out;
                            fill: #FFD580;
                            opacity: 0.8;
                        }
                        
                        .spark:nth-child(3n) {
                            animation-delay: 1.2s;
                            fill: #FFB347;
                            animation-duration: 3.5s;
                        }
                        
                        .spark:nth-child(4n) {
                            animation-delay: 2.1s;
                            fill: #FFF;
                            animation-duration: 4.2s;
                        }
                        
                        .spark:nth-child(5n) {
                            animation-delay: 0.8s;
                            fill: #FF6600;
                            animation-duration: 3.8s;
                        }
                        
                        @keyframes rise {
                            0% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.9; }
                            25% { transform: translateY(-50px) scale(1.1) rotate(45deg); opacity: 1; }
                            50% { transform: translateY(-100px) scale(0.9) rotate(90deg); opacity: 0.8; }
                            75% { transform: translateY(-150px) scale(0.7) rotate(135deg); opacity: 0.6; }
                            100% { transform: translateY(-250px) scale(0.4) rotate(180deg); opacity: 0; }
                        }

                        .ember {
                            animation: emberFloat 6s infinite ease-in-out;
                            opacity: 0.7;
                        }
                        
                        .ember:nth-child(2n) {
                            animation-delay: 2s;
                            animation-duration: 7s;
                        }
                        
                        .ember:nth-child(3n) {
                            animation-delay: 4s;
                            animation-duration: 5s;
                        }
                        
                        @keyframes emberFloat {
                            0% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.7; }
                            33% { transform: translateY(-20px) translateX(10px) scale(1.2); opacity: 0.9; }
                            66% { transform: translateY(-40px) translateX(-5px) scale(0.8); opacity: 0.6; }
                            100% { transform: translateY(-60px) translateX(15px) scale(0.6); opacity: 0.3; }
                        }

                        .smoke {
                            animation: smokeRise 8s infinite ease-out;
                            opacity: 0.3;
                        }
                        
                        .smoke:nth-child(2n) {
                            animation-delay: 3s;
                            animation-duration: 10s;
                        }
                        
                        @keyframes smokeRise {
                            0% { transform: translateY(0px) translateX(0px) scale(0.5); opacity: 0.3; }
                            50% { transform: translateY(-100px) translateX(20px) scale(1.5); opacity: 0.2; }
                            100% { transform: translateY(-200px) translateX(-30px) scale(2); opacity: 0; }
                        }
                    `}</style>
                </defs>

                {/* Base fire glow layers */}
                <ellipse cx="400" cy="650" rx="400" ry="80" fill="url(#fireGlow)" />
                <ellipse cx="400" cy="650" rx="300" ry="60" fill="url(#fireGlowSecondary)" />
                
                {/* Smoke wisps for atmosphere */}
                <path className="smoke" d="M350 650 Q380 600 360 550 Q390 500 370 450 Q400 400 350 350" stroke="#666" strokeWidth="3" fill="none" />
                <path className="smoke" d="M450 650 Q420 600 440 550 Q410 500 430 450 Q400 400 450 350" stroke="#666" strokeWidth="2" fill="none" />
                <path className="smoke" d="M380 650 Q410 600 390 550 Q420 500 400 450 Q430 400 380 350" stroke="#666" strokeWidth="2.5" fill="none" />

                {/* Center tall flames */}
                <path className="flame" d="M400 650 Q420 500 395 480 Q425 520 430 450 Q440 500 450 420 Q435 480 470 450 Q445 520 480 480 Q455 580 420 520 Q400 650 400 650 Z" fill="#FF6600" fillOpacity="0.9" />
                <path className="flame" d="M380 650 Q400 520 375 500 Q405 540 410 470 Q420 520 430 440 Q415 500 450 470 Q425 540 460 500 Q435 560 400 500 Q380 650 380 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M420 650 Q440 510 415 490 Q445 530 450 460 Q460 510 470 430 Q455 490 490 460 Q465 530 500 490 Q475 550 440 490 Q420 650 420 650 Z" fill="#FF6600" fillOpacity="0.85" />

                {/* Left side flames - varying heights and shapes */}
                <path className="flame" d="M100 650 Q120 580 95 560 Q125 600 130 520 Q140 580 160 500 Q145 600 180 570 Q155 620 200 580 Q175 650 100 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M150 650 Q170 600 145 580 Q175 620 180 540 Q190 600 210 520 Q195 620 230 590 Q205 640 250 600 Q225 650 150 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M200 650 Q220 590 195 570 Q225 610 230 530 Q240 590 260 510 Q245 610 280 580 Q255 630 300 590 Q275 650 200 650 Z" fill="#FF6600" fillOpacity="0.75" />
                <path className="flame" d="M250 650 Q270 600 245 580 Q275 620 280 540 Q290 600 310 520 Q295 620 330 590 Q305 640 350 600 Q325 650 250 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M300 650 Q320 580 295 560 Q325 600 330 520 Q340 580 360 500 Q345 600 380 570 Q355 620 400 580 Q375 650 300 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M350 650 Q370 590 345 570 Q375 610 380 530 Q390 590 410 510 Q395 610 430 580 Q405 630 450 590 Q425 650 350 650 Z" fill="#FFB347" fillOpacity="0.75" />

                {/* Right side flames - mirroring left but with variations */}
                <path className="flame" d="M700 650 Q680 580 705 560 Q675 600 670 520 Q660 580 640 500 Q655 600 620 570 Q645 620 600 580 Q625 650 700 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M650 650 Q630 600 655 580 Q625 620 620 540 Q610 600 590 520 Q605 620 570 590 Q595 640 550 600 Q575 650 650 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M600 650 Q580 590 605 570 Q575 610 570 530 Q560 590 540 510 Q555 610 520 580 Q545 630 500 590 Q525 650 600 650 Z" fill="#FF6600" fillOpacity="0.75" />
                <path className="flame" d="M550 650 Q530 600 555 580 Q525 620 520 540 Q510 600 490 520 Q505 620 470 590 Q495 640 450 600 Q475 650 550 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M500 650 Q480 580 505 560 Q475 600 470 520 Q460 580 440 500 Q465 600 420 570 Q445 620 400 580 Q425 650 500 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M450 650 Q430 590 455 570 Q425 610 420 530 Q410 590 390 510 Q405 610 370 580 Q395 630 350 590 Q375 650 450 650 Z" fill="#FFB347" fillOpacity="0.75" />

                {/* Additional smaller flames for texture */}
                <path className="flame" d="M80 650 Q95 600 75 580 Q100 610 105 540 Q115 600 135 520 Q120 610 155 580 Q130 630 175 590 Q150 650 80 650 Z" fill="#FFB347" fillOpacity="0.6" />
                <path className="flame" d="M720 650 Q705 600 725 580 Q700 610 695 540 Q685 600 665 520 Q680 610 645 580 Q670 630 625 590 Q650 650 720 650 Z" fill="#FFB347" fillOpacity="0.6" />
                <path className="flame" d="M120 650 Q135 590 115 570 Q140 600 145 530 Q155 590 175 510 Q160 600 195 570 Q170 620 215 580 Q190 650 120 650 Z" fill="#FF6600" fillOpacity="0.65" />
                <path className="flame" d="M680 650 Q665 590 685 570 Q660 600 655 530 Q645 590 625 510 Q640 600 605 570 Q630 620 585 580 Q610 650 680 650 Z" fill="#FF6600" fillOpacity="0.65" />

                {/* Enhanced animated sparks with varying sizes and colors */}
                <circle className="spark" cx="120" cy="630" r="2.5" fill="#FF6600" />
                <circle className="spark" cx="200" cy="640" r="1.8" fill="#FFB347" />
                <circle className="spark" cx="310" cy="620" r="1.5" fill="#FFD580" />
                <circle className="spark" cx="500" cy="640" r="2.2" fill="#FF6600" />
                <circle className="spark" cx="650" cy="630" r="2.8" fill="#FFB347" />
                <circle className="spark" cx="720" cy="620" r="2.1" fill="#FFD580" />
                <circle className="spark" cx="170" cy="610" r="2.3" fill="#FFB347" />
                <circle className="spark" cx="260" cy="660" r="1.7" fill="#FF6600" />
                <circle className="spark" cx="370" cy="625" r="1.4" fill="#FFD580" />
                <circle className="spark" cx="430" cy="635" r="2.0" fill="#FFB347" />
                <circle className="spark" cx="580" cy="615" r="2.4" fill="#FF6600" />
                <circle className="spark" cx="690" cy="645" r="1.6" fill="#FFD580" />
                <circle className="spark" cx="140" cy="610" r="2.6" fill="#FFB347" />
                <circle className="spark" cx="180" cy="660" r="1.9" fill="#FF6600" />
                <circle className="spark" cx="400" cy="625" r="1.3" fill="#FFD580" />
                <circle className="spark" cx="460" cy="635" r="2.1" fill="#FFB347" />
                <circle className="spark" cx="560" cy="645" r="2.3" fill="#FF6600" />
                <circle className="spark" cx="680" cy="625" r="1.8" fill="#FFD580" />

                {/* Floating embers for extra realism */}
                <circle className="ember" cx="150" cy="600" r="1.5" fill="#FFD580" />
                <circle className="ember" cx="280" cy="580" r="1.2" fill="#FFB347" />
                <circle className="ember" cx="420" cy="620" r="1.8" fill="#FFD580" />
                <circle className="ember" cx="550" cy="590" r="1.4" fill="#FFB347" />
                <circle className="ember" cx="680" cy="610" r="1.6" fill="#FFD580" />
                <circle className="ember" cx="200" cy="570" r="1.1" fill="#FFB347" />
                <circle className="ember" cx="350" cy="600" r="1.7" fill="#FFD580" />
                <circle className="ember" cx="480" cy="580" r="1.3" fill="#FFB347" />
                <circle className="ember" cx="620" cy="600" r="1.5" fill="#FFD580" />

                {/* Additional small flames for edge detail */}
                <path className="flame" d="M60 650 Q75 610 55 590 Q80 620 85 560 Q95 610 115 540 Q100 610 135 580 Q110 630 155 590 Q130 650 60 650 Z" fill="#FF6600" fillOpacity="0.5" />
                <path className="flame" d="M740 650 Q725 610 745 590 Q720 620 715 560 Q705 610 685 540 Q700 610 665 580 Q690 630 645 590 Q670 650 740 650 Z" fill="#FF6600" fillOpacity="0.5" />
                <path className="flame" d="M90 650 Q105 600 85 580 Q110 610 115 540 Q125 600 145 520 Q130 610 165 580 Q140 630 185 590 Q160 650 90 650 Z" fill="#FFB347" fillOpacity="0.55" />
                <path className="flame" d="M710 650 Q695 600 715 580 Q690 610 685 540 Q675 600 655 520 Q670 610 635 580 Q660 630 615 590 Q640 650 710 650 Z" fill="#FFB347" fillOpacity="0.55" />
            </svg>
        </div>
    );
}
