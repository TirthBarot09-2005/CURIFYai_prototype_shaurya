import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUERIES = [
  {
    query: 'chest pain near nagpur',
    nlp: 'Gemini 2.0',
    icd: 'I20.9',
    procedure: 'Angioplasty',
    hospitals: '7 found',
    algo: 'ranked by 5-factor algo',
    cost: '₹1.2L – ₹4.8L',
    confidence: '0.94',
  },
  {
    query: 'ghutne mein dard jaipur',
    nlp: 'Gemini 2.0',
    icd: 'M17.1',
    procedure: 'Knee Replacement',
    hospitals: '5 found',
    algo: 'ranked by 5-factor algo',
    cost: '₹1.8L – ₹5.2L',
    confidence: '0.91',
  },
  {
    query: 'cataract surgery mumbai budget 50000',
    nlp: 'Gemini 2.0',
    icd: 'H25.9',
    procedure: 'Cataract Surgery',
    hospitals: '12 found',
    algo: 'ranked by 5-factor algo',
    cost: '₹25K – ₹80K',
    confidence: '0.97',
  },
  {
    query: 'bypass surgery delhi mein',
    nlp: 'Gemini 2.0',
    icd: 'I25.1',
    procedure: 'Bypass Surgery (CABG)',
    hospitals: '9 found',
    algo: 'ranked by 5-factor algo',
    cost: '₹2.5L – ₹8L',
    confidence: '0.88',
  },
];

export default function LiveTerminal() {
  const [queryIdx, setQueryIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(0); // how many result lines visible
  const timerRef = useRef(null);

  const current = QUERIES[queryIdx];

  // Typing effect
  useEffect(() => {
    setTypedText('');
    setShowResults(false);
    setResultsVisible(0);

    let charIdx = 0;
    const fullText = current.query;

    timerRef.current = setInterval(() => {
      charIdx++;
      setTypedText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) {
        clearInterval(timerRef.current);
        // Show results after typing completes
        setTimeout(() => {
          setShowResults(true);
          // Reveal result lines one by one
          let lineIdx = 0;
          const lineTimer = setInterval(() => {
            lineIdx++;
            setResultsVisible(lineIdx);
            if (lineIdx >= 5) {
              clearInterval(lineTimer);
              // Move to next query after pause
              setTimeout(() => {
                setQueryIdx(prev => (prev + 1) % QUERIES.length);
              }, 3000);
            }
          }, 300);
        }, 400);
      }
    }, 60);

    return () => clearInterval(timerRef.current);
  }, [queryIdx]);

  const resultLines = [
    { label: 'NLP', value: <><span className="text-sky-400">{current.nlp}</span> → ICD-10: <span className="text-white">{current.icd}</span></> },
    { label: 'Procedure', value: <span className="text-white">{current.procedure}</span> },
    { label: 'Hospitals', value: <><span className="text-emerald-400">{current.hospitals}</span> → <span className="text-white">{current.algo}</span></> },
    { label: 'Cost Range', value: <><span className="text-amber-300">{current.cost}</span> <span className="text-slate-600">(NHA anchored)</span></> },
    { label: 'Confidence', value: <span className="text-emerald-400 font-bold">{current.confidence}</span> },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-3 text-[11px] font-mono text-slate-500">curify-ai-engine — live</span>
        <span className="ml-auto relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-xs space-y-3 min-h-[220px]">
        {/* Query line with typing effect */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">❯</span>
          <span className="text-slate-400">curify.search(</span>
          <span className="text-amber-300">"{typedText}"</span>
          <motion.span
            className="inline-block w-[7px] h-4 bg-emerald-400 ml-0.5"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <span className="text-slate-400">)</span>
        </div>

        {/* Results appearing line by line */}
        <AnimatePresence mode="wait">
          {showResults && (
            <motion.div
              key={queryIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-4 space-y-1.5 text-slate-500"
            >
              {resultLines.map((line, i) => (
                i < resultsVisible && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    └─ {line.label}: {line.value}
                  </motion.div>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
