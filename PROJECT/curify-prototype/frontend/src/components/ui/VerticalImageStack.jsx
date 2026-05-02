import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, src: '/step_symptom.png', alt: 'Type Your Symptoms', label: 'Symptom Input', desc: 'In any language — English, Hindi, Hinglish' },
  { id: 2, src: '/step_ai.png', alt: 'AI Parses Query', label: 'AI Parsing', desc: 'Gemini NLP maps to ICD-10 codes' },
  { id: 3, src: '/step_hospital.png', alt: 'Hospitals Ranked', label: 'Hospital Ranking', desc: '5-factor algorithm with accreditation' },
  { id: 4, src: '/step_cost.png', alt: 'Cost Breakdown', label: 'Cost Engine', desc: 'NHA/CGHS-anchored component costs' },
  { id: 5, src: '/step_lender.png', alt: 'Lender Report', label: 'Lender Report', desc: 'Auto-approve in 8 minutes' },
];

export default function VerticalImageStack() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastNav = useRef(0);

  const navigate = useCallback((dir) => {
    const now = Date.now();
    if (now - lastNav.current < 400) return;
    lastNav.current = now;
    setCurrentIndex(prev => {
      if (dir > 0) return prev === STEPS.length - 1 ? 0 : prev + 1;
      return prev === 0 ? STEPS.length - 1 : prev - 1;
    });
  }, []);

  const handleDragEnd = (_, info) => {
    if (info.offset.y < -50) navigate(1);
    else if (info.offset.y > 50) navigate(-1);
  };

  useEffect(() => {
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) navigate(e.deltaY > 0 ? 1 : -1);
    };
    const container = document.getElementById('vertical-stack-container');
    if (container) container.addEventListener('wheel', onWheel, { passive: true });
    return () => container?.removeEventListener('wheel', onWheel);
  }, [navigate]);

  const getStyle = (index) => {
    let diff = index - currentIndex;
    if (diff > STEPS.length / 2) diff -= STEPS.length;
    if (diff < -STEPS.length / 2) diff += STEPS.length;
    if (diff === 0) return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    if (diff === -1) return { y: -150, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    if (diff === -2) return { y: -260, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    if (diff === 1) return { y: 150, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    if (diff === 2) return { y: 260, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: 0 };
  };

  const isVisible = (index) => {
    let diff = index - currentIndex;
    if (diff > STEPS.length / 2) diff -= STEPS.length;
    if (diff < -STEPS.length / 2) diff += STEPS.length;
    return Math.abs(diff) <= 2;
  };

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3 block">The Intelligence Engine</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How CURIFY Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Scroll or drag through five stages — from patient query to financial certainty.</p>
        </div>

        <div id="vertical-stack-container" className="relative flex items-center justify-center h-[550px] overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

          {/* Card stack */}
          <div className="relative flex h-[480px] w-[300px] items-center justify-center" style={{ perspective: '1200px' }}>
            {STEPS.map((step, index) => {
              if (!isVisible(index)) return null;
              const s = getStyle(index);
              const isCurrent = index === currentIndex;
              return (
                <motion.div key={step.id} className="absolute cursor-grab active:cursor-grabbing"
                  animate={{ y: s.y, scale: s.scale, opacity: s.opacity, rotateX: s.rotateX, zIndex: s.zIndex }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
                  drag={isCurrent ? 'y' : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
                  onDragEnd={handleDragEnd} style={{ transformStyle: 'preserve-3d', zIndex: s.zIndex }}>
                  <div className={`relative h-[400px] w-[270px] overflow-hidden rounded-3xl border ${isCurrent ? 'border-emerald-500/30' : 'border-white/10'} bg-slate-900/80 backdrop-blur-md`}
                    style={{ boxShadow: isCurrent ? '0 25px 50px -12px rgba(34,197,94,0.15), 0 0 0 1px rgba(255,255,255,0.05)' : '0 10px 30px -10px rgba(0,0,0,0.3)' }}>
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 via-transparent to-transparent" />
                    <img src={step.src} alt={step.alt} className="w-full h-[65%] object-cover" draggable={false} />
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                      <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest block mb-1">Step 0{index + 1}</span>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`w-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'h-6 bg-emerald-400' : 'h-2 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">{String(currentIndex + 1).padStart(2, '0')}</span>
            <div className="my-2 h-px w-8 bg-white/20" />
            <span className="text-sm text-slate-500 tabular-nums">{String(STEPS.length).padStart(2, '0')}</span>
          </div>

          {/* Hint */}
          <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <motion.svg animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7-7 7 7" /></motion.svg>
            <span className="text-[10px] font-medium tracking-widest uppercase">Scroll or drag</span>
            <motion.svg animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M19 12l-7 7-7-7" /></motion.svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
