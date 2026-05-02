import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * Canvas-based sparkles/galaxy particle background.
 * No external deps — pure canvas + framer-motion.
 */
export default function SparklesBackground({
  particleCount = 120,
  colors = ['#22c55e', '#0ea5e9', '#a78bfa', '#ffffff'],
  maxSize = 2.5,
  minSize = 0.4,
  speed = 0.3,
  className = '',
  background = 'transparent',
}) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animFrame = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * 2;
    canvas.height = h * 2;

    particles.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w * 2,
      y: Math.random() * h * 2,
      size: minSize + Math.random() * (maxSize - minSize),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random(),
      alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.008),
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));
  }, [particleCount, colors, maxSize, minSize, speed]);

  useEffect(() => {
    init();
    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x * 2;
      const my = mouse.current.y * 2;

      for (const p of particles.current) {
        // Twinkle
        p.alpha += p.alphaDir;
        if (p.alpha <= 0.05 || p.alpha >= 1) p.alphaDir *= -1;
        p.alpha = Math.max(0.05, Math.min(1, p.alpha));

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Mouse repulse
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Glow
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.3;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Core
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [init]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      style={{ background }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-auto"
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => (mouse.current = { x: -9999, y: -9999 })}
      />
    </motion.div>
  );
}
