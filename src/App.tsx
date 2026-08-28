import { useEffect, useState } from "react";
import { Header } from "./components/ui/Header";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { QuestionScreen } from "./components/screens/QuestionScreen";
import { ThankYouScreen } from "./components/screens/ThankYouScreen";
import type { Answers, FormDefinition } from "./content/types";

type Stage = "loading" | "not-found" | "welcome" | "questions" | "submitting" | "thank-you" | "submit-error";

// The very first form this app ever served, kept as the default when no
// /forms/:slug is present in the URL — preserves the existing public link.
const DEFAULT_SLUG = "boom-balloons-linkedin-discovery";

function resolveSlugFromLocation(): string {
  const match = window.location.pathname.match(/^\/forms\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : DEFAULT_SLUG;
}

export function App() {
  const [stage, setStage] = useState<Stage>("loading");
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const slug = resolveSlugFromLocation();
    fetch(`/api/forms/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) throw new Error("not-found");
        return response.json();
      })
      .then((data: { ok: boolean; form?: FormDefinition }) => {
        if (!data.ok || !data.form) throw new Error("not-found");
        setForm(data.form);
        setStage("welcome");
      })
      .catch(() => setStage("not-found"));
  }, []);

  const total = form?.questions.length ?? 0;
  const currentQuestion = form?.questions[stepIndex];

  // Every screen (welcome, each question, thank-you) should start scrolled
  // to the top — otherwise a tall question that required scrolling leaves
  // the next screen loaded mid-scroll, hiding its headline under the
  // sticky header. Resetting on the next animation frame (rather than
  // synchronously) wins the race against the browser's own scroll
  // adjustments (e.g. focus handling, scroll anchoring) that can otherwise
  // run just after this effect and silently undo a synchronous reset.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    });
    return () => cancelAnimationFrame(raf);
  }, [stage, stepIndex]);

  function goNext() {
    if (stepIndex < total - 1) {
      setStepIndex((i) => i + 1);
    } else {
      void submit();
    }
  }

  function goPrevious() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function submit() {
    if (!form) return;
    setStage("submitting");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_slug: form.slug, answers }),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      setStage("thank-you");
    } catch (error) {
      console.error("Submission failed", error);
      setStage("submit-error");
    }
  }

  return (
    <>
      {stage === "questions" && (
        <Header
          stepLabel={`${stepIndex + 1} / ${total}`}
          progressPercent={((stepIndex + 1) / total) * 100}
        />
      )}
      {(stage === "welcome" || stage === "thank-you" || stage === "submit-error" || stage === "not-found") && (
        <Header />
      )}

      {stage === "loading" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-ink-soft)" }}>Cargando...</p>
        </div>
      )}

      {stage === "not-found" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "3rem clamp(1.5rem, 6vw, 6.5rem)",
            gap: "1rem",
            maxWidth: "40rem",
          }}
        >
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>Formulario no encontrado.</h1>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-ink-soft)" }}>
            Este enlace no corresponde a un formulario activo. Verifica el enlace o contacta a BranCode.
          </p>
        </div>
      )}

      {stage === "welcome" && form && (
        <WelcomeScreen
          formName={form.name}
          clientName={form.clientName}
          questionCount={total}
          onStart={() => setStage("questions")}
        />
      )}

      {stage === "questions" && currentQuestion && (
        <QuestionScreen
          key={currentQuestion.id}
          question={currentQuestion}
          index={stepIndex}
          total={total}
          value={answers[currentQuestion.id]}
          onChange={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))}
          onNext={goNext}
          onPrevious={goPrevious}
          isFirst={stepIndex === 0}
        />
      )}

      {stage === "submitting" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-ink-soft)" }}>
            Enviando tus respuestas...
          </p>
        </div>
      )}

      {stage === "thank-you" && <ThankYouScreen clientName={form?.clientName ?? ""} />}

      {stage === "submit-error" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "3rem clamp(1.5rem, 6vw, 6.5rem)",
            gap: "1rem",
            maxWidth: "40rem",
          }}
        >
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>
            No pudimos enviar tus respuestas.
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-ink-soft)" }}>
            Revisa tu conexión e inténtalo de nuevo. Tus respuestas siguen guardadas en esta
            pantalla.
          </p>
          <button
            type="button"
            onClick={() => void submit()}
            style={{
              background: "var(--color-coral)",
              border: "none",
              borderRadius: "999px",
              padding: "0.9rem 1.75rem",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Reintentar
          </button>
        </div>
      )}
    </>
  );
}
