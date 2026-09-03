"use client";

import React, { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, HTMLMotionProps } from "framer-motion";

export const springGentle = { type: "spring", stiffness: 320, damping: 30 } as const;
export const springSnappy = { type: "spring", stiffness: 420, damping: 28 } as const;
export const springBouncy = { type: "spring", stiffness: 450, damping: 22 } as const;

/**
 * AnimatedNumber: Emil Kowalski style rolling spring counter
 * Smoothly interpolates and rolls numbers when updated
 */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 280,
    damping: 24,
  });

  const display = useTransform(spring, (current) => {
    const formatted = current.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

/**
 * MorphingPill: Smooth shared layout background indicator
 */
export function MorphingPill({
  layoutId,
  className = "",
  transition = springSnappy,
}: {
  layoutId: string;
  className?: string;
  transition?: any;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={transition}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}

/**
 * SpringButton: Tactile button with signature spring scale compression
 */
export function SpringButton({
  children,
  className = "",
  whileTap = { scale: 0.965 },
  whileHover = { scale: 1.015 },
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={whileTap}
      whileHover={whileHover}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
