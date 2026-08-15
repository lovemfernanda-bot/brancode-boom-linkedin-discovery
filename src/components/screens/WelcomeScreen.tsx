import { useEffect } from "react";
import { CLIENT_NAME } from "../../content/formMeta";
import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  onStart: () => void;
  questionCount: number;
}

export function WelcomeScreen({ onStart, questionCount }: WelcomeScreenProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") onStart();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  const estimatedMinutes = Math.max(5, Math.round(questionCount * 0.8));

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>✦ Descubrimiento de LinkedIn</span>
        <h1 className={styles.headline}>
          LinkedIn <em>Discovery</em>
        </h1>
        <p className={styles.clientName}>{CLIENT_NAME}</p>
        <p className={styles.description}>
          Este breve descubrimiento nos ayudará a entender tus metas, tu audiencia, tu
          posicionamiento y las oportunidades a medida que construimos la presencia de{" "}
          <strong>{CLIENT_NAME}</strong> en LinkedIn desde cero.
        </p>
        <p className={styles.estimate}>
          Tiempo estimado: {estimatedMinutes - 2}–{estimatedMinutes} minutos.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.startButton} onClick={onStart}>
            Comenzar <span aria-hidden="true">→</span>
          </button>
          <span className={styles.hint}>
            presiona <kbd className={styles.kbd}>Enter ↵</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
