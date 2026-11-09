"use client";

import { useState, type CSSProperties } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

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
          setNotice("Account created. Log in to continue.");
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
    <main className="z-page l-page">
      <div className="l-photo img lit" style={{ "--img": 'url("/icons/movies.jpg")' } as CSSProperties} aria-hidden="true" />
      <section className="l-side z-pad">
        <span className="c-romaji">Setsuzoku / Connect</span>
        <h1 className="l-mast">
          <span>WIRED/</span>
          <span>SYS</span>
        </h1>
        <p className="l-deck">
          {isLogin ? "Log in with your username and password." : "Pick a username and password to join."}
        </p>

        <form onSubmit={handleAuth} className="f-form">
          {error && (
            <p className="z-msg bad" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="z-msg good" role="status">
              {notice}
            </p>
          )}

          <label className="z-field" htmlFor="login-username">
            <span>Username</span>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              className="z-input"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
            />
          </label>

          <label className="z-field" htmlFor="login-password">
            <span>Password</span>
            <span className="pw-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="z-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <button type="submit" className="z-btn" disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="l-switch">
          {isLogin ? "Need an account? " : "Already have one? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setNotice(null);
            }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </section>
    </main>
  );
}
