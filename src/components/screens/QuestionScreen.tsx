import { useState } from "react";
import type { Question } from "../../content/types";
import { LongTextInput } from "../questions/LongTextInput";
import { OptionCards } from "../questions/OptionCards";
import { NavigationControls } from "../ui/NavigationControls";
import { StepCounter } from "../ui/StepCounter";
import styles from "./QuestionScreen.module.css";

interface QuestionScreenProps {
  question: Question;
  index: number;
  total: number;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
}

function isAnswered(question: Question, value: string | string[] | undefined): boolean {
  if (!question.required) return true;
  if (question.type === "long-text") return typeof value === "string" && value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}

export function QuestionScreen({
  question,
  index,
  total,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst,
}: QuestionScreenProps) {
  const [showError, setShowError] = useState(false);
  const answered = isAnswered(question, value);

  function handleAttemptNext() {
    if (!answered) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext();
  }

  function toggleOption(optionId: string) {
    if (question.type === "single-choice") {
      onChange([optionId]);
      setShowError(false);
      return;
    }
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onChange(next);
    setShowError(false);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        {question.section && <p className={styles.section}>{question.section}</p>}
        <StepCounter current={index + 1} total={total} />
        <h1 className={styles.headline}>{question.question}</h1>
        {question.helper && <p className={styles.helper}>{question.helper}</p>}

        <div className={styles.inputArea}>
          {question.type === "long-text" && (
            <LongTextInput
              value={typeof value === "string" ? value : ""}
              onChange={(v) => {
                onChange(v);
                setShowError(false);
              }}
              placeholder={question.placeholder}
              onSubmitKey={handleAttemptNext}
            />
          )}
          {(question.type === "single-choice" || question.type === "multi-select") &&
            question.options && (
              <OptionCards
                options={question.options}
                mode={question.type === "single-choice" ? "single" : "multi"}
                selected={Array.isArray(value) ? value : []}
                onToggle={toggleOption}
              />
            )}
        </div>

        {showError && (
          <p className={styles.errorHint} role="alert">
            Esta pregunta es obligatoria. Por favor responde para continuar.
          </p>
        )}

        <NavigationControls
          onPrevious={onPrevious}
          onNext={handleAttemptNext}
          isNextEnabled={answered}
          showPrevious={!isFirst}
          keyboardHint={question.type === "long-text" ? "Ctrl + Enter ↵" : "Enter ↵"}
        />
      </div>
    </div>
  );
}
