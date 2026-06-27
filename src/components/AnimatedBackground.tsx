import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  char: string;
  size: number; // px
  delay: number; // seconds
  duration: number; // seconds
  rot: number; // degrees
  animationClass: string;
  vars: {
    [key: string]: string;
  };
}

const ELEMENT_POOL = [
  '⭐', // Etoile
  '❤️', // Coeur
  '🎁', // Cadeau
  '✨', // Paillettes
  '🌸', // Fleur
  '🍃', // Feuille
  '💎', // Diamant
  '🛍️', // Shopping
  '🧴', // Cosmetique
];

export default function AnimatedBackground() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    // Generate static list of elements on mount to avoid continuous state updates
    // 42 elements to make it rich, modern and vibrant but keeping it perfectly smooth
    const initialElements: FloatingElement[] = Array.from({ length: 42 }, (_, i) => {
      const char = ELEMENT_POOL[i % ELEMENT_POOL.length];
      const size = Math.random() * 20 + 26; // size between 26px and 46px (perfect visibility)
      const duration = Math.random() * 20 + 20; // 20s to 40s for elegant, fluid drifting speed
      const delay = Math.random() * -50; // negative delay so elements are spread across the screen on load
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const rot = (Math.random() * 180 + 180) * rotationDirection;

      // Determine movement type to get diverse directions (up, down, left, right, diagonals)
      const r = Math.random();
      let animationClass = '';
      const vars: { [key: string]: string } = {};

      if (r < 0.4) {
        // 40% FLOATING UPWARDS (Can be vertical or diagonal up)
        animationClass = 'animate-float-up';
        const startX = `${Math.random() * 100}%`;
        const endX = `${Math.random() * 100}%`; // Different X makes it diagonal!
        vars['--startX'] = startX;
        vars['--endX'] = endX;
      } else if (r < 0.8) {
        // 40% FLOATING DOWNWARDS (Can be vertical or diagonal down)
        animationClass = 'animate-float-down';
        const startX = `${Math.random() * 100}%`;
        const endX = `${Math.random() * 100}%`;
        vars['--startX'] = startX;
        vars['--endX'] = endX;
      } else if (r < 0.9) {
        // 10% FLOATING LEFT TO RIGHT
        animationClass = 'animate-float-right';
        const startY = `${Math.random() * 100}%`;
        const endY = `${Math.random() * 100}%`;
        vars['--startY'] = startY;
        vars['--endY'] = endY;
      } else {
        // 10% FLOATING RIGHT TO LEFT
        animationClass = 'animate-float-left';
        const startY = `${Math.random() * 100}%`;
        const endY = `${Math.random() * 100}%`;
        vars['--startY'] = startY;
        vars['--endY'] = endY;
      }

      vars['--rot'] = `${rot}deg`;
      vars['--dur'] = `${duration}s`;

      return {
        id: i,
        char,
        size,
        delay,
        duration,
        rot,
        animationClass,
        vars,
      };
    });

    setElements(initialElements);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* CSS rules for high performance animations inside compositor thread */}
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

        /* 4-way floating pathways */
        @keyframes floatUp {
          0% {
            transform: translateY(105vh) translateX(var(--startX)) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 0.45;
          }
          92% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(-10vh) translateX(var(--endX)) rotate(var(--rot));
            opacity: 0;
          }
        }

        @keyframes floatDown {
          0% {
            transform: translateY(-10vh) translateX(var(--startX)) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 0.45;
          }
          92% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(105vh) translateX(var(--endX)) rotate(var(--rot));
            opacity: 0;
          }
        }

        @keyframes floatRight {
          0% {
            transform: translateX(-10vw) translateY(var(--startY)) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 0.45;
          }
          92% {
            opacity: 0.45;
          }
          100% {
            transform: translateX(105vw) translateY(var(--endY)) rotate(var(--rot));
            opacity: 0;
          }
        }

        @keyframes floatLeft {
          0% {
            transform: translateX(105vw) translateY(var(--startY)) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 0.45;
          }
          92% {
            opacity: 0.45;
          }
          100% {
            transform: translateX(-10vw) translateY(var(--endY)) rotate(var(--rot));
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

        .animate-float-up {
          animation: floatUp var(--dur) linear infinite;
        }
        .animate-float-down {
          animation: floatDown var(--dur) linear infinite;
        }
        .animate-float-right {
          animation: floatRight var(--dur) linear infinite;
        }
        .animate-float-left {
          animation: floatLeft var(--dur) linear infinite;
        }
      `}</style>

      {/* Modern Soft Drifting Pastel Orbs (Glassmorphism Effect) */}
      <div 
        className="absolute top-[15%] left-[10%] w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-rose-200/18 blur-[80px] md:blur-[130px] animate-orb-1 pointer-events-none" 
      />
      <div 
        className="absolute bottom-[20%] right-[15%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-emerald-100/18 blur-[90px] md:blur-[140px] animate-orb-2 pointer-events-none" 
      />
      <div 
        className="absolute top-[60%] left-[50%] w-[220px] md:w-[400px] h-[220px] md:h-[400px] rounded-full bg-amber-100/18 blur-[80px] md:blur-[120px] animate-orb-3 pointer-events-none" 
      />
      <div 
        className="absolute top-[5%] right-[25%] w-[200px] md:w-[350px] h-[200px] md:h-[350px] rounded-full bg-purple-100/15 blur-[70px] md:blur-[110px] animate-orb-1 pointer-events-none" 
      />

      {/* Floating Elements distributed on all directions */}
      {elements.map((el) => {
        // Build style object with custom properties
        const styleObj: React.CSSProperties = {
          position: 'absolute',
          fontSize: `${el.size}px`,
          animationDelay: `${el.delay}s`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.03))',
          willChange: 'transform, opacity',
        };

        // Inject the CSS custom variables safely
        Object.entries(el.vars).forEach(([key, val]) => {
          (styleObj as any)[key] = val;
        });

        return (
          <div
            key={el.id}
            className={`pointer-events-none select-none text-center ${el.animationClass}`}
            style={styleObj}
          >
            {el.char}
          </div>
        );
      })}
    </div>
  );
}
