import { useEffect, useState } from "react";
import { Header } from "./components/ui/Header";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { QuestionScreen } from "./components/screens/QuestionScreen";
import { ThankYouScreen } from "./components/screens/ThankYouScreen";
import { boomBalloonsQuestionnaire } from "./content/boomBalloonsQuestionnaire";
import { CLIENT_NAME, FORM_SLUG, FORM_VERSION } from "./content/formMeta";
import type { Answers } from "./content/types";

type Stage = "welcome" | "questions" | "submitting" | "thank-you" | "submit-error";

export function App() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const total = boomBalloonsQuestionnaire.length;
  const currentQuestion = boomBalloonsQuestionnaire[stepIndex];

  // Every screen (welcome, each question, thank-you) should start scrolled
  // to the top — otherwise a tall question that required scrolling leaves
  // the next screen loaded mid-scroll, hiding its headline under the
  // sticky header.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
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
    setStage("submitting");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_slug: FORM_SLUG,
          form_version: FORM_VERSION,
          client_name: CLIENT_NAME,
          answers,
        }),
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
      {(stage === "welcome" || stage === "thank-you" || stage === "submit-error") && <Header />}

      {stage === "welcome" && (
        <WelcomeScreen questionCount={total} onStart={() => setStage("questions")} />
      )}

      {stage === "questions" && (
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

      {stage === "thank-you" && <ThankYouScreen />}

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
