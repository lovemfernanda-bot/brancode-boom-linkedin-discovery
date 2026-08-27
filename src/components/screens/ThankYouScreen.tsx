import styles from "./ThankYouScreen.module.css";

interface ThankYouScreenProps {
  clientName: string;
}

export function ThankYouScreen({ clientName }: ThankYouScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <span className={styles.badge} aria-hidden="true">
          ✓
        </span>
        <h1 className={styles.headline}>
          <em>¡Gracias!</em> Recibimos tus respuestas.
        </h1>
        <p className={styles.body}>
          En BranCode ya estamos revisando la información para dar los próximos pasos con{" "}
          {clientName}.
        </p>
        <p className={styles.signature}>— Mafe, BranCode</p>
      </div>
    </div>
  );
}
