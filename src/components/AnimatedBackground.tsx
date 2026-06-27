import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  char: string;
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  startX: number; // %
  startY: number; // %
  driftX: number; // px
  driftY: number; // px
  rot: number; // degrees
}

const ELEMENT_POOL = [
  '⭐', // Étoile
  '❤️', // Cœur
  '🎁', // Cadeau
  '✨', // Paillettes
  '🌸', // Fleur
  '🍃', // Feuille
  '💎', // Diamant
  '🛍️', // Icône shopping
  '🧴', // Cosmétique
];

export default function AnimatedBackground() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    // Generate 45 beautifully distributed floating elements
    // covering all areas of the screen (top, bottom, left, right, center)
    const initialElements: FloatingElement[] = Array.from({ length: 45 }, (_, i) => {
      const char = ELEMENT_POOL[i % ELEMENT_POOL.length];
      
      // Slightly larger sizes (28px to 48px) for beautiful structure
      const size = Math.round(Math.random() * 20 + 28);
      
      // Extremely smooth, slow, and constant speed: 30s to 50s
      const duration = Math.round(Math.random() * 20 + 30);
      
      // Large negative delays so elements are fully pre-spread across the screen on page load
      const delay = Math.round(Math.random() * -50);

      // Start position distributed evenly in grid sectors to ensure 100% global coverage
      const col = i % 6; // 0 to 5
      const row = Math.floor(i / 6) % 8; // 0 to 7
      
      // Base positions with random offset inside their grid sectors
      const startX = Math.round((col * 16.6) + Math.random() * 10 + 2); // 2% to 98%
      const startY = Math.round((row * 12.5) + Math.random() * 9 + 2);  // 2% to 98%

      // Pure relative translation drift offset for high-performance GPU compositing (no layout repaints!)
      const angle = Math.random() * Math.PI * 2;
      const driftRadius = Math.random() * 80 + 60; // 60px to 140px drifting radius
      
      const driftX = Math.round(Math.cos(angle) * driftRadius);
      const driftY = Math.round(Math.sin(angle) * driftRadius);

      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const rot = Math.round((Math.random() * 180 + 120) * rotationDirection);

      return {
        id: i,
        char,
        size,
        duration,
        delay,
        startX,
        startY,
        driftX,
        driftY,
        rot,
      };
    });

    setElements(initialElements);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {/* High-performance animations using CSS translate3d to avoid layout invalidation or repaint passes during scroll */}
      <style>{`
        @keyframes driftOrb1 {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          33% { transform: translate3d(20px, -45px, 0) scale(1.05); }
          66% { transform: translate3d(-15px, 20px, 0) scale(0.98); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }
        @keyframes driftOrb2 {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          50% { transform: translate3d(-30px, 30px, 0) scale(1.1); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }
        @keyframes driftOrb3 {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          40% { transform: translate3d(40px, 25px, 0) scale(0.95); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }

        .animate-orb-1 {
          animation: driftOrb1 35s ease-in-out infinite;
        }
        .animate-orb-2 {
          animation: driftOrb2 40s ease-in-out infinite;
        }
        .animate-orb-3 {
          animation: driftOrb3 38s ease-in-out infinite;
        }

        /* Seamless looping customized paths for each particle using GPU-accelerated translate3d */
        ${elements.map(el => `
          @keyframes path-${el.id} {
            0% {
              transform: translate3d(0, 0, 0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.12; /* highly discrete 12% opacity */
            }
            50% {
              transform: translate3d(${el.driftX}px, ${el.driftY}px, 0) rotate(${el.rot / 2}deg);
              opacity: 0.15;
            }
            90% {
              opacity: 0.12;
            }
            100% {
              transform: translate3d(0, 0, 0) rotate(${el.rot}deg);
              opacity: 0;
            }
          }
          .particle-${el.id} {
            animation: path-${el.id} ${el.duration}s ease-in-out infinite;
            animation-delay: ${el.delay}s;
          }
        `).join('\n')}
      `}</style>

      {/* Modern Soft Drifting Pastel Background Orbs (with low opacity for a soft, elegant glow) */}
      <div 
        className="absolute top-[10%] left-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-rose-200/10 blur-[90px] md:blur-[140px] animate-orb-1 pointer-events-none" 
      />
      <div 
        className="absolute bottom-[15%] right-[10%] w-[350px] md:w-[550px] h-[350px] md:h-[550px] rounded-full bg-emerald-100/10 blur-[100px] md:blur-[150px] animate-orb-2 pointer-events-none" 
      />
      <div 
        className="absolute top-[50%] left-[45%] w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-amber-100/10 blur-[90px] md:blur-[130px] animate-orb-3 pointer-events-none" 
      />
      <div 
        className="absolute top-[3%] right-[20%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-purple-100/10 blur-[80px] md:blur-[120px] animate-orb-1 pointer-events-none" 
      />

      {/* Elegant, Seamlessly Drifting Icons across all coordinates */}
      {elements.map((el) => (
        <div
          key={el.id}
          className={`absolute pointer-events-none select-none text-center transform-gpu particle-${el.id}`}
          style={{
            left: `${el.startX}%`,
            top: `${el.startY}%`,
            fontSize: `${el.size}px`,
            // Low saturation and darkened grayscale filter converts colorful emojis to extremely soft, elegant, matching background symbols
            filter: 'grayscale(0.95) brightness(0.4) contrast(1.1) drop-shadow(0 1px 2px rgba(0,0,0,0.01))',
            willChange: 'transform, opacity',
          }}
        >
          {el.char}
        </div>
      ))}
    </div>
  );
}
