import { motion } from 'framer-motion';
import { CheckCircle2, Award, Heart, Users, Globe, Shield, BookOpen, BarChart3, HeartPulse, Brain, Zap, IndianRupee, MapPin } from 'lucide-react';
import { CosmicParallaxBg } from '../components/ui/CosmicParallaxBg';
import HolographicCard from '../components/ui/holographic-card';
import VerticalImageStack from '../components/ui/VerticalImageStack';

const COMPLIANCE = [
  { icon: Shield, title: 'DPDP Act 2023', desc: 'Data Privacy & Digital Protection compliance for all patient data handling.' },
  { icon: BookOpen, title: 'RBI Digital Lending', desc: 'Reserve Bank of India digital lending guidelines for pre-underwriting outputs.' },
  { icon: Award, title: 'NMC Ethical AI', desc: 'National Medical Commission AI boundary enforcement — no diagnosis language.' },
  { icon: CheckCircle2, title: 'NHA/CGHS Anchored', desc: 'All cost estimates anchored to Ministry of Health published government rates.' },
];

export default function AboutPage() {
  return (
    <div className="relative">
      {/* ── Cosmic Parallax Hero ── */}
      <CosmicParallaxBg
        head="CURIFY AI"
        text="Navigate Care, Know Cost, Borrow Smart"
        loop={true}
      />

      {/* Gradient transition from cosmic → content */}
      <div className="relative z-[5] -mt-32 h-32 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent, #020617)',
      }} />

      {/* ── Content below the cosmic hero ── */}
      <div className="relative z-10">
        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-12 space-y-14">

          {/* ── About Hero Text ── */}
          <motion.div className="text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6">
              <Heart size={13} /> Built by Team Shaurya
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              About <span className="text-gradient">CURIFY AI Navigator</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
              A dual-intelligence platform connecting patient intent to clinical pathway to provider selection to cost estimation
              — simultaneously generating underwriting-grade financial intelligence for lenders.
            </p>
          </motion.div>

          {/* ── Problem Statement ── */}
          <div>
            <motion.h2 className="text-2xl font-bold text-white mb-8 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              The Problem We Solve
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Users, title: 'Provider Discovery Failure', desc: 'Patients search blindly — 47 unranked results, no way to distinguish a specialist. They travel 200+ km for procedures available 15 km away.', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                { icon: Globe, title: 'Complete Cost Opacity', desc: 'Same knee replacement: ₹80K at govt hospital, ₹3.5L at premium private — same city. Neither publishes rates proactively.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                { icon: BarChart3, title: 'Lending Inefficiency', desc: '1 in 5 healthcare loans becomes NPA — not from default, but wrong loan amount from day one. Underwriting takes 4 hours per file.', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
              ].map((p, i) => {
                const Icon = p.icon;
                return (
                  <HolographicCard key={i}>
                    <motion.div className="p-6"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                      <div className={`w-10 h-10 rounded-lg border ${p.color} flex items-center justify-center mb-4`}>
                        <Icon size={18} />
                      </div>
                      <h3 className="font-bold text-white mb-2">{p.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                    </motion.div>
                  </HolographicCard>
                );
              })}
            </div>
          </div>

          {/* ── How It Works — Vertical Image Stack ── */}
          <VerticalImageStack />

          {/* ── Compliance ── */}
          <div>
            <motion.h2 className="text-2xl font-bold text-white mb-8 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Regulatory Compliance
            </motion.h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {COMPLIANCE.map((c, i) => {
                const Icon = c.icon;
                return (
                  <HolographicCard key={i}>
                    <motion.div className="p-5 flex gap-4"
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-1">{c.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
                      </div>
                    </motion.div>
                  </HolographicCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
