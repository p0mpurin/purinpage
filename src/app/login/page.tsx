"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = `${encodeURIComponent(username)}@purin.local`;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.push("/");
        } else {
          alert("Account created! Please sign in.");
          setIsLogin(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-lain relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-8 pb-[max(2rem,6vh)] pt-[max(2rem,min(14vh,8rem))] sm:py-10 md:pb-[max(2.5rem,8vh)] md:pt-[min(18vh,10rem)] lg:pt-[min(16vh,9rem)]">
      <div
        className="pointer-events-none absolute inset-[max(1rem,4vmin)] border border-[var(--wired-grid)] opacity-[0.65]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[max(1.5rem,5vmin)] border border-[var(--accent-dim)]/25"
        aria-hidden
      />

      <div className="relative w-full max-w-sm animate-[fade-rise_0.85s_cubic-bezier(0.22,1,0.36,1)_both]">
        <header className="mb-6 space-y-2 text-center sm:mb-7">
          <p className="text-xs uppercase tracking-[0.5em] text-[var(--accent-pink)] opacity-90">
            wired/sys
          </p>
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="!m-0 !text-3xl !font-normal !normal-case !tracking-[0.28em] !text-[var(--foreground)] text-shadow-pink sm:!text-[2rem]">
              auth
            </h1>
            <span className="login-cursor text-lg leading-none text-[var(--accent-pink)]">_</span>
          </div>
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[var(--accent-pink)]/55 to-transparent" />
          <p className="px-2 text-xs leading-relaxed text-[var(--text-main)] opacity-80 sm:text-[0.8rem]">
            {isLogin ? "Sign in with your username and password." : "Create a username and password to join."}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-sm border border-red-500/40 bg-red-950/25 px-3 py-2 text-center text-xs leading-snug text-red-200/95 normal-case"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-1 block text-base font-medium tracking-wide text-[var(--foreground)]">
              User
            </span>
            <input
              type="text"
              autoComplete="username"
              className="login-input w-full border-0 border-b-2 border-[rgba(255,182,193,0.35)] bg-black/30 px-1 py-2.5 text-[1.05rem] leading-normal text-[var(--foreground)] caret-[var(--accent-pink)] placeholder:text-[var(--text-main)]/45 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-0"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-base font-medium tracking-wide text-[var(--foreground)]">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="login-input w-full border-0 border-b-2 border-[rgba(255,182,193,0.35)] bg-black/30 px-1 py-2.5 pr-12 text-[1.05rem] leading-normal text-[var(--foreground)] caret-[var(--accent-pink)] placeholder:text-[var(--text-main)]/45 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 border-none bg-transparent p-2 text-[var(--foreground)] opacity-50 transition-opacity hover:opacity-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="mt-0.5 w-full border-2 border-[var(--accent-pink)]/70 bg-[var(--accent-pink)]/10 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-pink)] transition-all duration-300 hover:bg-[var(--accent-pink)]/20 disabled:pointer-events-none disabled:opacity-40"
            disabled={loading}
          >
            {loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-main)] opacity-85">
          {isLogin ? "Need an account? " : "Already registered? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="login-mode-toggle border-none bg-transparent p-0 font-medium text-[var(--accent-pink)] underline decoration-[var(--accent-pink)]/50 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
