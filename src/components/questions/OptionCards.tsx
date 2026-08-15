import { useEffect, useRef } from "react";
import type { QuestionOption } from "../../content/types";
import styles from "./OptionCards.module.css";

interface OptionCardsProps {
  options: QuestionOption[];
  mode: "single" | "multi";
  selected: string[];
  onToggle: (optionId: string) => void;
}

export function OptionCards({ options, mode, selected, onToggle }: OptionCardsProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <div className={styles.list} role={mode === "single" ? "radiogroup" : "group"}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            ref={index === 0 ? firstRef : undefined}
            type="button"
            role={mode === "single" ? "radio" : "checkbox"}
            aria-checked={isSelected}
            className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
            onClick={() => onToggle(option.id)}
          >
            <span className={styles.marker} aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span className={styles.label}>{option.label}</span>
            {isSelected && (
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
