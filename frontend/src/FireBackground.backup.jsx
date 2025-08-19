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
                    <radialGradient id="fireGlow" cx="50%" cy="90%" r="90%" fx="50%" fy="90%">
                        <stop offset="0%" stopColor="#FFB347" stopOpacity="0.9">
                            <animate attributeName="stop-color" values="#FFB347;#FF6600;#FFB347" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="60%" stopColor="#FF6600" stopOpacity="0.5">
                            <animate attributeName="stop-color" values="#FF6600;#FF3300;#FF6600" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#101B24" stopOpacity="0" />
                    </radialGradient>

                    <style>{`
            .flame {
              animation: flicker 2s infinite ease-in-out alternate;
              transform-origin: bottom center;
            }
            .flame:nth-child(2n) {
              animation-delay: 0.15s;
              animation-duration: 1.8s;
              transform: scaleX(0.95);
            }
            .flame:nth-child(3n) {
              animation-delay: 0.35s;
              animation-duration: 2.2s;
              transform: scaleX(1.05);
            }
            @keyframes flicker {
              0%   { transform: scaleY(1) translateY(0px); opacity: 0.9; }
              50%  { transform: scaleY(1.1) translateY(-8px); opacity: 1; }
              100% { transform: scaleY(1) translateY(0px); opacity: 0.8; }
            }

            .spark {
              animation: rise 3s infinite ease-in;
              fill: #FFD580;
              opacity: 0.7;
            }
            .spark:nth-child(3n) {
              animation-delay: 1s;
              fill: #FFB347;
            }
            .spark:nth-child(4n) {
              animation-delay: 2s;
              fill: #FFF;
            }
            @keyframes rise {
              0% { transform: translateY(0px) scale(1); opacity: 0.8; }
              50% { opacity: 1; }
              100% { transform: translateY(-200px) scale(0.5); opacity: 0; }
            }
          `}</style>
                </defs>

                <ellipse cx="400" cy="650" rx="350" ry="60" fill="url(#fireGlow)" />

                {/* Randomized flame colors */}
                <path className="flame" d="M100 650 Q115 585 90 570 Q110 590 115 560 Q120 580 140 540 Q135 590 160 565 Q150 610 190 570 Q170 650 100 650 Z" fill="#FF6600" fillOpacity="0.5" />
                <path className="flame" d="M700 650 Q685 585 710 570 Q690 590 685 560 Q680 580 660 540 Q665 590 640 565 Q650 610 610 570 Q630 650 700 650 Z" fill="#be561fff" fillOpacity="0.6" />
                <path className="flame" d="M220 650 Q240 600 210 580 Q230 600 240 560 Q250 590 270 550 Q260 600 290 580 Q280 630 320 580 Q300 650 220 650 Z" fill="#ff9147ff" fillOpacity="0.7" />
                <path className="flame" d="M580 650 Q560 600 590 580 Q570 600 560 560 Q550 590 530 550 Q540 600 510 580 Q520 630 480 580 Q500 650 580 650 Z" fill="#FF6600" fillOpacity="0.8" />
                <path className="flame" d="M320 650 Q340 570 310 550 Q330 580 340 540 Q350 570 370 530 Q360 590 390 560 Q380 620 420 570 Q400 650 320 650 Z" fill="#f48033ff" fillOpacity="0.7" />
                <path className="flame" d="M600 650 Q580 570 610 550 Q590 580 580 540 Q570 570 550 530 Q560 590 530 560 Q540 620 500 570 Q520 650 600 650 Z" fill="#FFB347" fillOpacity="0.6" />
                <path className="flame" d="M400 650 Q420 600 390 580 Q410 600 420 560 Q430 590 450 550 Q440 600 470 580 Q460 630 500 580 Q480 650 400 650 Z" fill="#FF6600" fillOpacity="0.8" />
                <path className="flame" d="M460 650 Q440 600 470 580 Q450 600 440 560 Q430 590 410 550 Q420 600 400 580 Q410 630 360 580 Q380 650 460 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M540 650 Q560 580 530 560 Q550 580 560 540 Q570 570 590 530 Q580 590 610 560 Q600 620 640 570 Q620 650 540 650 Z" fill="#FFB347" fillOpacity="0.8" />
                <path className="flame" d="M420 650 Q400 570 430 550 Q410 580 400 540 Q390 570 370 530 Q380 590 350 560 Q360 620 320 570 Q340 650 420 650 Z" fill="#FF6600" fillOpacity="0.6" />
                <path className="flame" d="M60 650 Q80 580 50 560 Q70 590 90 550 Q85 600 120 570 Q100 650 60 650 Z" fill="#ff812dff" fillOpacity="0.6" />
                <path className="flame" d="M740 650 Q720 580 750 560 Q730 590 710 550 Q715 600 680 570 Q700 650 740 650 Z" fill="#FFB347" fillOpacity="0.7" />
                <path className="flame" d="M260 650 Q280 600 250 580 Q270 610 290 570 Q285 620 320 590 Q300 650 260 650 Z" fill="#FF6600" fillOpacity="0.8" />
                <path className="flame" d="M540 650 Q520 610 550 590 Q530 620 510 580 Q515 630 480 600 Q500 650 540 650 Z" fill="#ffa01bff" fillOpacity="1" />
                <path className="flame" d="M460 650 Q480 610 450 590 Q470 620 490 580 Q485 630 520 600 Q500 650 460 650 Z" fill="#ffa628ff" fillOpacity="1" />
                <path className="flame" d="M560 650 Q540 600 570 580 Q550 610 530 570 Q535 620 500 590 Q520 650 560 650 Z" fill="#FF6600" fillOpacity="0.8" />
                <path className="flame" d="M660 650 Q680 590 650 570 Q670 600 690 560 Q685 610 720 580 Q700 650 660 650 Z" fill="#d45020ff" fillOpacity="0.7" />
                {/* Evenly and randomly spread left-side flames */}
                <path className="flame" d="M70 650 Q90 585 65 570 Q85 590 90 560 Q100 580 120 540 Q110 590 140 565 Q130 610 170 570 Q150 650 70 650 Z" fill="#FF6600" fillOpacity="0.5" />
                <path className="flame" d="M130 650 Q150 600 120 580 Q140 600 150 560 Q160 590 180 550 Q170 600 200 580 Q190 630 230 580 Q210 650 130 650 Z" fill="#ff9925ff" fillOpacity="0.6" />
                <path className="flame" d="M190 650 Q210 600 180 580 Q200 600 210 560 Q220 590 240 550 Q230 600 260 580 Q250 630 290 580 Q270 650 190 650 Z" fill="#ff7f16ff" fillOpacity="0.7" />
                <path className="flame" d="M250 650 Q270 600 240 580 Q260 600 270 560 Q280 590 300 550 Q290 600 320 580 Q310 630 350 580 Q330 650 250 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M320 650 Q340 570 310 550 Q330 580 340 540 Q350 570 370 530 Q360 590 390 560 Q380 620 420 570 Q400 650 320 650 Z" fill="#FF6600" fillOpacity="0.7" />
                <path className="flame" d="M390 650 Q410 600 380 580 Q400 600 410 560 Q420 590 440 550 Q430 600 460 580 Q450 630 490 580 Q470 650 390 650 Z" fill="#d45020ff" fillOpacity="0.8" />


                {/* Animated sparks with randomized flame colors */}
                <circle className="spark" cx="120" cy="630" r="2" fill="#FF6600" />
                <circle className="spark" cx="200" cy="640" r="1.5" fill="#FFB347" />
                <circle className="spark" cx="310" cy="620" r="1.2" fill="#FFD580" />
                <circle className="spark" cx="500" cy="640" r="1.4" fill="#FF6600" />
                <circle className="spark" cx="650" cy="630" r="2" fill="#FFB347" />
                <circle className="spark" cx="720" cy="620" r="1.7" fill="#FFD580" />
                <circle className="spark" cx="170" cy="610" r="1.8" fill="#FFB347" />
                <circle className="spark" cx="260" cy="660" r="1.3" fill="#FF6600" />
                <circle className="spark" cx="370" cy="625" r="1.1" fill="#FFD580" />
                <circle className="spark" cx="430" cy="635" r="1.6" fill="#FFB347" />
                <circle className="spark" cx="580" cy="615" r="1.9" fill="#FF6600" />
                <circle className="spark" cx="690" cy="645" r="1.2" fill="#FFD580" />
                <circle className="spark" cx="120" cy="610" r="1.9" fill="#FFB347" />
                <circle className="spark" cx="160" cy="660" r="1.3" fill="#FF6600" />
                <circle className="spark" cx="380" cy="625" r="1.2" fill="#FFD580" />
                <circle className="spark" cx="420" cy="635" r="1.2" fill="#FFB347" />
                <circle className="spark" cx="520" cy="645" r="1.9" fill="#FF6600" />
                <circle className="spark" cx="640" cy="625" r="1.2" fill="#FFD580" />
            </svg>
        </div>
    );
}
