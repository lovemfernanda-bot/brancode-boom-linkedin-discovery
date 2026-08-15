import { useEffect, useRef } from "react";
import styles from "./LongTextInput.module.css";

interface LongTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmitKey: () => void;
}

export function LongTextInput({ value, onChange, placeholder, onSubmitKey }: LongTextInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <textarea
      ref={ref}
      className={styles.textarea}
      value={value}
      placeholder={placeholder ?? "Escribe tu respuesta..."}
      rows={1}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          onSubmitKey();
        }
      }}
    />
  );
}
