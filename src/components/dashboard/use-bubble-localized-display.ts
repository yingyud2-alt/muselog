/**
 * Shared helpers for localized Bubble presentation (desktop + mobile).
 */

import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/components/i18n/language-provider";
import {
  persistPresentationCache,
  type BubbleLocalizedPresentation,
} from "@/lib/localization/content-localization";

import type { WorkBubble } from "./mood-bubble-data";

export type BubblePresentationFields = Pick<
  WorkBubble,
  | "title"
  | "creator"
  | "quote"
  | "localizedTitle"
  | "localizedCreator"
  | "localizedQuote"
  | "workId"
>;

function presentationFromBubble(
  work: BubblePresentationFields,
): BubbleLocalizedPresentation {
  const originalTitle = work.title?.trim() ?? "";
  const originalCreator = work.creator?.trim() ?? "";
  const originalTeaser = work.quote?.trim() || originalTitle;
  const localizedTitle = work.localizedTitle?.trim() || undefined;
  const localizedCreator = work.localizedCreator?.trim() || undefined;
  const localizedTeaser = work.localizedQuote?.trim() || undefined;

  const hasLocalizedDiff = Boolean(
    (localizedTitle && localizedTitle !== originalTitle) ||
      (localizedCreator && localizedCreator !== originalCreator) ||
      (localizedTeaser && localizedTeaser !== originalTeaser),
  );

  return {
    originalTitle,
    localizedTitle,
    originalCreator,
    localizedCreator,
    originalTeaser,
    localizedTeaser,
    hasLocalizedDiff,
  };
}

export function useBubbleLocalizedDisplay(work: BubblePresentationFields) {
  const { locale } = useLanguage();
  const workKey = `${work.workId ?? ""}::${work.title}::${work.quote}`;
  const sourceTitle = work.title;
  const sourceCreator = work.creator;
  const sourceQuote = work.quote;
  const sourceLocalizedTitle = work.localizedTitle;
  const sourceLocalizedCreator = work.localizedCreator;
  const sourceLocalizedQuote = work.localizedQuote;
  const workId = work.workId;

  const presentation = useMemo(
    () =>
      presentationFromBubble({
        title: sourceTitle,
        creator: sourceCreator,
        quote: sourceQuote,
        localizedTitle: sourceLocalizedTitle,
        localizedCreator: sourceLocalizedCreator,
        localizedQuote: sourceLocalizedQuote,
        workId,
      }),
    [
      sourceTitle,
      sourceCreator,
      sourceQuote,
      sourceLocalizedTitle,
      sourceLocalizedCreator,
      sourceLocalizedQuote,
      workId,
    ],
  );

  const [toggleState, setToggleState] = useState({
    key: workKey,
    showOriginal: false,
  });
  const showOriginal =
    toggleState.key === workKey ? toggleState.showOriginal : false;

  useEffect(() => {
    if (locale !== "zh-CN") return;
    if (!presentation.hasLocalizedDiff || !workId) return;
    persistPresentationCache(workId, presentation);
  }, [locale, presentation, workId]);

  const isZh = locale === "zh-CN";
  const useLocalized = isZh && !showOriginal;

  const title =
    useLocalized && presentation.localizedTitle
      ? presentation.localizedTitle
      : presentation.originalTitle;
  const creator =
    useLocalized && presentation.localizedCreator
      ? presentation.localizedCreator
      : presentation.originalCreator;
  const teaser =
    useLocalized && presentation.localizedTeaser
      ? presentation.localizedTeaser
      : presentation.originalTeaser || title;

  const canToggle =
    isZh &&
    presentation.hasLocalizedDiff &&
    Boolean(
      presentation.localizedTitle ||
        presentation.localizedCreator ||
        presentation.localizedTeaser,
    );

  return {
    locale,
    isZh,
    title,
    creator,
    teaser,
    showOriginal,
    canToggle,
    toggleLabelKey: showOriginal
      ? ("bubble.viewTranslation" as const)
      : ("bubble.viewOriginal" as const),
    toggle: () =>
      setToggleState({
        key: workKey,
        showOriginal: !showOriginal,
      }),
  };
}
