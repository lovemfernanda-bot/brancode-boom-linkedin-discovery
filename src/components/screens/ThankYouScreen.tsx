import { CLIENT_NAME } from "../../content/formMeta";
import styles from "./ThankYouScreen.module.css";

export function ThankYouScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <span className={styles.badge} aria-hidden="true">
          ✓
        </span>
        <h1 className={styles.headline}>
          Gracias por <em>compartir</em> tu visión.
        </h1>
        <p className={styles.body}>
          Recibimos tus respuestas. Con esto empezamos a construir la presencia de{" "}
          {CLIENT_NAME} en LinkedIn — con la voz y el posicionamiento correctos desde el
          primer post.
        </p>
        <p className={styles.signature}>— Mafe, BranCode</p>
      </div>
    </div>
  );
}
