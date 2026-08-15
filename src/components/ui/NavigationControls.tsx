import styles from "./NavigationControls.module.css";

interface NavigationControlsProps {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextEnabled: boolean;
  showPrevious: boolean;
  keyboardHint?: string;
}

export function NavigationControls({
  onPrevious,
  onNext,
  nextLabel = "OK",
  isNextEnabled,
  showPrevious,
  keyboardHint,
}: NavigationControlsProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {showPrevious && (
          <button
            type="button"
            className={styles.prevButton}
            onClick={onPrevious}
            aria-label="Pregunta anterior"
          >
            <span aria-hidden="true">←</span> Anterior
          </button>
        )}
        <button
          type="button"
          className={`${styles.nextButton} ${isNextEnabled ? styles.nextButtonActive : ""}`}
          onClick={onNext}
        >
          {nextLabel} <span aria-hidden="true">→</span>
        </button>
        {keyboardHint && (
          <span className={styles.hint}>
            presiona <kbd className={styles.kbd}>{keyboardHint}</kbd>
          </span>
        )}
      </div>
    </div>
  );
}
