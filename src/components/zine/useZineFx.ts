"use client";

import { useEffect } from "react";

/**
 * Wires the zine's scroll effects for whatever is on the page:
 * `.img` photos turn to colour while crossing the middle of the screen,
 * `.reveal` blocks fade up once. Pass a key that changes whenever new blocks render.
 */
export function useZineFx(renderKey: string) {
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("zfx");
    }

    const lit = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("lit", e.isIntersecting)),
      { rootMargin: "-30% 0px -30% 0px" },
    );
    const reveal = new IntersectionObserver(
      (entries, observer) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          observer.unobserve(e.target);
        }),
      { threshold: 0.08 },
    );

    document.querySelectorAll(".z-page .img").forEach((el) => lit.observe(el));
    document.querySelectorAll(".z-page .reveal:not(.in)").forEach((el) => reveal.observe(el));

    return () => {
      lit.disconnect();
      reveal.disconnect();
    };
  }, [renderKey]);
}
