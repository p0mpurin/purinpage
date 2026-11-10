"use client";

import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getEdition, subscribeEdition, toggleEdition } from "@/lib/edition";
import dynamic from "next/dynamic";
import { TransitionSettler } from "@/components/zine/transition";
import { useFavoritesSync } from "@/lib/favorites-sync";
import { resetAuthGate } from "@/lib/use-auth-gate";
import { CloseIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "@/components/zine/icons";

// The search index holds every link, so it only downloads when search is first opened.
const SearchOverlay = dynamic(() => import("@/components/zine/SearchOverlay"), { ssr: false });

const NAV = [
  { href: "/", label: "Hub", kanji: "目次", match: (p: string) => p === "/" || p.startsWith("/category") },
  { href: "/watch", label: "Cinema", kanji: "映画館", match: (p: string) => p === "/watch" },
  { href: "/tools", label: "Tools", kanji: "道具", match: (p: string) => p === "/tools" },
  { href: "/dev", label: "Dev", kanji: "開発", match: (p: string) => p === "/dev" || p === "/about" },
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const edition = useSyncExternalStore(subscribeEdition, getEdition, () => "day" as const);

  useFavoritesSync();

  const closeMenu = () => setMenuOpen(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const handleLogout = async () => {
    setMenuOpen(false);
    resetAuthGate();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  // Ctrl/Cmd + K or "/" opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const combo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (combo || (e.key === "/" && !isTyping(e.target))) {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (pathname === "/login") return <TransitionSettler />;

  return (
    <>
      <TransitionSettler />
      <header className="z-bar">
        <Link href="/" className="z-logo" onClick={closeMenu}>
          WIRED<span>/</span>SYS
        </Link>
        <nav className="z-nav" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="z-actions">
          <button
            type="button"
            className="z-ico"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
            aria-label="Search all links"
            title="Search all links (Ctrl+K)"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className="z-ico edition"
            onClick={toggleEdition}
            aria-label={edition === "night" ? "Switch to the Day edition" : "Switch to the Night edition"}
            title={edition === "night" ? "Day edition" : "Night edition"}
          >
            {edition === "night" ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link href="/profile" className="z-text-btn">
            Profile
          </Link>
          <button type="button" className="z-text-btn" onClick={handleLogout}>
            Exit
          </button>
          <button
            type="button"
            className="z-ico menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="z-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav id="z-menu" className="z-menu" aria-label="Menu">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              {item.label}
              <small>{item.kanji}</small>
            </Link>
          ))}
          <Link href="/profile" onClick={closeMenu}>
            Profile
            <small>個人</small>
          </Link>
          <button type="button" onClick={handleLogout}>
            Exit
            <small>sign out</small>
          </button>
        </nav>
      )}

      <p className="z-notice" role="note">
        <b>!</b> Use an ad blocker first · AdGuard (Android) · 1Blocker (iOS)
      </p>

      {searchOpen && <SearchOverlay onClose={closeSearch} />}
    </>
  );
}
