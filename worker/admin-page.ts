import { boomBalloonsQuestionnaire } from "../src/content/boomBalloonsQuestionnaire";
import { CLIENT_NAME, FORM_SLUG, FORM_VERSION } from "../src/content/formMeta";

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
  button { font-family: inherit; cursor: pointer; }
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
  button[type="submit"] {
    margin-top: 1.25rem;
    width: 100%;
    background: var(--color-ink);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.85rem;
    font-weight: 600;
    font-size: 1rem;
  }
  button[type="submit"]:hover { background: var(--color-coral); color: var(--color-ink); }
  button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
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
 * BranCode OS V1 admin shell: sidebar navigation (Inicio / Formularios /
 * Respuestas / Papelera) plus a submission detail view, all rendered
 * client-side inside one page — intentionally plain DOM + fetch (no
 * framework/build step) since this is still a small internal tool. Adding a
 * future section later is one sidebar entry + one render function.
 *
 * Only rendered by the Worker after it has verified the session cookie
 * server-side (see worker/index.ts) — this function performs no access
 * control itself.
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
  const formMetaJson = JSON.stringify({ slug: FORM_SLUG, version: FORM_VERSION, clientName: CLIENT_NAME });

  return `<!doctype html>
<html lang="es">
<head>
${SHARED_HEAD}
<title>BranCode OS — ${CLIENT_NAME}</title>
<style>
  html, body { height: 100%; }
  .shell { display: flex; min-height: 100vh; }

  .sidebar {
    width: 15rem;
    flex: none;
    background: #fff;
    border-right: 1px solid var(--color-bg-subtle);
    padding: 1.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .sidebar-top { display: flex; flex-direction: column; gap: 2rem; }
  .os-tag { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-ink-faint); margin-top: 0.2rem; }
  .nav { display: flex; flex-direction: column; gap: 0.25rem; }
  .nav-link {
    display: block;
    background: none;
    border: none;
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-ink-soft);
  }
  .nav-link:hover { background: var(--color-bg); color: var(--color-ink); }
  .nav-link.active { background: var(--color-ink); color: var(--color-bg); font-weight: 600; }
  #logout-btn {
    background: none;
    border: 1.5px solid var(--color-bg-subtle);
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-ink-soft);
  }
  #logout-btn:hover { border-color: var(--color-coral); color: var(--color-ink); }

  main {
    flex: 1;
    padding: 2.5rem clamp(1.5rem, 4vw, 3.5rem);
    max-width: 64rem;
  }
  .page-title { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.6rem, 2.6vw, 2.1rem); margin: 0 0 0.25rem; }
  .page-subtitle { color: var(--color-ink-soft); margin: 0 0 2rem; }

  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
  .stat-card { background: #fff; border: 1px solid var(--color-bg-subtle); border-radius: 14px; padding: 1.25rem 1.5rem; }
  .stat-value { font-family: var(--font-serif); font-weight: 600; font-size: 2.25rem; }
  .stat-label { color: var(--color-ink-soft); font-size: 0.9rem; margin-top: 0.15rem; }

  .section-heading { font-family: var(--font-serif); font-weight: 600; font-size: 1.25rem; margin: 0 0 1rem; }

  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--color-bg-subtle); border-radius: 14px; overflow: hidden; }
  th, td { text-align: left; padding: 0.85rem 1rem; font-size: 0.92rem; border-bottom: 1px solid var(--color-bg-subtle); }
  th { color: var(--color-ink-faint); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
  tr:last-child td { border-bottom: none; }
  .row-actions { display: flex; gap: 0.75rem; white-space: nowrap; }
  .link-btn { background: none; border: none; padding: 0; font-size: 0.88rem; font-weight: 600; color: var(--color-ink-soft); }
  .link-btn:hover { color: var(--color-ink); text-decoration: underline; }
  .link-btn.danger { color: var(--color-coral); }
  .link-btn.danger:hover { color: #c7503f; }

  .badge { display: inline-block; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .badge-nuevo { background: var(--color-yellow); color: var(--color-ink); }
  .badge-revisado { background: var(--color-bg-subtle); color: var(--color-ink-soft); }

  .empty-state { color: var(--color-ink-faint); padding: 2rem 0; }
  .error-state { color: #c7503f; padding: 1rem 0; }
  .loading-state { color: var(--color-ink-faint); padding: 1rem 0; }

  .back-btn { background: none; border: none; padding: 0; margin-bottom: 1.25rem; font-size: 0.9rem; font-weight: 600; color: var(--color-ink-soft); }
  .back-btn:hover { color: var(--color-ink); }

  .detail-card { background: #fff; border: 1px solid var(--color-bg-subtle); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; }
  .detail-meta { color: var(--color-ink-soft); margin: 0.25rem 0 1rem; }
  .detail-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; }
  .btn { border-radius: 999px; padding: 0.6rem 1.2rem; font-size: 0.9rem; font-weight: 600; border: 1.5px solid var(--color-bg-subtle); background: #fff; color: var(--color-ink); }
  .btn:hover { border-color: var(--color-ink); }
  .btn-danger { border-color: transparent; background: var(--color-coral); color: var(--color-ink); }
  .btn-danger:hover { background: #f9695a; }

  .qa { padding: 1.1rem 0; border-bottom: 1px dashed var(--color-bg-subtle); }
  .qa:last-child { border-bottom: none; }
  .qa-question { font-weight: 600; margin: 0 0 0.35rem; }
  .qa-answer { margin: 0; color: var(--color-ink-soft); white-space: pre-wrap; }
  .qa-empty { color: var(--color-ink-faint); font-style: italic; }

  form-card { }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center; padding: 1.5rem; z-index: 50;
  }
  .modal-box { background: #fff; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 26rem; }
  .modal-title { font-family: var(--font-serif); font-weight: 600; font-size: 1.3rem; margin: 0 0 0.6rem; }
  .modal-message { color: var(--color-ink-soft); margin: 0; line-height: 1.5; }
  .modal-error { color: #c7503f; font-size: 0.88rem; margin: 0.75rem 0 0; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

  #toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 60; display: flex; flex-direction: column; gap: 0.5rem; }
  .toast { background: var(--color-ink); color: var(--color-bg); padding: 0.75rem 1.1rem; border-radius: 10px; font-size: 0.88rem; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }

  @media (max-width: 780px) {
    .shell { flex-direction: column; }
    .sidebar { width: 100%; height: auto; position: static; flex-direction: row; align-items: center; padding: 1rem 1.25rem; }
    .sidebar-top { flex-direction: row; align-items: center; gap: 1.25rem; }
    .nav { flex-direction: row; flex-wrap: wrap; }
    main { padding: 1.5rem 1.25rem 3rem; max-width: none; }
    table, thead, tbody, th, td, tr { display: block; }
    thead { display: none; }
    tr { background: #fff; border: 1px solid var(--color-bg-subtle); border-radius: 12px; margin-bottom: 0.75rem; padding: 0.5rem 0; }
    td { border-bottom: none; padding: 0.4rem 1rem; }
    td::before { content: attr(data-label); display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-ink-faint); margin-bottom: 0.15rem; }
  }
</style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div>
          <span class="logo">Bran<em>Code</em></span>
          <div class="os-tag">BranCode OS</div>
        </div>
        <nav class="nav" id="nav"></nav>
      </div>
      <button type="button" id="logout-btn">Cerrar sesión</button>
    </aside>
    <main id="main"></main>
  </div>
  <div id="toast-container"></div>

  <script>
    const QUESTIONS = ${questionsJson};
    const FORM_META = ${formMetaJson};
    const NAV_ITEMS = [
      { key: "inicio", label: "Inicio" },
      { key: "formularios", label: "Formularios" },
      { key: "respuestas", label: "Respuestas" },
      { key: "papelera", label: "Papelera" },
    ];

    let activeSubmissions = null;
    let trashedSubmissions = null;
    let currentSection = "inicio";
    let currentDetail = null; // { id, trashed }

    function el(tag, props, children) {
      const node = document.createElement(tag);
      for (const [key, value] of Object.entries(props || {})) {
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.startsWith("on") && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          node.setAttribute(key, value);
        }
      }
      for (const child of [].concat(children || [])) {
        if (child == null) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      }
      return node;
    }

    function formatDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
      } catch {
        return iso;
      }
    }

    function formLabel(slug) {
      return slug === FORM_META.slug ? "LinkedIn Discovery" : slug;
    }

    function optionLabel(question, optionId) {
      const option = (question.options || []).find((o) => o.id === optionId);
      return option ? option.label : optionId;
    }

    async function api(path, options) {
      const response = await fetch(path, {
        ...options,
        headers: { "Content-Type": "application/json", ...((options && options.headers) || {}) },
      });
      if (response.status === 401) {
        window.location.reload();
        throw new Error("Sesión expirada.");
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Ocurrió un error.");
      }
      return data;
    }

    async function loadActive() {
      const data = await api("/api/admin/submissions");
      activeSubmissions = data.submissions;
      return activeSubmissions;
    }

    async function loadTrashed() {
      const data = await api("/api/admin/submissions?trashed=true");
      trashedSubmissions = data.submissions;
      return trashedSubmissions;
    }

    function showToast(message) {
      const container = document.getElementById("toast-container");
      const toast = el("div", { class: "toast", text: message });
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }

    function closeModal() {
      const overlay = document.getElementById("modal-overlay");
      if (overlay) overlay.remove();
      document.removeEventListener("keydown", handleModalEscape);
    }

    function handleModalEscape(event) {
      if (event.key === "Escape") closeModal();
    }

    function openModal(options) {
      closeModal();
      const errorEl = el("p", { class: "modal-error" });
      errorEl.style.display = "none";

      const confirmBtn = el("button", {
        class: options.destructive ? "btn btn-danger" : "btn",
        text: options.confirmLabel,
      });
      confirmBtn.addEventListener("click", async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Procesando...";
        try {
          await options.onConfirm();
          closeModal();
        } catch (error) {
          errorEl.textContent = error.message || "Ocurrió un error.";
          errorEl.style.display = "block";
          confirmBtn.disabled = false;
          confirmBtn.textContent = options.confirmLabel;
        }
      });

      const cancelBtn = el("button", { class: "btn", text: options.cancelLabel || "Cancelar", onClick: closeModal });

      const box = el("div", { class: "modal-box" }, [
        el("h2", { class: "modal-title", text: options.title }),
        el("p", { class: "modal-message", text: options.message }),
        errorEl,
        el("div", { class: "modal-actions" }, [cancelBtn, confirmBtn]),
      ]);

      const overlay = el("div", { class: "modal-overlay", id: "modal-overlay" });
      overlay.appendChild(box);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
      });
      document.body.appendChild(overlay);
      document.addEventListener("keydown", handleModalEscape);
    }

    function confirmDelete(submission) {
      openModal({
        title: "¿Eliminar esta respuesta?",
        message:
          submission.client_name + " · " + formatDate(submission.created_at) +
          ". Se moverá a la Papelera y podrás restaurarla más tarde.",
        confirmLabel: "Eliminar",
        destructive: true,
        onConfirm: async () => {
          await api("/api/admin/submissions/" + submission.id + "/delete", { method: "POST" });
          await loadActive();
          currentDetail = null;
          currentSection = "respuestas";
          renderApp();
          showToast("Respuesta eliminada.");
        },
      });
    }

    function confirmPermanentDelete(submission) {
      openModal({
        title: "Eliminar permanentemente",
        message:
          "Esta acción no se puede deshacer. Se eliminará para siempre la respuesta de " +
          submission.client_name + " (" + formatDate(submission.created_at) + ").",
        confirmLabel: "Eliminar para siempre",
        destructive: true,
        onConfirm: async () => {
          await api("/api/admin/submissions/" + submission.id, { method: "DELETE" });
          await loadTrashed();
          currentDetail = null;
          currentSection = "papelera";
          renderApp();
          showToast("Respuesta eliminada permanentemente.");
        },
      });
    }

    async function handleRestore(submission) {
      await api("/api/admin/submissions/" + submission.id + "/restore", { method: "POST" });
      await Promise.all([loadActive(), loadTrashed()]);
      currentDetail = null;
      renderApp();
      showToast("Respuesta restaurada.");
    }

    async function toggleStatus(submission) {
      const nextStatus = submission.status === "revisado" ? "nuevo" : "revisado";
      await api("/api/admin/submissions/" + submission.id + "/status", {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadActive();
      renderApp();
    }

    function statusBadge(status) {
      const label = status === "revisado" ? "Revisada" : "Nueva";
      return el("span", { class: "badge badge-" + status, text: label });
    }

    function renderNav() {
      const nav = document.getElementById("nav");
      nav.innerHTML = "";
      for (const item of NAV_ITEMS) {
        const isActive = currentSection === item.key && !currentDetail;
        const btn = el("button", {
          class: "nav-link" + (isActive ? " active" : ""),
          text: item.label,
          onClick: () => {
            currentSection = item.key;
            currentDetail = null;
            renderApp();
          },
        });
        nav.appendChild(btn);
      }
    }

    function renderInicio(main) {
      main.appendChild(el("h1", { class: "page-title", text: "Inicio" }));
      main.appendChild(el("p", { class: "page-subtitle", text: "Resumen de " + FORM_META.clientName }));

      const now = new Date();
      const thisMonthCount = activeSubmissions.filter((s) => {
        const d = new Date(s.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

      const grid = el("div", { class: "stat-grid" }, [
        el("div", { class: "stat-card" }, [
          el("div", { class: "stat-value", text: String(activeSubmissions.length) }),
          el("div", { class: "stat-label", text: "Respuestas totales" }),
        ]),
        el("div", { class: "stat-card" }, [
          el("div", { class: "stat-value", text: String(thisMonthCount) }),
          el("div", { class: "stat-label", text: "Respuestas este mes" }),
        ]),
      ]);
      main.appendChild(grid);

      main.appendChild(el("h2", { class: "section-heading", text: "Últimas respuestas" }));
      if (activeSubmissions.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "Todavía no hay respuestas." }));
      } else {
        main.appendChild(buildSubmissionsTable(activeSubmissions.slice(0, 5), { trashed: false, compact: true }));
      }

      main.appendChild(el("h2", { class: "section-heading", text: "Formularios activos" }));
      const formCounts = {};
      for (const s of activeSubmissions) formCounts[s.form_slug] = (formCounts[s.form_slug] || 0) + 1;
      const slugs = Object.keys(formCounts).length > 0 ? Object.keys(formCounts) : [FORM_META.slug];
      const formsGrid = el("div", { class: "stat-grid" });
      for (const slug of slugs) {
        formsGrid.appendChild(
          el("div", { class: "stat-card" }, [
            el("div", { class: "stat-value", text: String(formCounts[slug] || 0) }),
            el("div", { class: "stat-label", text: formLabel(slug) }),
          ]),
        );
      }
      main.appendChild(formsGrid);
    }

    function renderFormularios(main) {
      main.appendChild(el("h1", { class: "page-title", text: "Formularios" }));
      main.appendChild(el("p", { class: "page-subtitle", text: "Formularios de " + FORM_META.clientName }));

      const slugSubmissions = activeSubmissions.filter((s) => s.form_slug === FORM_META.slug);
      const dates = slugSubmissions.map((s) => s.created_at).sort();
      const first = dates[0];
      const last = dates[dates.length - 1];

      const card = el("div", { class: "detail-card" }, [
        el("h2", { class: "section-heading", text: formLabel(FORM_META.slug) }),
        el("p", { class: "detail-meta", text: "form_slug: " + FORM_META.slug + " · versión " + FORM_META.version }),
        el("p", { class: "detail-meta", text: slugSubmissions.length + " respuesta(s) activas" }),
        first ? el("p", { class: "detail-meta", text: "Primera respuesta: " + formatDate(first) }) : null,
        last ? el("p", { class: "detail-meta", text: "Última respuesta: " + formatDate(last) }) : null,
      ]);
      main.appendChild(card);
    }

    function buildSubmissionsTable(rows, opts) {
      const table = el("table");
      const theadRow = el("tr", {}, [
        el("th", { text: "Cliente" }),
        el("th", { text: "Formulario" }),
        el("th", { text: opts.trashed ? "Eliminada" : "Fecha" }),
        el("th", { text: "Contacto" }),
        opts.trashed ? null : el("th", { text: "Estado" }),
        el("th", { text: "" }),
      ]);
      table.appendChild(el("thead", {}, [theadRow]));

      const tbody = el("tbody");
      for (const submission of rows) {
        const viewBtn = el("button", {
          class: "link-btn",
          text: "Ver",
          onClick: () => {
            currentDetail = { id: submission.id, trashed: !!opts.trashed };
            renderApp();
          },
        });

        const actions = el("div", { class: "row-actions" }, [viewBtn]);
        if (!opts.compact) {
          if (opts.trashed) {
            actions.appendChild(
              el("button", { class: "link-btn", text: "Restaurar", onClick: () => handleRestore(submission) }),
            );
            actions.appendChild(
              el("button", {
                class: "link-btn danger",
                text: "Eliminar permanentemente",
                onClick: () => confirmPermanentDelete(submission),
              }),
            );
          } else {
            actions.appendChild(
              el("button", {
                class: "link-btn danger",
                text: "Eliminar",
                onClick: () => confirmDelete(submission),
              }),
            );
          }
        }

        const cells = [
          el("td", { "data-label": "Cliente", text: submission.client_name }),
          el("td", { "data-label": "Formulario", text: formLabel(submission.form_slug) }),
          el("td", { "data-label": opts.trashed ? "Eliminada" : "Fecha", text: formatDate(opts.trashed ? submission.deleted_at : submission.created_at) }),
          el("td", { "data-label": "Contacto", text: submission.contact_email || "—" }),
        ];
        if (!opts.trashed) {
          const statusCell = el("td", { "data-label": "Estado" });
          statusCell.appendChild(statusBadge(submission.status));
          cells.push(statusCell);
        }
        cells.push(el("td", { "data-label": "" }, [actions]));

        tbody.appendChild(el("tr", {}, cells));
      }
      table.appendChild(tbody);
      return table;
    }

    function renderRespuestas(main) {
      main.appendChild(el("h1", { class: "page-title", text: "Respuestas" }));
      main.appendChild(el("p", { class: "page-subtitle", text: "Todas las respuestas activas, más recientes primero" }));
      if (activeSubmissions.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "Todavía no hay respuestas." }));
        return;
      }
      main.appendChild(buildSubmissionsTable(activeSubmissions, { trashed: false }));
    }

    function renderPapelera(main) {
      main.appendChild(el("h1", { class: "page-title", text: "Papelera" }));
      main.appendChild(el("p", { class: "page-subtitle", text: "Respuestas eliminadas — puedes restaurarlas o borrarlas para siempre" }));

      if (trashedSubmissions === null) {
        main.appendChild(el("p", { class: "loading-state", text: "Cargando..." }));
        loadTrashed()
          .then(renderApp)
          .catch((error) => {
            main.innerHTML = "";
            main.appendChild(el("p", { class: "error-state", text: error.message }));
          });
        return;
      }

      if (trashedSubmissions.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "La papelera está vacía." }));
        return;
      }
      main.appendChild(buildSubmissionsTable(trashedSubmissions, { trashed: true }));
    }

    function renderDetail(main, ref) {
      const source = ref.trashed ? trashedSubmissions : activeSubmissions;
      const submission = (source || []).find((s) => s.id === ref.id);

      main.appendChild(
        el("button", {
          class: "back-btn",
          text: "← Volver",
          onClick: () => {
            currentDetail = null;
            renderApp();
          },
        }),
      );

      if (!submission) {
        main.appendChild(el("p", { class: "error-state", text: "No se encontró esta respuesta." }));
        return;
      }

      const card = el("div", { class: "detail-card" });
      card.appendChild(el("h1", { class: "page-title", text: submission.client_name }));
      card.appendChild(
        el("p", { class: "detail-meta", text: formLabel(submission.form_slug) + " · " + formatDate(submission.created_at) }),
      );
      if (submission.contact_email) {
        card.appendChild(el("p", { class: "detail-meta", text: submission.contact_email }));
      }
      if (!ref.trashed) {
        card.appendChild(statusBadge(submission.status));
      }

      for (const question of QUESTIONS) {
        const qa = el("div", { class: "qa" });
        qa.appendChild(el("p", { class: "qa-question", text: question.question }));
        const value = submission.answers[question.id];
        let answerText = "";
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          qa.appendChild(el("p", { class: "qa-answer qa-empty", text: "Sin respuesta" }));
        } else {
          answerText = Array.isArray(value) ? value.map((id) => optionLabel(question, id)).join(", ") : String(value);
          qa.appendChild(el("p", { class: "qa-answer", text: answerText }));
        }
        card.appendChild(qa);
      }

      const actions = el("div", { class: "detail-actions" });
      if (ref.trashed) {
        actions.appendChild(el("button", { class: "btn", text: "Restaurar", onClick: () => handleRestore(submission) }));
        actions.appendChild(
          el("button", {
            class: "btn btn-danger",
            text: "Eliminar permanentemente",
            onClick: () => confirmPermanentDelete(submission),
          }),
        );
      } else {
        actions.appendChild(
          el("button", {
            class: "btn",
            text: submission.status === "revisado" ? "Marcar como nueva" : "Marcar como revisada",
            onClick: () => toggleStatus(submission),
          }),
        );
        actions.appendChild(
          el("button", { class: "btn btn-danger", text: "Eliminar", onClick: () => confirmDelete(submission) }),
        );
      }
      card.appendChild(actions);
      main.appendChild(card);
    }

    function renderApp() {
      renderNav();
      const main = document.getElementById("main");
      main.innerHTML = "";

      if (activeSubmissions === null) {
        main.appendChild(el("p", { class: "loading-state", text: "Cargando..." }));
        return;
      }

      if (currentDetail) {
        renderDetail(main, currentDetail);
        return;
      }

      if (currentSection === "inicio") renderInicio(main);
      else if (currentSection === "formularios") renderFormularios(main);
      else if (currentSection === "respuestas") renderRespuestas(main);
      else if (currentSection === "papelera") renderPapelera(main);
    }

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.reload();
    });

    renderApp();
    loadActive()
      .then(renderApp)
      .catch((error) => {
        const main = document.getElementById("main");
        main.innerHTML = "";
        main.appendChild(el("p", { class: "error-state", text: error.message }));
      });
  </script>
</body>
</html>`;
}
