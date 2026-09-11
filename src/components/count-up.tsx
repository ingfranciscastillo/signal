"use client";

import { animate } from "motion/react";
import { useEffect, useRef } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
}

// Count-up de 0 al valor real, ~600ms ease-out vía requestAnimationFrame de motion.
export default function CountUp({ value, duration = 0.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}
