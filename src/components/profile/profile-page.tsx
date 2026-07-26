"use client";

import { ProfileAiPortrait } from "@/components/profile/profile-ai-portrait";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

/**
 * Profile — single mount so section anchors (#monthly-reports, etc.) resolve correctly.
 */
export function ProfilePage() {
  return (
    <div
      className="mx-auto max-w-[720px] px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
      style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
    >
      <ProfileAiPortrait />
    </div>
  );
}
