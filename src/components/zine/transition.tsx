"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ComponentProps, type MouseEvent } from "react";

/**
 * Animated page changes built on the browser's View Transitions.
 * "open" morphs the tapped photo into the next page's header photo,
 * "next" / "prev" turn the page sideways. Browsers without support just navigate.
 */
export type TransitionKind = "open" | "next" | "prev";

type Router = ReturnType<typeof useRouter>;
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { ready: Promise<void>; finished: Promise<void> };
};

let settle: (() => void) | null = null;

export function transitionTo(router: Router, href: string, kind: TransitionKind = "open", hero?: HTMLElement | null) {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push(href);
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  if (hero) hero.style.viewTransitionName = "hero";

  const transition = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        settle = resolve;
        router.push(href);
        // Never leave the page frozen if the route takes too long.
        window.setTimeout(resolve, 1500);
      }),
  );
  const cleanUp = () => {
    delete root.dataset.vt;
    if (hero) hero.style.viewTransitionName = "";
  };
  // The browser rejects these when it skips the animation (hidden tab, a newer transition); the page still changes.
  transition.ready.catch(() => {});
  transition.finished.then(cleanUp, cleanUp);
}

/** Mount once: tells a running transition that the next page has rendered. */
export function TransitionSettler() {
  const pathname = usePathname();
  useEffect(() => {
    const done = settle;
    settle = null;
    if (done) requestAnimationFrame(() => done());
  }, [pathname]);
  return null;
}

type TLinkProps = ComponentProps<typeof Link> & { kind?: TransitionKind };

/** A Link that animates the page change. Its first `.img` child becomes the morphing photo. */
export function TLink({ kind = "open", onClick, href, ...rest }: TLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = typeof href === "string" ? href : (href.pathname ?? "");
    if (!target || target === pathname) return;
    e.preventDefault();
    const hero = kind === "open" ? e.currentTarget.querySelector<HTMLElement>(".img") : null;
    transitionTo(router, target, kind, hero);
  };

  return <Link href={href} onClick={handleClick} {...rest} />;
}
