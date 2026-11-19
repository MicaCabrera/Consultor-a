"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

const noopSubscribe = () => () => {};

/** `true` once running in the browser (always `false` during SSR and hydration). */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Hydration-safe `useReducedMotion`: the server can't know the user's
 * preference, so this reports `false` until hydration is done and only then
 * the real value. Server and client markup always match.
 */
export function useSafeReducedMotion() {
  const reduce = useReducedMotion();
  const isClient = useIsClient();
  return Boolean(reduce) && isClient;
}
