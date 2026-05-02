import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Shield, TrendingUp, Users, Clock,
  HeartPulse, IndianRupee, Building2, ChevronDown, Zap,
  CheckCircle2, Brain, BarChart3, MapPin, Star, Activity, ImageIcon,
  Play, Target, Crown, Hexagon, Triangle, Command
} from 'lucide-react';
import { ShuffleGrid, PulseBeams } from '../components/ui/index';
import SparklesBackground from '../components/ui/SparklesBackground';
import HolographicCard from '../components/ui/holographic-card';
import HowItWorksAccordion from '../components/ui/HowItWorksAccordion';
import LiveTerminal from '../components/ui/LiveTerminal';
import { AnimatedMarqueeHero } from '../components/ui/hero-marquee';
import { useAuth } from '../context/AuthContext';

const PULSE_BEAMS = [
  { path: 'M200 217H30C24 217 20 221 20 227V380', dots: [{ cx: 20, cy: 380, r: 5 }, { cx: 200, cy: 217, r: 5 }],
    gradientConfig: { initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' }, animate: { x1: ['0%','0%','200%'], x2: ['0%','0%','180%'], y1: ['80%','0%','0%'], y2: ['100%','20%','20%'] }, transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'linear', repeatDelay: 2, delay: 0.3 } } },
  { path: 'M430 217H600C606 217 610 213 610 207V50', dots: [{ cx: 610, cy: 50, r: 5 }, { cx: 430, cy: 217, r: 5 }],
    gradientConfig: { initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' }, animate: { x1: ['20%','100%','100%'], x2: ['0%','90%','90%'], y1: ['80%','80%','-20%'], y2: ['100%','100%','0%'] }, transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'linear', repeatDelay: 2, delay: 0.8 } } },
  { path: 'M310 260V320C310 326 306 330 300 330H120C114 330 110 334 110 340V410', dots: [{ cx: 110, cy: 410, r: 5 }, { cx: 310, cy: 260, r: 5 }],
    gradientConfig: { initial: { x1: '0%', x2: '0%', y1: '80%', y2: '100%' }, animate: { x1: ['20%','100%','100%'], x2: ['0%','90%','90%'], y1: ['80%','80%','-20%'], y2: ['100%','100%','0%'] }, transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'linear', repeatDelay: 2, delay: 1.2 } } },
  { path: 'M320 260V320C320 326 324 330 330 330H510C516 330 520 334 520 340V410', dots: [{ cx: 520, cy: 410, r: 5 }, { cx: 320, cy: 260, r: 5 }],
    gradientConfig: { initial: { x1: '40%', x2: '50%', y1: '160%', y2: '180%' }, animate: { x1: '0%', x2: '10%', y1: '-40%', y2: '-20%' }, transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'linear', repeatDelay: 2, delay: 0.5 } } },
];

/* ── Animated counter ── */
function Counter({ to, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1500, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(to);
    return spring.on('change', v => setDisplay(Math.round(v)));
  }, [inView, mv, spring, to]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Floating particle ── */
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full bg-emerald-500/20 pointer-events-none"
      style={style}
      animate={{ y: [-20, 20, -20], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const PARTICLES = [
  { width: 8, height: 8, top: '10%', left: '15%' },
  { width: 12, height: 12, top: '20%', right: '10%' },
  { width: 6, height: 6, top: '60%', left: '5%' },
  { width: 10, height: 10, bottom: '20%', right: '20%' },
  { width: 14, height: 14, top: '40%', left: '80%' },
  { width: 8, height: 8, bottom: '30%', left: '30%' },
];

const STATS = [
  { icon: Users, label: 'Target Users', value: 500, suffix: 'M+', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Clock, label: 'Underwriting Speed', value: 8, suffix: ' min', prefix: '', alt: '4hrs → ', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { icon: Building2, label: 'Partner Hospitals', value: 41, suffix: '+', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: TrendingUp, label: 'NPA Rate Addressed', value: 22, suffix: '%', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
];

const HOW_IT_WORKS = [
  { icon: HeartPulse, step: '01', title: 'Type Your Symptoms', desc: 'In any language — English, Hindi, Gujarati, Marathi, Hinglish. No medical terminology required.', color: 'emerald' },
  { icon: Brain, step: '02', title: 'AI Parses Your Query', desc: 'Gemini NLP maps to ICD-10 codes, extracts procedure, location, budget, comorbidities instantly.', color: 'sky' },
  { icon: MapPin, step: '03', title: 'Hospitals Ranked', desc: '5-factor algorithm: Clinical Relevance 35%, Accreditation 25%, Reputation 15%, Affordability 15%, Proximity 10%.', color: 'violet' },
  { icon: IndianRupee, step: '04', title: 'Cost Breakdown', desc: 'NHA/CGHS-anchored component costs: Surgery + Room + Diagnostics + Medicines + Contingency with min-max ranges.', color: 'amber' },
  { icon: BarChart3, step: '05', title: 'Lender Report Ready', desc: 'Confidence Score (0–1) auto-routes: Green ≥80% = Auto-Approve in 8 minutes. Eliminates 4-hour manual underwriting.', color: 'rose' },
];

const FEATURES = [
  { icon: Brain, title: 'ICD-10 Mapping', desc: 'Every query mapped to international clinical codes', tag: 'NLP' },
  { icon: MapPin, title: 'Geo-Adjusted Costs', desc: 'Metro 1.4×, Tier 2 1.0×, Tier 3 0.75×', tag: 'COST' },
  { icon: Shield, title: 'Comorbidity Uplifts', desc: 'Diabetes +18%, Cardiac +22%, Elderly +15%', tag: 'RISK' },
  { icon: Star, title: 'NABH/JCI Accreditation', desc: 'Hospital quality proxy for underwriting', tag: 'QUALITY' },
  { icon: Activity, title: 'Confidence Scoring', desc: '0–1 score drives Green/Yellow/Red workflow', tag: 'LENDER' },
  { icon: Zap, title: '8-Minute Processing', desc: 'From 4 hours to 8 minutes per loan', tag: 'SPEED' },
  { icon: CheckCircle2, title: 'Audit Trail', desc: 'Every report stored with full timestamp', tag: 'COMPLIANCE' },
  { icon: TrendingUp, title: 'Funding Gap Calc', desc: 'Auto loan recommendation from cost gap', tag: 'FINANCE' },
  { icon: Users, title: 'Multilingual Input', desc: 'English, Hindi, Hinglish, Gujarati, Marathi', tag: 'LANGUAGE' },
];

export default function LandingPage() {
  const { user, role } = useAuth();
  const heroRef = useRef(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="relative overflow-hidden">
      {/* ── Global backgrounds ── */}
      <div className="aurora-bg" />
      <div className="bg-glow bg-glow-pulse" />
      <div className="bg-grid fixed inset-0 pointer-events-none" />
      {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}

      {/* ═══════════════════════════════════════════════
          HERO SECTION (from prompt1 hero-section-2 + prompt5 sparkles)
      ═══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-20 pb-8 px-4">
        <SparklesBackground particleCount={150} className="z-0" />

        {/* Background image with gradient mask */}
        <div className="absolute inset-0 z-0 opacity-20" style={{
          backgroundImage: 'url(/curify_hero_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          maskImage: 'linear-gradient(180deg, transparent, black 0%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 70%, transparent)',
        }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-7 pt-8">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors">
                  <Star size={13} className="text-yellow-400 fill-yellow-400" />
                  AI-Powered Healthcare Navigation Platform
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.9]"
                style={{ maskImage: 'linear-gradient(180deg, black 0%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 80%, transparent)' }}
              >
                <span className="text-white">Turning Clinical</span><br />
                <span className="bg-gradient-to-br from-white via-white to-emerald-300 bg-clip-text text-transparent">Uncertainty Into</span><br />
                <span className="text-white">Bankable Certainty</span>
              </motion.h1>

              {/* Description */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="max-w-xl text-lg text-slate-400 leading-relaxed">
                One Query. Two Beneficiaries. Zero Guesswork. CURIFY AI delivers ranked hospital recommendations
                with NHA-anchored cost estimates for patients — and instant pre-underwriting scores for lenders.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4">
                <Link to={user ? (role === 'patient' ? '/patient' : '/auth/role') : '/auth'} className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]">
                  <HeartPulse size={18} /> I'm a Patient
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to={user ? (role === 'lender' ? '/lender/dashboard' : '/auth/role') : '/auth'} className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-colors">
                  <BarChart3 size={18} /> I'm a Lender
                </Link>
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN: Live Terminal Dashboard ── */}
            <div className="lg:col-span-5 lg:mt-8">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
                <LiveTerminal />
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center backdrop-blur-md">
                    <div className="text-lg font-bold text-white"><Counter to={41} suffix="+" /></div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Hospitals</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center backdrop-blur-md">
                    <div className="text-lg font-bold text-sky-400">8 min</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Speed</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center backdrop-blur-md">
                    <div className="text-lg font-bold text-emerald-400">98%</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Accuracy</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════
          STATS BAR (from prompt9 shuffle-grid pattern)
      ═══════════════════════════════════════════════ */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                className={`glass p-6 text-center border ${s.bg}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
              >
                <Icon size={24} className={`mx-auto mb-3 ${s.color}`} />
                <div className={`text-3xl font-extrabold mb-1 ${s.color}`}>
                  {s.alt && <span className="text-slate-500 line-through text-lg mr-1">{s.alt}</span>}
                  <Counter to={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — Interactive Image Accordion
      ═══════════════════════════════════════════════ */}
      <HowItWorksAccordion />

      {/* ═══════════════════════════════════════════════
          DUAL VALUE SPLIT (Patient vs Lender)
      ═══════════════════════════════════════════════ */}
      <section className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">One Query. Two Beneficiaries.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">The same AI engine serves patients and lenders simultaneously from a single query.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient */}
            <motion.div
              className="glass-strong p-8 border-emerald-500/15"
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <HeartPulse className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">For Patients</div>
                  <h3 className="text-xl font-bold text-white">Navigate Care</h3>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Type symptoms in any language',
                  'Get ranked hospitals with transparent scores',
                  'See component-level cost breakdown',
                  'Compare treatment pathways',
                  'Instant funding gap calculation',
                  'Multilingual: Hindi, Hinglish, English',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {/* Start Patient Search Button Removed */}
            </motion.div>

            {/* Lender */}
            <motion.div
              className="glass-strong p-8 border-sky-500/15"
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <BarChart3 className="text-sky-400" size={24} />
                </div>
                <div>
                  <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider">For Lenders</div>
                  <h3 className="text-xl font-bold text-white">Underwrite with Confidence</h3>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Confidence Score 0.00–1.00',
                  'Green ≥80% → Auto-Approve in 8 minutes',
                  'Component cost breakdown per procedure',
                  'Risk flags: diabetes, cardiac, elderly',
                  'ICU likelihood scoring',
                  'Full audit trail stored automatically',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={15} className="text-sky-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {/* Open Lender Dashboard Button Removed */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HEALTHCARE IMAGE GALLERY (ShuffleGrid from prompt9)
      ═══════════════════════════════════════════════ */}
      <section className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-10">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3 flex items-center gap-2"><ImageIcon size={13} /> Visual Intelligence</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powered by Real<br /><span className="text-gradient">Healthcare Data</span></h2>
            <p className="text-slate-400 mb-6 leading-relaxed">41+ hospitals across India with real-time procedure data, NHA-anchored pricing, and NABH accreditation verification.</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ n: '41+', l: 'Hospitals' }, { n: '5', l: 'Cities' }, { n: '15+', l: 'Procedures' }].map((s, i) => (
                <div key={i} className="glass p-3 text-center">
                  <div className="text-xl font-extrabold text-emerald-400">{s.n}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <ShuffleGrid />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES BENTO GRID (from ui-ux-pro-max bento pattern)
      ═══════════════════════════════════════════════ */}
      <section className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From ICD-10–based cost estimation to transparent audit logs — every feature is built for real-world reliability</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <HolographicCard key={i} className="p-5 cursor-default">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-pulse-ring">
                        <Icon size={20} className="text-emerald-400" />
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/[0.04] text-slate-500 border border-white/[0.06] tracking-widest">{feat.tag}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </motion.div>
                </HolographicCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ARCHITECTURE with PulseBeams (from prompt8)
      ═══════════════════════════════════════════════ */}
      <section className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-white mb-4">3-Layer Architecture</h2>
            <p className="text-slate-400">Intake → Intelligence → Output — with animated data flow</p>
          </motion.div>
          <PulseBeams beams={PULSE_BEAMS} width={630} height={434} className="glass-strong rounded-2xl min-h-[460px]">
            <div className="grid grid-cols-3 gap-4 w-[580px] relative z-10">
              {[
                { title: 'Layer 1', sub: 'Intake', tech: 'React 18 + Vite', desc: 'Patient & Lender forms', color: 'from-emerald-500/20 to-emerald-500/0', border: 'border-emerald-500/20' },
                { title: 'Layer 2', sub: 'Intelligence', tech: 'FastAPI + Gemini AI', desc: 'NLP, ICD-10, Cost, Ranking', color: 'from-sky-500/20 to-sky-500/0', border: 'border-sky-500/20' },
                { title: 'Layer 3', sub: 'Output', tech: 'React + REST JSON', desc: 'Cards & Reports', color: 'from-violet-500/20 to-violet-500/0', border: 'border-violet-500/20' },
              ].map((l, i) => (
                <motion.div key={i} className={`p-5 rounded-xl bg-gradient-to-b ${l.color} border ${l.border} text-center backdrop-blur-md`}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{l.title}</div>
                  <div className="text-base font-bold text-white mb-2">{l.sub}</div>
                  <div className="text-xs font-medium text-slate-300 mb-2 font-mono">{l.tech}</div>
                  <div className="text-xs text-slate-400">{l.desc}</div>
                </motion.div>
              ))}
            </div>
          </PulseBeams>
        </div>
      </section>
    </div>
  );
}
