"use client";

import { useEffect } from "react";
import { initScrollObserver } from "@/lib/scroll-observer";

export default function ScrollAnimator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => initScrollObserver(), 100);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
