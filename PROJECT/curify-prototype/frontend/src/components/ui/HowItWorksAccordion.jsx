import React, { useState } from 'react';
import { HeartPulse, Brain, MapPin, IndianRupee, BarChart3 } from 'lucide-react';

const accordionItems = [
  {
    id: 1,
    title: 'Type Your Symptoms',
    desc: 'In any language — English, Hindi, Hinglish',
    icon: HeartPulse,
    imageUrl: '/hero_bg.png',
  },
  {
    id: 2,
    title: 'AI Parses Your Query',
    desc: 'Gemini NLP maps to ICD-10 codes instantly',
    icon: Brain,
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
  },
  {
    id: 3,
    title: 'Hospitals Ranked',
    desc: '5-factor algorithm with accreditation scores',
    icon: MapPin,
    imageUrl: '/hospital_placeholder.png',
  },
  {
    id: 4,
    title: 'Cost Breakdown',
    desc: 'NHA/CGHS-anchored component costs',
    icon: IndianRupee,
    imageUrl: '/abstract_health.png',
  },
  {
    id: 5,
    title: 'Lender Report Ready',
    desc: 'Auto-approve in 8 minutes with confidence scoring',
    icon: BarChart3,
    imageUrl: '/lender_bg.png',
  },
];

const AccordionItem = ({ item, isActive, onMouseEnter, index }) => {
  const Icon = item.icon;
  return (
    <div
      className={`
        relative h-[420px] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-in-out border border-white/[0.08]
        ${isActive ? 'flex-[4]' : 'flex-[0.5]'}
      `}
      onMouseEnter={onMouseEnter}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {isActive ? (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30">
              <Icon size={20} className="text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Step 0{index + 1}</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
          <p className="text-sm text-slate-300">{item.desc}</p>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          <span className="text-white text-sm font-semibold whitespace-nowrap -rotate-90 origin-center">
            {item.title}
          </span>
        </div>
      )}
    </div>
  );
};

export default function HowItWorksAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3 block">The Intelligence Engine</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How CURIFY Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Five stages from patient query to financial certainty — powered by AI and government-anchored data.</p>
        </div>
        <div className="flex gap-3 h-[420px]">
          {accordionItems.map((item, index) => (
            <AccordionItem
              key={item.id}
              item={item}
              index={index}
              isActive={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
