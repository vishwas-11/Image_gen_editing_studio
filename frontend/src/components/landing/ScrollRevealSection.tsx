"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealSectionProps = {
  children: ReactNode;
  className?: string;
};

export default function ScrollRevealSection({
  children,
  className = "",
}: ScrollRevealSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setIsMounted(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        !isMounted || isVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </div>
  );
}
