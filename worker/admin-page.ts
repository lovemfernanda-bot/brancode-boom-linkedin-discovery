import { boomBalloonsQuestionnaire } from "../src/content/boomBalloonsQuestionnaire";
import { CLIENT_NAME } from "../src/content/formMeta";

const SHARED_HEAD = `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
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
  }
  .logo { font-family: var(--font-serif); font-weight: 700; font-size: 1.25rem; }
  .logo em { font-style: italic; font-weight: 600; }
</style>
`;

/**
 * Login screen shown at /admin when there is no valid session cookie.
 * Submits the password to /api/admin/login; on success the server sets an
 * HttpOnly session cookie and this page reloads into the authenticated view.
 */
export function renderAdminLoginPage(): string {
  return `<!doctype html>
<html lang="es">
<head>
${SHARED_HEAD}
<title>Acceso — LinkedIn Discovery · ${CLIENT_NAME}</title>
<style>
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .card {
    background: #fff;
    border: 1px solid var(--color-bg-subtle);
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 26rem;
  }
  h1 {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 1.75rem;
    margin: 1.25rem 0 0.35rem;
  }
  .subtitle { color: var(--color-ink-soft); margin: 0 0 1.75rem; }
  label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }
  input[type="password"] {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border: 1.5px solid var(--color-bg-subtle);
    border-radius: 10px;
    font-size: 1rem;
    font-family: inherit;
  }
  input[type="password"]:focus { outline: 2px solid var(--color-coral); border-color: var(--color-coral); }
  button {
    margin-top: 1.25rem;
    width: 100%;
    background: var(--color-ink);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.85rem;
    font-family: inherit;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
  button:hover { background: var(--color-coral); color: var(--color-ink); }
  button:disabled { opacity: 0.6; cursor: default; }
  .error { color: #c7503f; font-size: 0.9rem; margin-top: 1rem; display: none; }
</style>
</head>
<body>
  <div class="card">
    <span class="logo">Bran<em>Code</em></span>
    <h1>Acceso de administración</h1>
    <p class="subtitle">Respuestas de LinkedIn Discovery — ${CLIENT_NAME}</p>
    <form id="login-form">
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" autocomplete="current-password" autofocus required />
      <button type="submit" id="submit-btn">Entrar</button>
      <p class="error" id="error-msg">Contraseña incorrecta. Inténtalo de nuevo.</p>
    </form>
  </div>
  <script>
    const form = document.getElementById("login-form");
    const errorMsg = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorMsg.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Entrando...";
      try {
        const password = document.getElementById("password").value;
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (response.ok) {
          window.location.reload();
          return;
        }
        errorMsg.style.display = "block";
      } catch {
        errorMsg.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Authenticated admin view. Only rendered by the Worker after it has
 * verified the session cookie server-side (see worker/index.ts) — this
 * function itself performs no access control.
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
${SHARED_HEAD}
<title>Respuestas — LinkedIn Discovery · ${CLIENT_NAME}</title>
<style>
  body { padding: 2rem clamp(1.25rem, 5vw, 4rem) 4rem; }
  header {
    margin-bottom: 2rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h1 { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.75rem, 3vw, 2.5rem); margin: 1rem 0 0.25rem; }
  .subtitle { color: var(--color-ink-soft); margin: 0; }
  #logout-btn {
    background: none;
    border: 1.5px solid var(--color-bg-subtle);
    border-radius: 999px;
    padding: 0.5rem 1.1rem;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-ink-soft);
    cursor: pointer;
    white-space: nowrap;
  }
  #logout-btn:hover { border-color: var(--color-coral); color: var(--color-ink); }
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
    <div>
      <span class="logo">Bran<em>Code</em></span>
      <h1>Respuestas de LinkedIn Discovery</h1>
      <p class="subtitle">${CLIENT_NAME}</p>
    </div>
    <button type="button" id="logout-btn">Cerrar sesión</button>
  </header>
  <div id="status">Cargando respuestas...</div>
  <div id="list"></div>

  <script>
    const QUESTIONS = ${questionsJson};

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.reload();
    });

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
        if (response.status === 401) {
          window.location.reload();
          return;
        }
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
