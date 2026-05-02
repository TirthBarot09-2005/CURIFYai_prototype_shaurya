"use client"

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const ShuffleHero = () => {
  return (
    <section className="w-full px-8 py-12 grid grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto">
      <div>
        <span className="block mb-4 text-xs md:text-sm text-primary font-medium">
          Better every day
        </span>
        <h3 className="text-4xl md:text-6xl font-semibold text-foreground">
          Let's change it up a bit
        </h3>
        <p className="text-base md:text-lg text-muted-foreground my-4 md:my-6">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nam nobis in
          error repellat voluptatibus ad.
        </p>
        <button className={cn(
          "bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md",
          "transition-all hover:bg-primary/90 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}>
          Find a class
        </button>
      </div>
      <ShuffleGrid />
    </section>
  );
};

const shuffle = (array: (typeof squareData)[0][]) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const squareData = [
  { id: 1, src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80" }, // hospital building
  { id: 2, src: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&q=80" }, // surgeon operating
  { id: 3, src: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80" }, // medical team
  { id: 4, src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&q=80" }, // stethoscope
  { id: 5, src: "https://images.unsplash.com/photo-1582719471384-894fbb16f461?w=400&q=80" }, // lab research
  { id: 6, src: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&q=80" }, // doctor with tablet
  { id: 7, src: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80" }, // hospital corridor
  { id: 8, src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" }, // medical pills
  { id: 9, src: "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=400&q=80" }, // heartbeat monitor
  { id: 10, src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&q=80" }, // CT scan
  { id: 11, src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80" }, // modern hospital room
  { id: 12, src: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&q=80" }, // nurse with patient
  { id: 13, src: "https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=400&q=80" }, // blood test tubes
  { id: 14, src: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80" }, // prescription drugs
  { id: 15, src: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&q=80" }, // doctor consultation
  { id: 16, src: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=400&q=80" }, // ambulance
];

const generateSquares = () => {
  return shuffle(squareData).map((sq) => (
    <motion.div
      key={sq.id}
      layout
      transition={{ duration: 1.5, type: "spring" }}
      className="w-full h-full rounded-md overflow-hidden bg-muted"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    ></motion.div>
  ));
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    shuffleSquares();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleSquares = () => {
    setSquares(generateSquares());

    timeoutRef.current = setTimeout(shuffleSquares, 3000);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[450px] gap-1">
      {squares.map((sq) => sq)}
    </div>
  );
};

