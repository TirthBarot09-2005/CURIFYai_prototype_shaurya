import React, {
  forwardRef, useEffect, useImperativeHandle,
  useLayoutEffect, useMemo, useRef, useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const FullScreenScrollFX = forwardRef(({
  sections, className, style,
  fontFamily = '"Montserrat", system-ui, sans-serif',
  header, footer, gap = 1, gridPaddingX = 2,
  showProgress = true, durations = { change: 0.7, snap: 800 },
  bgTransition = "fade", parallaxAmount = 4,
  currentIndex, onIndexChange, initialIndex = 0,
  colors = { text: "rgba(245,245,245,0.92)", overlay: "rgba(0,0,0,0.45)", pageBg: "#020617", stageBg: "#000" },
  apiRef, ariaLabel = "Full screen scroll slideshow",
}, ref) => {
  const total = sections.length;
  const [localIndex, setLocalIndex] = useState(clamp(initialIndex, 0, Math.max(0, total - 1)));
  const isControlled = typeof currentIndex === "number";
  const index = isControlled ? clamp(currentIndex, 0, Math.max(0, total - 1)) : localIndex;

  const rootRef = useRef(null);
  const fixedRef = useRef(null);
  const fixedSectionRef = useRef(null);
  const bgRefs = useRef([]);
  const wordRefs = useRef([]);
  const leftTrackRef = useRef(null);
  const rightTrackRef = useRef(null);
  const leftItemRefs = useRef([]);
  const rightItemRefs = useRef([]);
  const progressFillRef = useRef(null);
  const currentNumberRef = useRef(null);
  const stRef = useRef(null);
  const lastIndexRef = useRef(index);
  const isAnimatingRef = useRef(false);
  const isSnappingRef = useRef(false);
  const sectionTopRef = useRef([]);

  const tempWordBucket = useRef([]);
  const splitWords = (text) => {
    const words = text.split(/\s+/).filter(Boolean);
    return words.map((w, i) => (
      <span className="fx-word-mask" key={i}>
        <span className="fx-word" ref={(el) => el && tempWordBucket.current.push(el)}>{w}</span>
        {i < words.length - 1 ? " " : null}
      </span>
    ));
  };
  const WordsCollector = ({ onReady }) => { useEffect(() => onReady(), []); return null; };

  const computePositions = () => {
    const el = fixedSectionRef.current;
    if (!el) return;
    const top = el.offsetTop;
    const h = el.offsetHeight;
    const arr = [];
    for (let i = 0; i < total; i++) arr.push(top + (h * i) / total);
    sectionTopRef.current = arr;
  };

  const measureRAF = (fn) => { if (typeof window !== "undefined") requestAnimationFrame(() => requestAnimationFrame(fn)); };

  const measureAndCenterLists = (toIndex = index, animate = true) => {
    const centerTrack = (container, items, trackRef) => {
      if (!container || items.length === 0 || !trackRef.current) return;
      const first = items[0];
      const second = items[1];
      const contRect = container.getBoundingClientRect();
      let rowH = first.getBoundingClientRect().height;
      if (second) rowH = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
      const targetY = contRect.height / 2 - rowH / 2 - toIndex * rowH;
      if (animate) gsap.to(trackRef.current, { y: targetY, duration: (durations.change ?? 0.7) * 0.9, ease: "power3.out" });
      else gsap.set(trackRef.current, { y: targetY });
    };
    measureRAF(() => measureRAF(() => {
      centerTrack(leftTrackRef.current?.parentElement, leftItemRefs.current, leftTrackRef);
      centerTrack(rightTrackRef.current?.parentElement, rightItemRefs.current, rightTrackRef);
    }));
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const fixed = fixedRef.current;
    const fs = fixedSectionRef.current;
    if (!fixed || !fs || total === 0) return;

    gsap.set(bgRefs.current, { opacity: 0, scale: 1.04, yPercent: 0 });
    if (bgRefs.current[0]) gsap.set(bgRefs.current[0], { opacity: 1, scale: 1 });

    wordRefs.current.forEach((words, sIdx) => {
      if (!words) return;
      words.forEach((w) => { gsap.set(w, { yPercent: sIdx === index ? 0 : 100, opacity: sIdx === index ? 1 : 0 }); });
    });

    computePositions();
    measureAndCenterLists(index, false);

    const st = ScrollTrigger.create({
      trigger: fs, start: "top top", end: "bottom bottom", pin: fixed, pinSpacing: true,
      onUpdate: (self) => {
        if (isSnappingRef.current) return;
        const prog = self.progress;
        const target = Math.min(total - 1, Math.floor(prog * total));
        if (target !== lastIndexRef.current && !isAnimatingRef.current) {
          const next = lastIndexRef.current + (target > lastIndexRef.current ? 1 : -1);
          goTo(next, false);
        }
        if (progressFillRef.current) progressFillRef.current.style.width = `${(lastIndexRef.current / (total - 1 || 1)) * 100}%`;
      },
    });
    stRef.current = st;

    const ro = new ResizeObserver(() => { computePositions(); measureAndCenterLists(lastIndexRef.current, false); ScrollTrigger.refresh(); });
    ro.observe(fs);
    return () => { ro.disconnect(); st.kill(); stRef.current = null; };
  }, [total]);

  const changeSection = (to) => {
    if (to === lastIndexRef.current || isAnimatingRef.current) return;
    const from = lastIndexRef.current;
    const down = to > from;
    isAnimatingRef.current = true;
    if (!isControlled) setLocalIndex(to);
    onIndexChange?.(to);

    if (currentNumberRef.current) currentNumberRef.current.textContent = String(to + 1).padStart(2, "0");
    if (progressFillRef.current) progressFillRef.current.style.width = `${(to / (total - 1 || 1)) * 100}%`;

    const D = durations.change ?? 0.7;
    const outWords = wordRefs.current[from] || [];
    const inWords = wordRefs.current[to] || [];
    if (outWords.length) gsap.to(outWords, { yPercent: down ? -100 : 100, opacity: 0, duration: D * 0.6, stagger: down ? 0.03 : -0.03, ease: "power3.out" });
    if (inWords.length) { gsap.set(inWords, { yPercent: down ? 100 : -100, opacity: 0 }); gsap.to(inWords, { yPercent: 0, opacity: 1, duration: D, stagger: down ? 0.05 : -0.05, ease: "power3.out" }); }

    const prevBg = bgRefs.current[from];
    const newBg = bgRefs.current[to];
    if (newBg) { gsap.set(newBg, { opacity: 0, scale: 1.04, yPercent: down ? 1 : -1 }); gsap.to(newBg, { opacity: 1, scale: 1, yPercent: 0, duration: D, ease: "power2.out" }); }
    if (prevBg) gsap.to(prevBg, { opacity: 0, yPercent: down ? -parallaxAmount : parallaxAmount, duration: D, ease: "power2.out" });

    measureAndCenterLists(to, true);
    leftItemRefs.current.forEach((el, i) => { el.classList.toggle("active", i === to); gsap.to(el, { opacity: i === to ? 1 : 0.35, x: i === to ? 10 : 0, duration: D * 0.6, ease: "power3.out" }); });
    rightItemRefs.current.forEach((el, i) => { el.classList.toggle("active", i === to); gsap.to(el, { opacity: i === to ? 1 : 0.35, x: i === to ? -10 : 0, duration: D * 0.6, ease: "power3.out" }); });
    gsap.delayedCall(D, () => { lastIndexRef.current = to; isAnimatingRef.current = false; });
  };

  const goTo = (to, withScroll = true) => {
    const clamped = clamp(to, 0, total - 1);
    isSnappingRef.current = true;
    changeSection(clamped);
    if (withScroll && typeof window !== "undefined") {
      const pos = sectionTopRef.current[clamped];
      window.scrollTo({ top: pos, behavior: "smooth" });
      setTimeout(() => (isSnappingRef.current = false), durations.snap ?? 800);
    } else setTimeout(() => (isSnappingRef.current = false), 10);
  };

  useImperativeHandle(apiRef, () => ({ next: () => goTo(index + 1), prev: () => goTo(index - 1), goTo, getIndex: () => index, refresh: () => ScrollTrigger.refresh() }));

  useEffect(() => {
    leftItemRefs.current.forEach((el, i) => { gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.5, delay: i * 0.06, ease: "power3.out" }); });
    rightItemRefs.current.forEach((el, i) => { gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.5, delay: 0.2 + i * 0.06, ease: "power3.out" }); });
    measureAndCenterLists(index, false);
  }, []);

  return (
    <div ref={(node) => { rootRef.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }}
      className={`fx ${className || ''}`} style={{ '--fx-font': fontFamily, '--fx-text': colors.text, '--fx-overlay': colors.overlay, '--fx-page-bg': colors.pageBg, '--fx-stage-bg': colors.stageBg, '--fx-gap': `${gap}rem`, '--fx-grid-px': `${gridPaddingX}rem`, '--fx-row-gap': '10px', ...style }}
      aria-label={ariaLabel}>

      <div className="fx-scroll">
        <div className="fx-fixed-section" ref={fixedSectionRef} style={{ height: `${Math.max(1, total + 1)}00vh`, position: 'relative' }}>
          <div className="fx-fixed" ref={fixedRef} style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--fx-page-bg)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--fx-stage-bg)', zIndex: 1 }}>
              {sections.map((s, i) => (
                <div key={s.id ?? i} style={{ position: 'absolute', inset: 0 }}>
                  <img ref={(el) => el && (bgRefs.current[i] = el)} src={s.background} alt="" style={{ position: 'absolute', inset: '-10% 0', width: '100%', height: '120%', objectFit: 'cover', filter: 'brightness(0.7)', opacity: 0, willChange: 'transform, opacity' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'var(--fx-overlay)' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--fx-gap)', padding: '0 var(--fx-grid-px)', position: 'relative', height: '100%', zIndex: 2 }}>
              {header && <div style={{ gridColumn: '1 / 13', alignSelf: 'start', paddingTop: '6vh', fontSize: 'clamp(1.5rem, 5vw, 4rem)', lineHeight: 0.9, textAlign: 'center', color: 'var(--fx-text)', fontWeight: 900 }}>{header}</div>}

              <div style={{ gridColumn: '1 / 13', position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', alignItems: 'center', height: '100%', padding: '0 var(--fx-grid-px)' }}>
                <div style={{ height: '60vh', overflow: 'hidden', display: 'grid', alignContent: 'center', justifyItems: 'start' }}>
                  <div ref={leftTrackRef} style={{ willChange: 'transform' }}>
                    {sections.map((s, i) => (
                      <div key={`L-${i}`} ref={(el) => el && (leftItemRefs.current[i] = el)} onClick={() => goTo(i)}
                        style={{ color: 'var(--fx-text)', fontWeight: 800, lineHeight: 1, margin: '5px 0', opacity: 0.35, fontSize: 'clamp(0.85rem, 2vw, 1.5rem)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '-0.01em', position: 'relative', transition: 'opacity 0.3s' }}>
                        {s.leftLabel}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', height: '60vh', overflow: 'hidden' }}>
                  {sections.map((s, sIdx) => {
                    tempWordBucket.current = [];
                    const isString = typeof s.title === "string";
                    return (
                      <div key={`C-${sIdx}`} style={{ position: 'absolute', opacity: sIdx === index ? 1 : 0, visibility: sIdx === index ? 'visible' : 'hidden' }}>
                        <h3 style={{ margin: 0, color: 'var(--fx-text)', fontWeight: 900, letterSpacing: '-0.01em', fontSize: 'clamp(2rem, 7vw, 5.5rem)', textTransform: 'uppercase' }}>
                          {isString ? splitWords(s.title) : s.title}
                        </h3>
                        <WordsCollector onReady={() => { if (tempWordBucket.current.length) wordRefs.current[sIdx] = [...tempWordBucket.current]; tempWordBucket.current = []; }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: '60vh', overflow: 'hidden', display: 'grid', alignContent: 'center', justifyItems: 'end' }}>
                  <div ref={rightTrackRef} style={{ willChange: 'transform' }}>
                    {sections.map((s, i) => (
                      <div key={`R-${i}`} ref={(el) => el && (rightItemRefs.current[i] = el)} onClick={() => goTo(i)}
                        style={{ color: 'var(--fx-text)', fontWeight: 800, lineHeight: 1, margin: '5px 0', opacity: 0.35, fontSize: 'clamp(0.85rem, 2vw, 1.5rem)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '-0.01em', textAlign: 'right', position: 'relative', transition: 'opacity 0.3s' }}>
                        {s.rightLabel}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: '1 / 13', alignSelf: 'end', paddingBottom: '5vh', textAlign: 'center' }}>
                {footer}
                {showProgress && (
                  <div style={{ width: 200, height: 2, margin: '1rem auto 0', background: 'rgba(245,245,245,0.28)', position: 'relative' }}>
                    <div ref={progressFillRef} style={{ position: 'absolute', inset: '0 auto 0 0', width: '0%', background: 'var(--fx-text)', height: '100%', transition: 'width 0.3s ease' }} />
                    <div style={{ position: 'absolute', inset: 'auto 0 100% 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fx-text)' }}>
                      <span ref={currentNumberRef}>{String(index + 1).padStart(2, "0")}</span>
                      <span>{String(total).padStart(2, "0")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fx { width:100%; overflow:hidden; font-family:var(--fx-font); text-transform:uppercase; letter-spacing:-0.02em; }
        .fx-word-mask { display:inline-block; overflow:hidden; vertical-align:middle; }
        .fx-word { display:inline-block; vertical-align:middle; }
      `}</style>
    </div>
  );
});

FullScreenScrollFX.displayName = "FullScreenScrollFX";
export { FullScreenScrollFX };
