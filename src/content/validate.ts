import type { Answer, Question } from "./types";

export function isAnswered(question: Question, value: Answer | undefined): boolean {
  if (!question.required) return true;
  if (question.type === "long-text") return typeof value === "string" && value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}
