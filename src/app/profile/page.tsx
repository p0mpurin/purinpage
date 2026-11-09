"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import PageHead from "@/components/zine/PageHead";

const AVATAR_URL = "https://i.pinimg.com/736x/eb/10/74/eb1074d1a298aeaee9682e6f4b728437.jpg";

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

            setMessage({ text: "Saved. Use your new details next time you log in.", type: "success" });
            setNewPassword(""); // Clear password field for security

        } catch (err: unknown) {
            setMessage({ text: err instanceof Error ? err.message : "Something went wrong", type: "error" });
        }
    };

    const handleBack = () => {
        router.push("/");
    };

    if (loading) {
        return <LoadingScreen label="Loading" />;
    }

    return (
        <main className="z-page">
            <div className="z-wrap z-pad">
                <PageHead kanji="個人" romaji="Kojin / Profile" title="Profile" deck="Change the name and password you sign in with." />

                <section className="f-spread">
                    <div className="f-avatar img lit" style={{ "--img": `url("${AVATAR_URL}")` } as CSSProperties} role="img" aria-label="Your avatar" />

                    <form onSubmit={handleUpdateProfile} className="f-form">
                        {message && <p className={`z-msg ${message.type === "success" ? "good" : "bad"}`} role="status">{message.text}</p>}

                        <label className="z-field" htmlFor="profile-username">
                            <span>Username</span>
                            <input
                                id="profile-username"
                                type="text"
                                className="z-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="New username"
                                autoComplete="username"
                                autoCapitalize="none"
                            />
                        </label>
                        <p className="hint">Changing this also changes the name you log in with.</p>

                        <label className="z-field" htmlFor="profile-password">
                            <span>New password</span>
                            <input
                                id="profile-password"
                                type="password"
                                className="z-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep your current one"
                                autoComplete="new-password"
                            />
                        </label>

                        <div className="z-btn-row">
                            <button type="submit" className="z-btn">
                                Save changes
                            </button>
                            <button type="button" className="z-btn ghost" onClick={handleBack}>
                                Back to contents
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
