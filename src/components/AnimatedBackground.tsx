import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  char: string;
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  startX: number; // %
  startY: number; // %
  midX: number; // %
  midY: number; // %
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
      
      // Slighly larger sizes as requested (28px to 48px) for excellent visibility
      const size = Math.round(Math.random() * 20 + 28);
      
      // Varied and elegant speed: 25s to 45s for organic, smooth drifting
      const duration = Math.round(Math.random() * 20 + 25);
      
      // Negative delays to keep them pre-spread on mount
      const delay = Math.round(Math.random() * -45);

      // Start position distributed evenly in grid-like blocks to ensure complete coverage of the screen
      const col = i % 5; // 0 to 4
      const row = Math.floor(i / 5) % 9; // 0 to 8
      
      // Base positions with random offset inside their grid sectors
      const startX = Math.round((col * 20) + Math.random() * 15 + 2); // 2% to 97%
      const startY = Math.round((row * 11) + Math.random() * 9 + 2);  // 2% to 97%

      // Midpoint position for the diagonal or wavy drift trajectory
      const angle = Math.random() * Math.PI * 2;
      const driftDistance = Math.random() * 15 + 10; // drift by 10% to 25% of viewport
      
      let midX = startX + Math.cos(angle) * driftDistance;
      let midY = startY + Math.sin(angle) * driftDistance;

      // Keep midpoint within bounds
      midX = Math.max(5, Math.min(95, midX));
      midY = Math.max(5, Math.min(95, midY));

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
        midX: Math.round(midX),
        midY: Math.round(midY),
        rot,
      };
    });

    setElements(initialElements);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Dynamic Keyframes Generation for high-performance compositor thread CSS animations */}
      <style>{`
        @keyframes driftOrb1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftOrb2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftOrb3 {
          0% { transform: translate(0px, 0px) scale(1); }
          40% { transform: translate(60px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .animate-orb-1 {
          animation: driftOrb1 30s ease-in-out infinite;
        }
        .animate-orb-2 {
          animation: driftOrb2 35s ease-in-out infinite;
        }
        .animate-orb-3 {
          animation: driftOrb3 32s ease-in-out infinite;
        }

        /* Seamless looping customized paths for each particle */
        ${elements.map(el => `
          @keyframes path-${el.id} {
            0% {
              left: ${el.startX}%;
              top: ${el.startY}%;
              transform: translate(0, 0) rotate(0deg);
              opacity: 0;
            }
            8% {
              opacity: 0.38; /* elegant 38% opacity */
            }
            50% {
              left: ${el.midX}%;
              top: ${el.midY}%;
              transform: translate(15px, -15px) rotate(${el.rot / 2}deg);
              opacity: 0.38;
            }
            92% {
              opacity: 0.38;
            }
            100% {
              left: ${el.startX}%;
              top: ${el.startY}%;
              transform: translate(0, 0) rotate(${el.rot}deg);
              opacity: 0;
            }
          }
          .particle-${el.id} {
            animation: path-${el.id} ${el.duration}s ease-in-out infinite;
            animation-delay: ${el.delay}s;
          }
        `).join('\n')}
      `}</style>

      {/* Modern Soft Drifting Pastel Background Orbs */}
      <div 
        className="absolute top-[10%] left-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-rose-200/20 blur-[90px] md:blur-[140px] animate-orb-1 pointer-events-none" 
      />
      <div 
        className="absolute bottom-[15%] right-[10%] w-[350px] md:w-[550px] h-[350px] md:h-[550px] rounded-full bg-emerald-100/20 blur-[100px] md:blur-[150px] animate-orb-2 pointer-events-none" 
      />
      <div 
        className="absolute top-[50%] left-[45%] w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-amber-100/20 blur-[90px] md:blur-[130px] animate-orb-3 pointer-events-none" 
      />
      <div 
        className="absolute top-[3%] right-[20%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-purple-100/18 blur-[80px] md:blur-[120px] animate-orb-1 pointer-events-none" 
      />

      {/* Elegant, Seamlessly Drifting Icons across all coordinates */}
      {elements.map((el) => (
        <div
          key={el.id}
          className={`absolute pointer-events-none select-none text-center transform-gpu particle-${el.id}`}
          style={{
            fontSize: `${el.size}px`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))',
            willChange: 'left, top, transform, opacity',
          }}
        >
          {el.char}
        </div>
      ))}
    </div>
  );
}
