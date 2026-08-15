import styles from "./StepCounter.module.css";

interface StepCounterProps {
  current: number;
  total: number;
}

export function StepCounter({ current, total }: StepCounterProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.badge}>{current}</span>
      <span className={styles.text}>de {total}</span>
    </div>
  );
}
