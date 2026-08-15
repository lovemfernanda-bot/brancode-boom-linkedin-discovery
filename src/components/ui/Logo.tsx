import styles from "./Logo.module.css";

export function Logo() {
  return (
    <span className={styles.logo} aria-label="BranCode">
      Bran<em>Code</em>
    </span>
  );
}
