"use client";

export default function ToolsPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 pb-28 pt-8 md:px-8">
            <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[var(--accent-pink)] opacity-[0.06] blur-[90px] animate-[bubble-idle_7s_ease-in-out_infinite]" />
            <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
                <div className="bubble-hero-ring mb-8 animate-[header-pop_0.65s_cubic-bezier(0.22,1,0.36,1)_both]">
                    <img
                        src="https://i.pinimg.com/1200x/7b/c3/ca/7bc3ca00228a49e51305b911c9a7e392.jpg"
                        alt=""
                        className="h-32 w-32 object-cover md:h-40 md:w-40"
                    />
                </div>
                <p className="mb-2 text-[0.65rem] uppercase tracking-[0.45em] text-[var(--text-main)] opacity-75 animate-[fade-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
                    Section
                </p>
                <h2 className="mb-4 text-3xl font-bold text-[var(--accent-pink)] md:text-4xl animate-[fade-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]">
                    Tools
                </h2>
                <p className="text-lg italic text-[var(--text-main)] opacity-75 md:text-xl animate-[fade-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_0.26s_both]">
                    Coming soon…
                </p>
            </div>
        </div>
    );
}
