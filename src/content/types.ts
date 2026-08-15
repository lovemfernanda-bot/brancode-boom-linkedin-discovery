export type QuestionType = "long-text" | "single-choice" | "multi-select";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  /** Small eyebrow label shown above the headline, e.g. section name. */
  section?: string;
  /** The large serif headline. */
  question: string;
  /** Supporting sans-serif copy shown under the headline. */
  helper?: string;
  required: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  /** Marks seed/demo content that must be replaced before this form goes live. */
  isPlaceholder?: boolean;
}

export type Answer = string | string[];

export type Answers = Record<string, Answer>;
