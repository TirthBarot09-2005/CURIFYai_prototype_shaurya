import React, { useEffect, useState } from 'react';

const generateStarBoxShadow = (count) => {
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    shadows.push(`${x}px ${y}px #FFF`);
  }
  return shadows.join(', ');
};

export function CosmicParallaxBg({ head, text, loop = true, className = '' }) {
  const [smallStars, setSmallStars] = useState('');
  const [mediumStars, setMediumStars] = useState('');
  const [bigStars, setBigStars] = useState('');
  const textParts = text.split(',').map(p => p.trim());

  useEffect(() => {
    setSmallStars(generateStarBoxShadow(700));
    setMediumStars(generateStarBoxShadow(200));
    setBigStars(generateStarBoxShadow(100));
    document.documentElement.style.setProperty('--animation-iteration', loop ? 'infinite' : '1');
  }, [loop]);

  return (
    <div className={`cosmic-parallax-container ${className}`}>
      <div style={{ boxShadow: smallStars }} className="cosmic-stars" />
      <div style={{ boxShadow: mediumStars }} className="cosmic-stars-medium" />
      <div style={{ boxShadow: bigStars }} className="cosmic-stars-large" />
      <div id="horizon"><div className="glow" /></div>
      <div id="earth" />
      <div id="cosmic-title">{head.toUpperCase()}</div>
      <div id="cosmic-subtitle">
        {textParts.map((part, i) => (
          <React.Fragment key={i}>
            <span className={`subtitle-part-${i + 1}`}>{part.toUpperCase()}</span>
            {i < textParts.length - 1 && ' '}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default CosmicParallaxBg;
