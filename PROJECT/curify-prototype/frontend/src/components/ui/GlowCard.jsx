import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * GlowCard — follows the cursor and produces a glowing spotlight border on hover.
 * Pure CSS variables + framer-motion, no external deps.
 */
export default function GlowCard({
  children,
  className = '',
  glowColor = '160, 100%, 50%',   // HSL values for emerald
  borderRadius = '1rem',
}) {
  const cardRef = useRef(null);

  const handleMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--gy', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`glow-card-wrapper ${className}`}
      onMouseMove={handleMove}
      style={{
        '--glow-color': glowColor,
        '--radius': borderRadius,
        position: 'relative',
        borderRadius,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Spotlight gradient overlay */}
      <div
        className="glow-card-spotlight"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          background: `radial-gradient(600px circle at var(--gx, 50%) var(--gy, 50%), hsla(${glowColor} / 0.15), transparent 40%)`,
        }}
      />
      {/* Glowing border */}
      <div
        className="glow-card-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          border: `1px solid transparent`,
          background: `radial-gradient(400px circle at var(--gx, 50%) var(--gy, 50%), hsla(${glowColor} / 0.6), transparent 40%) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}
