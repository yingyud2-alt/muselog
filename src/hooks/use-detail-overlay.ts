"use client";

import { useSyncExternalStore } from "react";

import {
  getDetailOverlaySnapshot,
  subscribeDetailOverlay,
  type DetailLayer,
} from "@/lib/detail/detail-overlay-store";

const SERVER_SNAPSHOT = { stack: [] as DetailLayer[], savedScrollY: null };

export function useDetailOverlay() {
  return useSyncExternalStore(
    subscribeDetailOverlay,
    getDetailOverlaySnapshot,
    () => SERVER_SNAPSHOT,
  );
}
