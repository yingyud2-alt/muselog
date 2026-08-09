/**
 * Cultural enrichment profile for a Work.
 * Optional layer on top of Open Library / API identity fields —
 * never replaces title, coverUrl, description, or externalRatings.
 */

export interface WorkMoodProfile {
  quiet?: number;
  nostalgic?: number;
  melancholic?: number;
  hopeful?: number;
  intense?: number;
}

export interface WorkEnrichmentSimilarWork {
  title: string;
  creator: string;
  reason: string;
}

export interface WorkEnrichment {
  summary?: string;
  /** Provider-grounded “what to expect” line. */
  whatToExpect?: string;
  /** Concise guide from known metadata only. */
  guide?: string;
  themes?: string[];
  /** @deprecated Unsupported emotional scores — omit on new enrichments. */
  moodProfile?: WorkMoodProfile;
  culturalContext?: string;
  /** @deprecated Invented similar works — omit unless catalog-backed. */
  similarWorks?: WorkEnrichmentSimilarWork[];
  editorialTags?: string[];
}
