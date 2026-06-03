export interface UsersTable {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string | null;
  google_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocabulariesTable {
  id: string;
  user_id: string;
  word: string;
  pronunciation_uk: string | null;
  pronunciation_us: string | null;
  note: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyTagsTable {
  id: string;
  vocabulary_id: string;
  tag: string;
  created_at: string;
}

export interface MeaningsTable {
  id: string;
  vocabulary_id: string;
  part_of_speech: string;
  definition: string;
  translation: string | null;
  cefr_level: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ExamplesTable {
  id: string;
  meaning_id: string;
  sentence: string;
  translation: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewStatesTable {
  vocabulary_id: string;
  stage: number;
  repetition_count: number;
  interval_days: number;
  ease_factor: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewLogsTable {
  id: string;
  vocabulary_id: string;
  rating: string;
  previous_stage: number | null;
  next_stage: number | null;
  previous_interval_days: number | null;
  next_interval_days: number | null;
  reviewed_at: string;
}

export interface UserSettingsTable {
  user_id: string;
  stage_thresholds: string;
  created_at: string;
  updated_at: string;
}

export interface EmailOtpsTable {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
}

export interface DB {
  users: UsersTable;
  email_otps: EmailOtpsTable;
  vocabularies: VocabulariesTable;
  vocabulary_tags: VocabularyTagsTable;
  meanings: MeaningsTable;
  examples: ExamplesTable;
  review_states: ReviewStatesTable;
  review_logs: ReviewLogsTable;
  user_settings: UserSettingsTable;
}
