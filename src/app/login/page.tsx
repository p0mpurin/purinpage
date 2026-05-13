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

                const { data: { session } } = await supabase.auth.getSession();
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
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <div
                className="glass-panel flex w-full max-w-md animate-[fade-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both] flex-col gap-6 p-8 md:p-10"
            >
                <div className="text-center">
                    <p className="mb-2 text-[0.65rem] uppercase tracking-[0.45em] text-[var(--text-main)] opacity-70">
                        WIRED/SYS
                    </p>
                    <h1 className="text-xl font-bold normal-case !tracking-tight md:text-2xl">
                        {isLogin ? "Welcome back" : "Join"}
                    </h1>
                    <p className="mt-3 text-sm text-[var(--accent-pink)] opacity-90">
                        {isLogin ? "Sign in with your username" : "Create an account to continue"}
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="border border-red-500/50 bg-red-950/30 px-3 py-2.5 text-center text-xs uppercase tracking-wider text-red-200"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="input-field"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoCapitalize="none"
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="input-field pr-11"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent p-2 text-[var(--foreground)] opacity-70 transition-opacity hover:opacity-100"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <button type="submit" className="primary-btn mt-1 py-2.5 transition-[transform,opacity] duration-300 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50" disabled={loading}>
                        {loading ? "Processing…" : isLogin ? "Login" : "Sign up"}
                    </button>
                </form>

                <p className="text-center text-xs text-[var(--accent-pink)] opacity-85">
                    {isLogin ? "No account? " : "Have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="border-none bg-transparent font-semibold underline decoration-[var(--accent-pink)] decoration-1 underline-offset-2 transition-colors hover:text-white"
                    >
                        {isLogin ? "Sign up" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
