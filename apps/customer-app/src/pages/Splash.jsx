/* Splash Screen — KhidmatAI
   Faithfully ported from stitch_khidmatai_premium_ai_orchestrator/splash_screen/code.html
   Shows for 2.5 seconds then transitions to Home */
import { useEffect } from 'react';

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <main className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #004b24 0%, #00210c 100%)' }}>

      {/* Ambient glassmorphic glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] pointer-events-none"
           style={{ background: 'rgba(132,217,153,0.15)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] pointer-events-none"
           style={{ background: 'rgba(203,167,47,0.08)' }} />
      <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full blur-[80px] pointer-events-none"
           style={{ background: 'rgba(132,217,153,0.08)' }} />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">

        {/* Premium glass logo container */}
        <div className="relative p-6 rounded-full flex items-center justify-center animate-float"
             style={{
               background: 'rgba(255,255,255,0.07)',
               backdropFilter: 'blur(24px)',
               border: '1px solid rgba(255,255,255,0.15)',
               boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
             }}>
          {/* Emerald glow orb */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(159,246,180,0.3) 0%, rgba(0,102,51,0.6) 100%)',
                 boxShadow: '0 0 60px rgba(159,246,180,0.3)',
               }}>
            <span className="material-symbols-outlined text-white"
                  style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
        </div>

        {/* Brand typography */}
        <div className="flex flex-col items-center gap-2">
          <h1 style={{
            fontFamily: 'Inter',
            fontSize: 'clamp(40px, 8vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.1,
          }}>
            KhidmatAI
          </h1>
          <p style={{ color: 'rgba(159,246,180,0.8)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.08em' }}>
            POWERED BY INTELLIGENCE
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-3 z-10">
        {/* Glow orb indicator */}
        <div className="w-2 h-2 rounded-full pulse-glow"
             style={{ background: '#9ff6b4', boxShadow: '0 0 20px rgba(159,246,180,0.8)' }} />
        <p style={{ color: 'rgba(132,217,153,0.6)', fontSize: '12px', letterSpacing: '0.05em', fontWeight: 600 }}>
          Pakistan ka AI service platform
        </p>
      </div>
    </main>
  );
}
