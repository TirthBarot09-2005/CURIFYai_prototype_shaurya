import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ActionButton = ({ children, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg transition-colors hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
  >
    {children}
  </motion.button>
);

export const AnimatedMarqueeHero = ({
  tagline,
  title,
  description,
  ctaText,
  images,
  className,
  onCtaClick,
}) => {
  const FADE_IN = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  };

  const duplicatedImages = [...images, ...images];

  return (
    <section className={cn(
      "relative w-full h-screen overflow-hidden bg-[#070B14] flex flex-col items-center justify-center text-center px-4",
      className
    )}>
      <div className="z-10 flex flex-col items-center">
        <motion.div initial="hidden" animate="show" variants={FADE_IN}
          className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 backdrop-blur-sm">
          {tagline}
        </motion.div>

        <motion.h1 initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
          {typeof title === 'string' ? (
            title.split(" ").map((word, i) => (
              <motion.span key={i} variants={FADE_IN} className="inline-block">{word}&nbsp;</motion.span>
            ))
          ) : title}
        </motion.h1>

        <motion.p initial="hidden" animate="show" variants={FADE_IN} transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-slate-400">
          {description}
        </motion.p>

        <motion.div initial="hidden" animate="show" variants={FADE_IN} transition={{ delay: 0.6 }}>
          <ActionButton onClick={onCtaClick}>{ctaText}</ActionButton>
        </motion.div>
      </div>

      {/* Animated Image Marquee */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
        <motion.div className="flex gap-4"
          animate={{ x: ["-100%", "0%"], transition: { ease: "linear", duration: 40, repeat: Infinity } }}>
          {duplicatedImages.map((src, index) => (
            <div key={index} className="relative aspect-[3/4] h-48 md:h-64 flex-shrink-0"
              style={{ rotate: `${(index % 2 === 0 ? -2 : 5)}deg` }}>
              <img src={src} alt={`Healthcare ${index + 1}`}
                className="w-full h-full object-cover rounded-2xl shadow-md border border-white/10" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
