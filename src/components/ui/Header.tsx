import { Logo } from "./Logo";
import styles from "./Header.module.css";

interface HeaderProps {
  stepLabel?: string;
  progressPercent?: number;
}

export function Header({ stepLabel, progressPercent }: HeaderProps) {
  return (
    <header className={styles.header}>
      {typeof progressPercent === "number" && (
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      <div className={styles.row}>
        <Logo />
        {stepLabel && <span className={styles.stepLabel}>{stepLabel}</span>}
      </div>
    </header>
  );
}
