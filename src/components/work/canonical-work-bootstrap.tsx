"use client";

import { useEffect } from "react";

import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { migrateCanonicalWorkIds } from "@/lib/work/migrate-canonical-work-ids";
import {
  VERIFY_TITLES,
  logCanonicalWorkVerification,
} from "@/lib/work/resolve-canonical-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";

/**
 * Runs legacy → API workId migration whenever imported Works update,
 * and logs verification rows for the shared title set.
 */
export function CanonicalWorkBootstrap() {
  const importedMap = useImportedWorkMap();

  useEffect(() => {
    const { migrated } = migrateCanonicalWorkIds();

    const rows = VERIFY_TITLES.flatMap((title) => {
      const catalog = CONTENT_CATALOG.find(
        (entry) => entry.title.toLowerCase() === title.toLowerCase(),
      );
      const imported = Object.values(importedMap).find(
        (work) => work.title.toLowerCase() === title.toLowerCase(),
      );
      if (!catalog && !imported) return [];
      return [
        {
          storedWorkId: catalog?.id ?? imported?.id ?? title,
          title,
          creator: catalog?.creator ?? imported?.creator,
          type: catalog?.type ?? imported?.type,
        },
      ];
    });

    logCanonicalWorkVerification("bootstrap", rows);

    if (migrated > 0 && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[canonical-work:migration] rewrote ${migrated} legacy ids`);
    }
  }, [importedMap]);

  return null;
}
