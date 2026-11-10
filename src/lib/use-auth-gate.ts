"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";

// Once the session check has passed, later pages render straight away,
// which keeps page transitions from flashing a loading screen.
let passed = false;

/** Call on sign-out so the next page checks the session again. */
export function resetAuthGate() {
  passed = false;
}

/** True until the session check finishes; sends signed-out visitors to /login when auth is required. */
export function useAuthGate(): boolean {
  const router = useRouter();
  const [loading, setLoading] = useState(!passed);

  useEffect(() => {
    if (passed) return;
    let active = true;
    const pass = () => {
      passed = true;
      if (active) setLoading(false);
    };
    const check = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        pass();
        return;
      }
      try {
        const supabase = createSupabaseClient();
        const timeout = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 400),
        );
        const {
          data: { session },
        } = await Promise.race([supabase.auth.getSession(), timeout]);
        if (!session && process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true") {
          router.replace("/login");
        } else {
          pass();
        }
      } catch {
        pass();
      }
    };
    check();
    return () => {
      active = false;
    };
  }, [router]);

  return loading;
}
