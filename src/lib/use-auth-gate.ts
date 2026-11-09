"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";

/** True until the session check finishes; sends signed-out visitors to /login when auth is required. */
export function useAuthGate(): boolean {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        if (active) setLoading(false);
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
        } else if (active) {
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };
    check();
    return () => {
      active = false;
    };
  }, [router]);

  return loading;
}
