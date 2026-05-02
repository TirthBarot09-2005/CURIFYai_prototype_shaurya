import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=playing, 1=fadeout
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef(null);
  const hasCompleted = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setPhase(1);
    setTimeout(() => onComplete(), 800);
  }, [onComplete]);

  useEffect(() => {
    // Allow skip after 1.5s
    const skipTimer = setTimeout(() => setCanSkip(true), 1500);
    // Absolute fallback — never hang on splash
    const fallback = setTimeout(() => handleComplete(), 15000);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallback);
    };
  }, [handleComplete]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnd = () => {
    handleComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <AnimatePresence>
      {phase < 1 && (
        <motion.div
          className="splash-video-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            src="/STARTING.mp4"
            autoPlay
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onError={handleComplete}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Subtle vignette overlay for cinematic feel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom gradient for progress bar area */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '120px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              pointerEvents: 'none',
            }}
          />

          {/* Progress bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e, #0ea5e9)',
                width: `${progress}%`,
                boxShadow: '0 0 12px rgba(34,197,94,0.6)',
              }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Skip button — appears after 1.5s */}
          <AnimatePresence>
            {canSkip && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={handleSkip}
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  right: '32px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                Skip
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
