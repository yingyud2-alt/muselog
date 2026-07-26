"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  getReturnRestoreEventName,
  peekReturnContext,
  registerReturnSnapshotProvider,
  type ReturnContext,
  type ReturnPageState,
} from "@/lib/navigation/return-context";

/**
 * Keep a live UI snapshot for return navigation,
 * and rehydrate when coming back from Work Detail.
 */
export function useReturnSnapshot(
  snapshot: ReturnPageState,
  onRestore: (context: ReturnContext) => void,
) {
  const pathname = usePathname();

  useEffect(() => {
    return registerReturnSnapshotProvider(() => snapshot);
  }, [snapshot]);

  useEffect(() => {
    // Restorer may dispatch before this listener mounts — hydrate from storage.
    const pending = peekReturnContext();
    if (pending && pending.pathname === pathname) {
      onRestore(pending);
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<ReturnContext>;
      if (!custom.detail) return;
      if (custom.detail.pathname !== pathname) return;
      onRestore(custom.detail);
    };

    window.addEventListener(getReturnRestoreEventName(), handler);
    return () => {
      window.removeEventListener(getReturnRestoreEventName(), handler);
    };
  }, [onRestore, pathname]);
}
