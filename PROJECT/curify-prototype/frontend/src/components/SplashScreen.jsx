import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=tagline, 2=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => onComplete(), 2600);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#020617]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Glow bg */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          {/* Spinner ring */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="relative w-24 h-24">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: '#22c55e', borderRightColor: 'rgba(34,197,94,0.3)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              {/* Inner counter-rotating ring */}
              <motion.div
                className="absolute inset-3 rounded-full border-2 border-transparent"
                style={{ borderBottomColor: '#0ea5e9', borderLeftColor: 'rgba(14,165,233,0.3)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                  <img src="/pokecut.png" alt="CURIFY" className="w-10 h-10 object-cover rounded-lg" />
              </div>
            </div>
          </motion.div>

          {/* Logo text */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="text-gradient">CURIFY</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium tracking-widest uppercase">AI Navigator</p>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.p
                className="mt-6 text-slate-400 text-base text-center max-w-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Turning clinical uncertainty into<br />
                <span className="text-emerald-400 font-medium">bankable financial certainty.</span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Loading dots */}
          <div className="flex gap-1.5 mt-8">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
