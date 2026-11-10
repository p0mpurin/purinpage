"use client";

import { useEffect } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import {
  getFavoritesSnapshot,
  getFavoritesUpdatedAt,
  saveFavorites,
  subscribeFavorites,
} from "@/lib/favorites";
import type { LinkItem } from "@/lib/links";

/**
 * Keeps favorites in step with the signed-in account so they follow you between devices.
 * They live in the account's own metadata (no extra table). Whichever side changed last wins.
 */

type RemoteFavorites = { items: LinkItem[]; updatedAt: number };

const MAX_ITEMS = 300;
const PUSH_DELAY_MS = 1500;

function readRemote(metadata: unknown): RemoteFavorites | null {
  const raw = (metadata as { favorites?: Partial<RemoteFavorites> } | null | undefined)?.favorites;
  if (!raw || !Array.isArray(raw.items) || typeof raw.updatedAt !== "number") return null;
  return { items: raw.items, updatedAt: raw.updatedAt };
}

export function useFavoritesSync() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createSupabaseClient();
    let signedIn = false;
    let lastSynced = 0;
    let timer: number | undefined;

    const push = async () => {
      if (!signedIn) return;
      const updatedAt = getFavoritesUpdatedAt();
      if (!updatedAt || updatedAt === lastSynced) return;
      const items = getFavoritesSnapshot()
        .slice(0, MAX_ITEMS)
        .map(({ name, url, description }) => ({ name, url, description }));
      const { error } = await supabase.auth.updateUser({ data: { favorites: { items, updatedAt } } });
      if (!error) lastSynced = updatedAt;
    };

    const reconcile = (metadata: unknown) => {
      const remote = readRemote(metadata);
      const localAt = getFavoritesUpdatedAt();
      if (remote && remote.updatedAt > localAt) {
        lastSynced = remote.updatedAt;
        saveFavorites(remote.items, remote.updatedAt);
      } else if (localAt > (remote?.updatedAt ?? 0)) {
        void push();
      } else {
        lastSynced = localAt;
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      signedIn = Boolean(session);
      if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        reconcile(session.user.user_metadata);
      }
    });

    const unsubscribe = subscribeFavorites(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void push(), PUSH_DELAY_MS);
    });

    return () => {
      listener.subscription.unsubscribe();
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);
}
