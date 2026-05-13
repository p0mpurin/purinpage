"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const router = useRouter();
    const supabase = createSupabaseClient();

    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/login");
            } else {
                // Extract username from email
                const email = session.user.email || "";
                // Decode if it was encoded
                try {
                    const extractedUsername = decodeURIComponent(email.split("@")[0]);
                    setUsername(extractedUsername);
                } catch {
                    // Fallback if decoding fails
                    setUsername(email.split("@")[0]);
                }
                setLoading(false);
            }
        };
        fetchUser();
    }, [router, supabase]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const updates: { email?: string; password?: string } = {};

            if (newPassword) {
                updates.password = newPassword;
            }

            // Encoded Update
            if (username) {
                // We must encode it again to match the login logic
                updates.email = `${encodeURIComponent(username)}@purin.local`;
            }

            if (Object.keys(updates).length === 0) return;

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMessage({ text: "Profile updated successfully!", type: "success" });
            setNewPassword(""); // Clear password field for security

        } catch (err: unknown) {
            setMessage({ text: err instanceof Error ? err.message : "Something went wrong", type: "error" });
        }
    };

    const handleBack = () => {
        router.push("/");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LoadingScreen label="Loading" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 md:p-8 pt-4 md:pt-8 pb-20 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto w-full flex items-center justify-center">
                <div className="glass-panel p-8 md:p-12 w-full max-w-xl flex flex-col gap-6 border border-[var(--wired-grid)]">

                    <button
                        onClick={handleBack}
                        className="self-start text-[var(--secondary)] hover:text-[var(--accent-pink)] transition-colors duration-200 flex items-center gap-2 mb-2"
                    >
                        ← Back to Dashboard
                    </button>

                    <div className="flex flex-col items-center gap-6 mb-8 w-full border-b border-[var(--wired-grid)] pb-8">
                        <h1 className="text-[2rem] md:text-[2.5rem] font-bold text-center text-[var(--accent-pink)]">MY PROFILE</h1>
                        <div className="w-32 h-32 bg-[var(--background)] rounded-full flex items-center justify-center border-4 border-[var(--accent-pink)] shadow-[0_0_20px_var(--accent-pink)] shrink-0 overflow-hidden relative group">
                            <img
                                src="https://i.pinimg.com/736x/eb/10/74/eb1074d1a298aeaee9682e6f4b728437.jpg"
                                alt="Avatar"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-[var(--accent-pink)] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </div>
                        <p className="text-[var(--foreground)] opacity-70 text-center text-sm uppercase tracking-widest">System Administrator</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md text-center border ${message.type === 'success' ? "bg-green-500/10 border-green-500/50 text-green-200" : "bg-red-500/10 border-red-500/50 text-red-200"}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <div>
                            <label className="block mb-2 font-medium">Username</label>
                            <input
                                type="text"
                                className="input-field w-full"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="New Username"
                            />
                            <p className="text-xs text-[var(--secondary)] mt-1">
                                Changing this will change your login username.
                            </p>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">New Password</label>
                            <input
                                type="password"
                                className="input-field w-full"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                            />
                        </div>

                        <button type="submit" className="primary-btn w-full py-3 mt-2">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}   
