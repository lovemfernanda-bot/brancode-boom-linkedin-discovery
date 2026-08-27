import { useEffect } from "react";
import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  formName: string;
  clientName: string;
  onStart: () => void;
  questionCount: number;
}

export function WelcomeScreen({ formName, clientName, onStart, questionCount }: WelcomeScreenProps) {
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
        <span className={styles.eyebrow}>✦ Formulario de BranCode</span>
        <h1 className={styles.headline}>{formName}</h1>
        <p className={styles.clientName}>{clientName}</p>
        <p className={styles.description}>
          Responde estas preguntas para ayudarnos a conocer mejor a{" "}
          <strong>{clientName}</strong> y dar los próximos pasos.
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
