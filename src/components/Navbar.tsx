"use client";

import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createSupabaseClient();
    const [isScrolled, setIsScrolled] = useState(false);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            router.replace("/login");
            router.refresh(); // Ensure state is cleared on client
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (path: string) => pathname === path;

    if (pathname === "/login") return null;

    return (
        <div
            className={`sticky top-0 z-50 w-full border-b transition-[background,backdrop-filter,border-color] duration-500 ${isScrolled ? "border-[var(--accent-dim)] bg-[var(--background)]/85 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md" : "border-transparent bg-transparent"}`}
        >
            <div className="p-4 md:p-8 pb-0">
                <header className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 max-w-[1400px] mx-auto w-full gap-4 md:gap-0">
                    <Link href="/" className="group/nav no-underline">
                        <h1 className="text-2xl font-bold tracking-widest text-[var(--foreground)] text-shadow-pink transition-[letter-spacing,filter] duration-500 group-hover/nav:tracking-[0.55em] md:text-[2.5rem]">
                            WIRED/SYS
                        </h1>
                    </Link>
                    <div className="flex gap-2.5">
                        <Link
                            href="/profile"
                            className="primary-btn flex items-center no-underline text-xs md:text-base px-4 py-2"
                        >
                            My Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="primary-btn text-xs md:text-base px-4 py-2"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Navigation Bar */}
                <nav className="flex justify-center gap-4 md:gap-12 text-sm md:text-[1.2rem] font-bold tracking-widest uppercase flex-wrap relative pb-4">
                    <Link
                        href="/"
                        className={`transition-all duration-300 cursor-pointer ${isActive('/') ? "text-[var(--accent-pink)] text-shadow-pink" : "text-[var(--text-main)] hover:text-[var(--accent-pink)] hover:text-shadow-pink"}`}
                    >
                        Links
                    </Link>
                    <span className="text-[var(--accent-dim)]">|</span>
                    <Link
                        href="/tools"
                        className={`transition-all duration-300 cursor-pointer ${isActive('/tools') ? "text-[var(--accent-pink)] text-shadow-pink" : "text-[var(--text-main)] hover:text-[var(--accent-pink)] hover:text-shadow-pink"}`}
                    >
                        Tools
                    </Link>
                    <span className="text-[var(--accent-dim)]">|</span>
                    <Link
                        href="/about"
                        className={`transition-all duration-300 cursor-pointer ${isActive('/about') ? "text-[var(--accent-pink)] text-shadow-pink" : "text-[var(--text-main)] hover:text-[var(--accent-pink)] hover:text-shadow-pink"}`}
                    >
                        About Me
                    </Link>
                    <div className="absolute bottom-0 left-0 h-px w-full animate-[nav-line-glow_4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[var(--accent-pink)] to-transparent opacity-60"></div>
                </nav>
            </div>
        </div>
    );
}
