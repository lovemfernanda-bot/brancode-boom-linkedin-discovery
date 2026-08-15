import { boomBalloonsQuestionnaire } from "../src/content/boomBalloonsQuestionnaire";
import { CLIENT_NAME } from "../src/content/formMeta";

/**
 * Renders the internal admin page as a single self-contained HTML string.
 * No client-side framework, no build step — this is intentionally a plain
 * static page with a small inline script, since it only needs to list and
 * display submissions. Access control is handled entirely by Cloudflare
 * Access in front of /admin and /api/admin/*, not by this page.
 */
export function renderAdminPage(): string {
  const questionsJson = JSON.stringify(
    boomBalloonsQuestionnaire.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options ?? null,
    })),
  );

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Respuestas — LinkedIn Discovery · ${CLIENT_NAME}</title>
<meta name="robots" content="noindex, nofollow" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,500&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --color-bg: #f6f4f1;
    --color-bg-subtle: #e4ded2;
    --color-coral: #f98174;
    --color-yellow: #fff0b1;
    --color-ink: #000000;
    --color-ink-soft: rgba(0,0,0,0.62);
    --color-ink-faint: rgba(0,0,0,0.4);
    --font-serif: "Playfair Display", Georgia, serif;
    --font-sans: "Poppins", -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-sans);
    padding: 2rem clamp(1.25rem, 5vw, 4rem) 4rem;
  }
  header { margin-bottom: 2rem; }
  .logo { font-family: var(--font-serif); font-weight: 700; font-size: 1.25rem; }
  .logo em { font-style: italic; font-weight: 600; }
  h1 { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.75rem, 3vw, 2.5rem); margin: 1rem 0 0.25rem; }
  .subtitle { color: var(--color-ink-soft); margin: 0; }
  #status { color: var(--color-ink-faint); margin: 1.5rem 0; }
  .card {
    background: #fff;
    border: 1px solid var(--color-bg-subtle);
    border-radius: 14px;
    margin-bottom: 1rem;
    overflow: hidden;
  }
  .card summary {
    cursor: pointer;
    padding: 1rem 1.25rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    list-style: none;
  }
  .card summary::-webkit-details-marker { display: none; }
  .card summary::marker { content: ""; }
  .meta-date { font-weight: 600; }
  .meta-email { color: var(--color-ink-soft); font-size: 0.9rem; }
  .badge {
    margin-left: auto;
    font-size: 0.75rem;
    background: var(--color-yellow);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-weight: 600;
  }
  .answers { padding: 0 1.25rem 1.25rem; border-top: 1px solid var(--color-bg-subtle); }
  .qa { padding: 1rem 0; border-bottom: 1px dashed var(--color-bg-subtle); }
  .qa:last-child { border-bottom: none; }
  .qa-question { font-weight: 600; margin: 0 0 0.35rem; }
  .qa-answer { margin: 0; color: var(--color-ink-soft); white-space: pre-wrap; }
  .qa-empty { color: var(--color-ink-faint); font-style: italic; }
  .empty-state { color: var(--color-ink-faint); padding: 2rem 0; }
  .error-state { color: #c7503f; padding: 1rem 0; }
</style>
</head>
<body>
  <header>
    <span class="logo">Bran<em>Code</em></span>
    <h1>Respuestas de LinkedIn Discovery</h1>
    <p class="subtitle">${CLIENT_NAME}</p>
  </header>
  <div id="status">Cargando respuestas...</div>
  <div id="list"></div>

  <script>
    const QUESTIONS = ${questionsJson};
    const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

    function formatDate(iso) {
      try {
        return new Date(iso).toLocaleString("es-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return iso;
      }
    }

    function optionLabel(question, optionId) {
      const option = (question.options || []).find((o) => o.id === optionId);
      return option ? option.label : optionId;
    }

    function renderAnswer(question, value) {
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        const el = document.createElement("p");
        el.className = "qa-answer qa-empty";
        el.textContent = "Sin respuesta";
        return el;
      }
      const el = document.createElement("p");
      el.className = "qa-answer";
      if (Array.isArray(value)) {
        el.textContent = value.map((id) => optionLabel(question, id)).join(", ");
      } else {
        el.textContent = String(value);
      }
      return el;
    }

    function renderSubmission(submission) {
      const details = document.createElement("details");
      details.className = "card";

      const summary = document.createElement("summary");

      const dateEl = document.createElement("span");
      dateEl.className = "meta-date";
      dateEl.textContent = formatDate(submission.created_at);
      summary.appendChild(dateEl);

      if (submission.contact_email) {
        const emailEl = document.createElement("span");
        emailEl.className = "meta-email";
        emailEl.textContent = submission.contact_email;
        summary.appendChild(emailEl);
      }

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Ver respuestas";
      summary.appendChild(badge);

      details.appendChild(summary);

      const answersWrap = document.createElement("div");
      answersWrap.className = "answers";

      for (const question of QUESTIONS) {
        const qa = document.createElement("div");
        qa.className = "qa";

        const qEl = document.createElement("p");
        qEl.className = "qa-question";
        qEl.textContent = question.question;
        qa.appendChild(qEl);

        qa.appendChild(renderAnswer(question, submission.answers[question.id]));
        answersWrap.appendChild(qa);
      }

      details.appendChild(answersWrap);
      return details;
    }

    async function load() {
      const statusEl = document.getElementById("status");
      const listEl = document.getElementById("list");
      try {
        const response = await fetch("/api/admin/submissions");
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        if (!data.ok) throw new Error(data.error || "Error desconocido");

        if (data.submissions.length === 0) {
          statusEl.textContent = "";
          listEl.innerHTML = "";
          const empty = document.createElement("p");
          empty.className = "empty-state";
          empty.textContent = "Todavía no hay respuestas.";
          listEl.appendChild(empty);
          return;
        }

        statusEl.textContent = data.submissions.length + " respuesta(s)";
        listEl.innerHTML = "";
        for (const submission of data.submissions) {
          listEl.appendChild(renderSubmission(submission));
        }
      } catch (error) {
        statusEl.textContent = "";
        const errorEl = document.createElement("p");
        errorEl.className = "error-state";
        errorEl.textContent = "No se pudieron cargar las respuestas. Intenta recargar la página.";
        listEl.appendChild(errorEl);
      }
    }

    load();
  </script>
</body>
</html>`;
}
