import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { HeartPulse, BarChart3, ArrowUp } from 'lucide-react';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>AI-Powered Healthcare</span> <span className="text-emerald-500/60">✦</span>
    <span>NHA Anchored Costs</span> <span className="text-sky-500/60">✦</span>
    <span>8-Minute Underwriting</span> <span className="text-emerald-500/60">✦</span>
    <span>Multilingual NLP</span> <span className="text-sky-500/60">✦</span>
    <span>NABH Verified</span> <span className="text-emerald-500/60">✦</span>
  </div>
);

function MagneticButton({ children, className = '', as: Tag = 'button', ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.3, y: y * 0.3, scale: 1.05, ease: 'power2.out', duration: 0.4 });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, scale: 1, ease: 'elastic.out(1,0.3)', duration: 1.2 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);
  return <Tag ref={ref} className={`cursor-pointer ${className}`} {...props}>{children}</Tag>;
}

export default function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(giantRef.current, { y: '10vh', scale: 0.8, opacity: 0 }, {
        y: '0vh', scale: 1, opacity: 1, ease: 'power1.out',
        scrollTrigger: { trigger: wrapperRef.current, start: 'top 80%', end: 'bottom bottom', scrub: 1 },
      });
      gsap.fromTo([headingRef.current, linksRef.current], { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: wrapperRef.current, start: 'top 40%', end: 'bottom bottom', scrub: 1 },
      });
    }, wrapperRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-screen w-full" style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}>
      <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#020617] text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>

        {/* Aurora glow */}
        <div className="absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px] pointer-events-none z-0 opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(14,165,233,0.08) 40%, transparent 70%)', animation: 'footer-breathe 8s ease-in-out infinite alternate' }} />

        {/* Grid bg */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          backgroundSize: '60px 60px',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
        }} />

        {/* Giant bg text */}
        <div ref={giantRef} className="absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          style={{ fontSize: '26vw', lineHeight: 0.75, fontWeight: 900, letterSpacing: '-0.05em', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.04)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 60%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
          CURIFY
        </div>

        {/* Marquee */}
        <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/[0.06] bg-black/40 backdrop-blur-md py-4 z-10 -rotate-2 scale-110">
          <div className="flex w-max text-xs font-bold tracking-[0.3em] text-slate-500 uppercase" style={{ animation: 'footer-scroll-marquee 40s linear infinite' }}>
            <MarqueeItem /><MarqueeItem />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
          <h2 ref={headingRef} className="text-5xl md:text-8xl font-black tracking-tighter mb-12 text-center"
            style={{ background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))' }}>
            Ready to begin?
          </h2>

          <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <MagneticButton as={Link} to="/patient"
                className="px-10 py-5 rounded-full font-bold text-sm flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all">
                <HeartPulse size={20} /> Patient Search
              </MagneticButton>
              <MagneticButton as={Link} to="/lender"
                className="px-10 py-5 rounded-full font-bold text-sm flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all">
                <BarChart3 size={20} /> Lender Dashboard
              </MagneticButton>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <MagneticButton as={Link} to="/about"
                className="px-6 py-3 rounded-full text-slate-500 font-medium text-xs border border-white/[0.06] bg-white/[0.02] backdrop-blur-md hover:text-white hover:bg-white/[0.06] transition-all">
                About Us
              </MagneticButton>
              <MagneticButton as={Link} to="/patient"
                className="px-6 py-3 rounded-full text-slate-500 font-medium text-xs border border-white/[0.06] bg-white/[0.02] backdrop-blur-md hover:text-white hover:bg-white/[0.06] transition-all">
                Patient Search
              </MagneticButton>
              <MagneticButton as={Link} to="/lender"
                className="px-6 py-3 rounded-full text-slate-500 font-medium text-xs border border-white/[0.06] bg-white/[0.02] backdrop-blur-md hover:text-white hover:bg-white/[0.06] transition-all">
                Lender Dashboard
              </MagneticButton>
            </div>
          </div>
        </div>

        <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex items-center justify-between">
          <div className="text-slate-600 text-[10px] font-semibold tracking-widest uppercase">
            © 2026 CURIFY AI Navigator by Team Shaurya
          </div>
          <MagneticButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-white group">
            <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform" />
          </MagneticButton>
        </div>
      </footer>

      <style>{`
        @keyframes footer-breathe { 0% { transform: translate(-50%,-50%) scale(1); opacity:0.6 } 100% { transform: translate(-50%,-50%) scale(1.1); opacity:1 } }
        @keyframes footer-scroll-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes footer-heartbeat { 0%,100% { transform:scale(1) } 15%,45% { transform:scale(1.2) } 30% { transform:scale(1) } }
      `}</style>
    </div>
  );
}
