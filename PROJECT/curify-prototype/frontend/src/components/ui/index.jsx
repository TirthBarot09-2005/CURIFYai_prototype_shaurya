import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

/* ═══════════════════════════════════════════════
   GlowingSearchBar (from prompt6 — animated-glowing-search-bar)
   ═══════════════════════════════════════════════ */
export function GlowingSearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative flex items-center justify-center w-full ${className}`}>
      <div className="relative flex items-center justify-center group w-full max-w-2xl">
        <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-xl blur-[3px]
          before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat
          before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
          before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#22c55e_60%,#000_87%)]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]" />
        <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-xl blur-[0.5px]
          before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat
          before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
          before:bg-[conic-gradient(#0a0a0a,#402fb5_5%,#0a0a0a_14%,#0a0a0a_50%,#22c55e_60%,#0a0a0a_64%)]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-110deg] group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]" />
        <div className="relative w-full">
          <input value={value} onChange={onChange} placeholder={placeholder} type="text"
            className="bg-[#010201] border-none w-full h-[60px] rounded-xl text-white px-14 text-base focus:outline-none placeholder-slate-500" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" stroke="url(#sg)">
              <circle r="8" cy="11" cx="11" /><line y2="16.65" y1="22" x2="16.65" x1="22" />
              <defs><linearGradient gradientTransform="rotate(50)" id="sg"><stop stopColor="#22c55e" offset="0%" /><stop stopColor="#0ea5e9" offset="100%" /></linearGradient></defs>
            </svg>
          </div>
          <div className="pointer-events-none w-[30px] h-[20px] absolute bg-emerald-600 top-[10px] left-[5px] blur-2xl opacity-60 transition-all duration-[2000ms] group-hover:opacity-0" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   InputWithTags (from prompt16)
   ═══════════════════════════════════════════════ */
function TagPill({ text, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: -8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.8, y: -8, filter: 'blur(8px)' }}
      transition={{ duration: 0.35, ease: 'easeOut', type: 'spring' }}
      className="bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 text-emerald-300 backdrop-blur-sm"
    >
      {text}
      <button onClick={onRemove} className="hover:bg-white/10 rounded-full p-0.5 transition-colors cursor-pointer">
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

export function InputWithTags({ placeholder = "Type and press Enter...", onChange, limit = 10, initialTags = [] }) {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      if (tags.length < limit && !tags.includes(inputValue.trim())) {
        const newTags = [...tags, inputValue.trim()];
        setTags(newTags);
        setInputValue('');
        if (onChange) onChange(newTags.join(', '));
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      if (onChange) onChange(newTags.join(', '));
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.input type="text" value={inputValue}
        onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
        placeholder={tags.length >= limit ? `Max ${limit} tags` : placeholder}
        disabled={tags.length >= limit} whileHover={{ scale: 1.005 }}
        className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {tags.map((tag, i) => <TagPill key={tag + i} text={tag} onRemove={() => {
              const newTags = tags.filter((_, idx) => idx !== i);
              setTags(newTags);
              if (onChange) onChange(newTags.join(', '));
            }} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PulseBeams (from prompt8)
   ═══════════════════════════════════════════════ */
export function PulseBeams({ children, beams, width = 858, height = 434, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          {beams.map((beam, i) => (
            <g key={i}>
              <path d={beam.path} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <path d={beam.path} stroke={`url(#grad${i})`} strokeWidth="2" strokeLinecap="round" />
              {beam.dots?.map((pt, pi) => (
                <circle key={pi} cx={pt.cx} cy={pt.cy} r={pt.r} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" />
              ))}
            </g>
          ))}
          <defs>
            {beams.map((beam, i) => (
              <motion.linearGradient key={i} id={`grad${i}`} gradientUnits="userSpaceOnUse"
                initial={beam.gradientConfig.initial} animate={beam.gradientConfig.animate} transition={beam.gradientConfig.transition}>
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                <stop offset="20%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </motion.linearGradient>
            ))}
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ShuffleGrid (from prompt9) — healthcare images
   ═══════════════════════════════════════════════ */
const HEALTHCARE_IMAGES = [
  { id: 1, src: '/hero_bg.png' },
  { id: 2, src: '/abstract_health.png' },
  { id: 3, src: '/hospital_placeholder.png' },
  { id: 4, src: '/lender_bg.png' },
  { id: 5, src: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80' },
  { id: 6, src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80' },
  { id: 7, src: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&q=80' },
  { id: 8, src: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&q=80' },
  { id: 9, src: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&q=80' },
  { id: 10, src: 'https://images.unsplash.com/photo-1626315869436-d6781ba69d6e?w=400&q=80' },
  { id: 11, src: 'https://images.unsplash.com/photo-1588776814546-1ffbb3cd01b7?w=400&q=80' },
  { id: 12, src: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80' },
  { id: 13, src: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80' },
  { id: 14, src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80' },
  { id: 15, src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80' },
  { id: 16, src: 'https://images.unsplash.com/photo-1485841938031-1bf81239b815?w=400&q=80' },
];

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSquares() {
  return shuffleArr(HEALTHCARE_IMAGES).map((img) => (
    <motion.div key={img.id} layout transition={{ duration: 1.5, type: 'spring' }}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ backgroundImage: `url(${img.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  ));
}

export function ShuffleGrid() {
  const timerRef = useRef(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    const loop = () => { setSquares(generateSquares()); timerRef.current = setTimeout(loop, 3500); };
    loop();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[400px] gap-1 rounded-xl overflow-hidden">{squares}</div>
  );
}

/* ═══════════════════════════════════════════════
   Tooltip (from peompt17)
   ═══════════════════════════════════════════════ */
export function Tooltip({ children, content, side = 'top' }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={6}
            className="z-50 px-3 py-1.5 text-xs font-medium bg-slate-900 text-slate-200 border border-white/10 rounded-lg shadow-xl backdrop-blur-xl animate-fade">
            {content}
            <TooltipPrimitive.Arrow className="fill-slate-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
