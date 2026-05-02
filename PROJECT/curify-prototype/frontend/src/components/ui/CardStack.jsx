import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function wrapIndex(n, len) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i, active, len, loop) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export default function CardStack({
  items = [],
  initialIndex = 0,
  maxVisible = 7,
  cardWidth = 480,
  cardHeight = 300,
  overlap = 0.48,
  spreadDeg = 48,
  depthPx = 140,
  tiltXDeg = 12,
  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,
  loop = true,
  autoAdvance = true,
  intervalMs = 3000,
  pauseOnHover = true,
  showDots = true,
}) {
  const len = items.length;
  const [active, setActive] = useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = useState(false);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const next = useCallback(() => {
    if (!len) return;
    setActive(a => wrapIndex(a + 1, len));
  }, [len]);

  const prev = useCallback(() => {
    if (!len) return;
    setActive(a => wrapIndex(a - 1, len));
  }, [len]);

  useEffect(() => {
    if (!autoAdvance || !len) return;
    if (pauseOnHover && hovering) return;
    const id = setInterval(() => next(), Math.max(700, intervalMs));
    return () => clearInterval(id);
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, len, next]);

  if (!len) return null;

  return (
    <div className="w-full" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div className="relative w-full" style={{ height: Math.max(380, cardHeight + 80) }} tabIndex={0}
        onKeyDown={e => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); }}>
        
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 w-[76%] rounded-full bg-emerald-500/[0.03] blur-3xl" />

        <div className="absolute inset-0 flex items-end justify-center" style={{ perspective: '1100px' }}>
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              if (abs > maxOffset) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10;
              const z = -abs * depthPx;
              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              return (
                <motion.div key={item.id} className={`absolute bottom-0 rounded-2xl border-4 ${isActive ? 'border-emerald-500/20' : 'border-white/10'} overflow-hidden shadow-xl select-none ${isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{ width: cardWidth, height: cardHeight, zIndex, transformStyle: 'preserve-3d' }}
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  drag={isActive ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 120 || info.velocity.x > 650) prev();
                    else if (info.offset.x < -120 || info.velocity.x < -650) next();
                  }}
                  onClick={() => setActive(i)}>
                  <div className="h-full w-full" style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d' }}>
                    <div className="relative h-full w-full">
                      {item.imageSrc ? (
                        <img src={item.imageSrc} alt={item.title} className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">No image</div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="relative z-10 absolute bottom-0 left-0 right-0 p-5">
                        {item.tag && <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">{item.tag}</span>}
                        <div className="text-lg font-bold text-white truncate">{item.title}</div>
                        {item.description && <div className="mt-1 text-sm text-white/70 line-clamp-2">{item.description}</div>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {showDots && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button key={idx} onClick={() => setActive(idx)}
              className={`rounded-full transition-all duration-300 ${idx === active ? 'h-2 w-6 bg-emerald-400' : 'h-2 w-2 bg-white/20 hover:bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
