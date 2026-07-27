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
  themes?: string[];
  moodProfile?: WorkMoodProfile;
  culturalContext?: string;
  similarWorks?: WorkEnrichmentSimilarWork[];
  editorialTags?: string[];
}
