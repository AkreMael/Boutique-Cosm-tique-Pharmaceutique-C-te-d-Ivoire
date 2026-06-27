import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  char: string;
  left: number; // percentage
  size: number; // px
  delay: number; // seconds
  duration: number; // seconds
  swayAmount: number; // px
  rotationDirection: number; // 1 or -1
}

const ELEMENT_POOL = [
  '⭐', // Star
  '❤️', // Heart
  '🎁', // Gift
  '✨', // Sparkle
  '🌸', // Flower
  '🍃', // Leaf
  '💎', // Diamond
  '🛍️', // Shopping bag
  '🧴', // Cosmetic lotion
];

export default function AnimatedBackground() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    // Generate static list of elements on mount to avoid continuous state updates
    const initialElements: FloatingElement[] = Array.from({ length: 32 }, (_, i) => {
      const char = ELEMENT_POOL[i % ELEMENT_POOL.length];
      const left = Math.random() * 92 + 4; // keep 4% padding from screen edges
      const size = Math.random() * 20 + 22; // size between 22px and 42px (larger, more visible)
      const delay = Math.random() * -45; // negative delay so they are already spread out on mount
      const duration = Math.random() * 22 + 20; // duration between 20s and 42s for smooth, elegant flow
      const swayAmount = Math.random() * 60 + 30; // sway width between 30px and 90px
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;

      return {
        id: i,
        char,
        left,
        size,
        delay,
        duration,
        swayAmount,
        rotationDirection,
      };
    });

    setElements(initialElements);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Self-contained CSS styles to run high-performance CSS animations in compositor thread */}
      <style>{`
        @keyframes driftOrb1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftOrb2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftOrb3 {
          0% { transform: translate(0px, 0px) scale(1); }
          40% { transform: translate(50px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatGentle {
          0% {
            transform: translateY(110vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.42;
          }
          90% {
            opacity: 0.42;
          }
          100% {
            transform: translateY(-10vh) translateX(var(--sway)) rotate(var(--rot));
            opacity: 0;
          }
        }
        .animate-orb-1 {
          animation: driftOrb1 25s ease-in-out infinite;
        }
        .animate-orb-2 {
          animation: driftOrb2 30s ease-in-out infinite;
        }
        .animate-orb-3 {
          animation: driftOrb3 28s ease-in-out infinite;
        }
        .floating-particle {
          animation: floatGentle var(--dur) linear infinite;
        }
      `}</style>

      {/* Modern Soft Drifting Pastel Orbs (Glassmorphism Effect) */}
      {/* Rose Soft Blob */}
      <div 
        className="absolute top-[15%] left-[10%] w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-rose-200/15 blur-[80px] md:blur-[130px] animate-orb-1 pointer-events-none" 
      />
      {/* Vert Soft Blob */}
      <div 
        className="absolute bottom-[20%] right-[15%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-emerald-100/15 blur-[90px] md:blur-[140px] animate-orb-2 pointer-events-none" 
      />
      {/* Doré/Orange Soft Blob */}
      <div 
        className="absolute top-[60%] left-[50%] w-[220px] md:w-[400px] h-[220px] md:h-[400px] rounded-full bg-amber-100/15 blur-[80px] md:blur-[120px] animate-orb-3 pointer-events-none" 
      />
      {/* Violet Soft Blob */}
      <div 
        className="absolute top-[5%] right-[25%] w-[200px] md:w-[350px] h-[200px] md:h-[350px] rounded-full bg-purple-100/12 blur-[70px] md:blur-[110px] animate-orb-1 pointer-events-none" 
      />

      {/* Floating Elements */}
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute bottom-0 floating-particle pointer-events-none select-none text-center"
          style={{
            left: `${el.left}%`,
            fontSize: `${el.size}px`,
            animationDelay: `${el.delay}s`,
            // Set custom CSS variables for the floatGentle animation
            ['--dur' as any]: `${el.duration}s`,
            ['--sway' as any]: `${el.swayAmount}px`,
            ['--rot' as any]: `${360 * el.rotationDirection}deg`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.03))',
            willChange: 'transform, opacity',
          }}
        >
          {el.char}
        </div>
      ))}
    </div>
  );
}
