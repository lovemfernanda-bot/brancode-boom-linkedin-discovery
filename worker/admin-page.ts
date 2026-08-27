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
<title>Acceso — BranCode OS</title>
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
  input[type="text"], input[type="password"] {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border: 1.5px solid var(--color-bg-subtle);
    border-radius: 10px;
    font-size: 1rem;
    font-family: inherit;
  }
  input[type="text"]:focus, input[type="password"]:focus {
    outline: 2px solid var(--color-coral);
    border-color: var(--color-coral);
  }
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
    <p class="subtitle">BranCode OS</p>
    <form id="login-form">
      <label for="username">Usuario</label>
      <input type="text" id="username" name="username" autocomplete="username" autofocus required />
      <label for="password" style="margin-top: 1rem;">Contraseña</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required />
      <button type="submit" id="submit-btn">Entrar</button>
      <p class="error" id="error-msg">Usuario o contraseña incorrectos. Inténtalo de nuevo.</p>
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
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
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
 * Respuestas / Papelera) plus a form builder and a submission detail view,
 * all rendered client-side inside one page — intentionally plain DOM +
 * fetch (no framework/build step) since this is still a small internal
 * tool. Adding a future section later is one sidebar entry + one render
 * function.
 *
 * Only rendered by the Worker after it has verified the session cookie
 * server-side (see worker/index.ts) — this function performs no access
 * control itself.
 */
export function renderAdminPage(): string {
  return `<!doctype html>
<html lang="es">
<head>
${SHARED_HEAD}
<title>BranCode OS</title>
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
    max-width: 68rem;
  }
  .page-title { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.6rem, 2.6vw, 2.1rem); margin: 0 0 0.25rem; }
  .page-subtitle { color: var(--color-ink-soft); margin: 0 0 2rem; }
  .section-header-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .section-header-row .page-title { margin-bottom: 0; }

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
  .btn-primary { border-color: transparent; background: var(--color-ink); color: var(--color-bg); }
  .btn-primary:hover { background: #262626; }
  .btn:disabled { opacity: 0.6; cursor: default; }

  .qa { padding: 1.1rem 0; border-bottom: 1px dashed var(--color-bg-subtle); }
  .qa:last-child { border-bottom: none; }
  .qa-question { font-weight: 600; margin: 0 0 0.35rem; }
  .qa-answer { margin: 0; color: var(--color-ink-soft); white-space: pre-wrap; }
  .qa-empty { color: var(--color-ink-faint); font-style: italic; }

  .form-card-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.25rem; }
  .form-card-header .section-heading { margin-bottom: 0; }
  .forms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
  .forms-grid .detail-card { margin-bottom: 0; }

  .field-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-ink-soft); margin: 1rem 0 0.4rem; }
  .field-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid var(--color-bg-subtle);
    border-radius: 10px;
    font-size: 0.95rem;
    font-family: inherit;
    background: #fff;
    color: var(--color-ink);
  }
  .field-input:focus { outline: 2px solid var(--color-coral); border-color: var(--color-coral); }
  .field-input-inline { width: auto; display: inline-block; }
  textarea.field-input { resize: vertical; }

  .ai-box { background: var(--color-bg); border: 1px dashed var(--color-bg-subtle); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; }
  .ai-box-label { font-weight: 600; margin: 0 0 0.25rem; }
  .ai-textarea { width: 100%; margin-top: 0.5rem; margin-bottom: 0.75rem; }

  .question-editor-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
  .question-editor-row { background: var(--color-bg); border: 1px solid var(--color-bg-subtle); border-radius: 14px; padding: 1.1rem; }
  .question-editor-index { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-ink-faint); margin-bottom: 0.5rem; }
  .question-editor-row .field-input { margin-bottom: 0.6rem; }
  .question-editor-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin: 0.5rem 0; }
  .checkbox-label { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: var(--color-ink-soft); }
  .options-editor { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.5rem 0; }
  .option-editor-row { display: flex; align-items: center; gap: 0.75rem; }
  .option-editor-row .field-input { margin-bottom: 0; }

  .filter-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
  .filter-label { font-size: 0.88rem; font-weight: 600; color: var(--color-ink-soft); }

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
    const ROOT_FORM_SLUG = "boom-balloons-linkedin-discovery";
    const NAV_ITEMS = [
      { key: "inicio", label: "Inicio" },
      { key: "formularios", label: "Formularios" },
      { key: "respuestas", label: "Respuestas" },
      { key: "papelera", label: "Papelera" },
    ];

    let activeSubmissions = null;
    let trashedSubmissions = null;
    let forms = null;
    let currentSection = "inicio";
    let currentDetail = null; // { id, trashed }
    let currentBuilder = null; // { formId: string|null, draft: {...}, aiText: string }
    let respuestasFormFilter = "all";

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

    function findForm(slug) {
      return (forms || []).find((f) => f.slug === slug) || null;
    }

    function formLabel(slug) {
      const form = findForm(slug);
      return form ? form.name : slug;
    }

    function publicPathFor(slug) {
      return slug === ROOT_FORM_SLUG ? "/" : "/f/" + encodeURIComponent(slug);
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

    async function loadForms() {
      const data = await api("/api/admin/forms");
      forms = data.forms;
      return forms;
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
        class: options.destructive ? "btn btn-danger" : "btn btn-primary",
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
            currentBuilder = null;
            renderApp();
          },
        });
        nav.appendChild(btn);
      }
    }

    function renderInicio(main) {
      main.appendChild(el("h1", { class: "page-title", text: "Inicio" }));
      main.appendChild(el("p", { class: "page-subtitle", text: "Resumen de BranCode OS" }));

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
      const activeForms = (forms || []).filter((f) => f.status === "activo");
      if (activeForms.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "Todavía no hay formularios." }));
      } else {
        const formsGrid = el("div", { class: "stat-grid" });
        for (const form of activeForms) {
          const count = activeSubmissions.filter((s) => s.form_slug === form.slug).length;
          formsGrid.appendChild(
            el("div", { class: "stat-card" }, [
              el("div", { class: "stat-value", text: String(count) }),
              el("div", { class: "stat-label", text: form.name }),
            ]),
          );
        }
        main.appendChild(formsGrid);
      }
    }

    // --- Formularios: list + builder (manual and/or AI-assisted) ---

    function newEmptyQuestion() {
      return {
        id: "q_" + Math.random().toString(36).slice(2, 10),
        type: "long-text",
        question: "",
        helper: "",
        required: true,
        options: [],
      };
    }

    function openBuilderForNew() {
      currentBuilder = {
        formId: null,
        draft: { name: "", clientName: "", status: "activo", questions: [newEmptyQuestion()] },
        aiText: "",
      };
      renderApp();
    }

    function openBuilderForEdit(form) {
      currentBuilder = {
        formId: form.id,
        draft: {
          name: form.name,
          clientName: form.clientName,
          status: form.status,
          questions: form.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            helper: q.helper || "",
            required: !!q.required,
            options: (q.options || []).map((o) => ({ id: o.id, label: o.label })),
          })),
        },
        aiText: "",
      };
      renderApp();
    }

    function closeBuilder() {
      currentBuilder = null;
      renderApp();
    }

    function validateDraftClientSide(draft) {
      if (!draft.name.trim()) return "Ponle un nombre al formulario.";
      if (!draft.clientName.trim()) return "Indica el nombre del cliente.";
      if (draft.questions.length === 0) return "Agrega al menos una pregunta.";
      for (let i = 0; i < draft.questions.length; i++) {
        const q = draft.questions[i];
        if (!q.question.trim()) return "La pregunta " + (i + 1) + " necesita un texto.";
        if (q.type === "single-choice" || q.type === "multi-select") {
          const validOptions = (q.options || []).filter((o) => o.label.trim());
          if (validOptions.length < 2) return "La pregunta " + (i + 1) + " necesita al menos dos opciones.";
        }
      }
      return null;
    }

    function renderQuestionEditor(q, index, draft) {
      const row = el("div", { class: "question-editor-row" });
      row.appendChild(el("div", { class: "question-editor-index", text: "Pregunta " + (index + 1) }));

      const textInput = el("textarea", { class: "field-input", rows: "2", placeholder: "Escribe la pregunta..." });
      textInput.value = q.question;
      textInput.addEventListener("input", (e) => {
        q.question = e.target.value;
      });
      row.appendChild(textInput);

      const helperInput = el("input", { type: "text", class: "field-input", placeholder: "Texto de ayuda (opcional)" });
      helperInput.value = q.helper || "";
      helperInput.addEventListener("input", (e) => {
        q.helper = e.target.value;
      });
      row.appendChild(helperInput);

      const controlsRow = el("div", { class: "question-editor-controls" });

      const typeSelect = el("select", { class: "field-input field-input-inline" });
      for (const [value, label] of [
        ["long-text", "Texto largo"],
        ["single-choice", "Opción única"],
        ["multi-select", "Selección múltiple"],
      ]) {
        const opt = el("option", { value, text: label });
        if (q.type === value) opt.setAttribute("selected", "selected");
        typeSelect.appendChild(opt);
      }
      typeSelect.addEventListener("change", (e) => {
        q.type = e.target.value;
        if ((q.type === "single-choice" || q.type === "multi-select") && (!q.options || q.options.length === 0)) {
          q.options = [
            { id: "opt_" + Math.random().toString(36).slice(2, 8), label: "" },
            { id: "opt_" + Math.random().toString(36).slice(2, 8), label: "" },
          ];
        }
        renderApp();
      });
      controlsRow.appendChild(typeSelect);

      const requiredLabel = el("label", { class: "checkbox-label" });
      const requiredCheckbox = el("input", { type: "checkbox" });
      requiredCheckbox.checked = q.required;
      requiredCheckbox.addEventListener("change", (e) => {
        q.required = e.target.checked;
      });
      requiredLabel.appendChild(requiredCheckbox);
      requiredLabel.appendChild(document.createTextNode(" Obligatoria"));
      controlsRow.appendChild(requiredLabel);

      if (index > 0) {
        controlsRow.appendChild(
          el("button", {
            class: "link-btn",
            text: "↑ Subir",
            onClick: () => {
              const tmp = draft.questions[index - 1];
              draft.questions[index - 1] = draft.questions[index];
              draft.questions[index] = tmp;
              renderApp();
            },
          }),
        );
      }
      if (index < draft.questions.length - 1) {
        controlsRow.appendChild(
          el("button", {
            class: "link-btn",
            text: "↓ Bajar",
            onClick: () => {
              const tmp = draft.questions[index + 1];
              draft.questions[index + 1] = draft.questions[index];
              draft.questions[index] = tmp;
              renderApp();
            },
          }),
        );
      }
      controlsRow.appendChild(
        el("button", {
          class: "link-btn danger",
          text: "Eliminar pregunta",
          onClick: () => {
            draft.questions.splice(index, 1);
            if (draft.questions.length === 0) draft.questions.push(newEmptyQuestion());
            renderApp();
          },
        }),
      );

      row.appendChild(controlsRow);

      if (q.type === "single-choice" || q.type === "multi-select") {
        const optionsWrap = el("div", { class: "options-editor" });
        (q.options || []).forEach((opt, optIndex) => {
          const optRow = el("div", { class: "option-editor-row" });
          const optInput = el("input", { type: "text", class: "field-input", placeholder: "Opción " + (optIndex + 1) });
          optInput.value = opt.label;
          optInput.addEventListener("input", (e) => {
            opt.label = e.target.value;
          });
          optRow.appendChild(optInput);
          optRow.appendChild(
            el("button", {
              class: "link-btn danger",
              text: "Quitar",
              onClick: () => {
                q.options.splice(optIndex, 1);
                renderApp();
              },
            }),
          );
          optionsWrap.appendChild(optRow);
        });
        row.appendChild(optionsWrap);
        row.appendChild(
          el("button", {
            class: "link-btn",
            text: "+ Añadir opción",
            onClick: () => {
              q.options = q.options || [];
              q.options.push({ id: "opt_" + Math.random().toString(36).slice(2, 8), label: "" });
              renderApp();
            },
          }),
        );
      }

      return row;
    }

    function renderFormBuilder(main) {
      const draft = currentBuilder.draft;
      const isEditing = currentBuilder.formId !== null;

      main.appendChild(el("button", { class: "back-btn", text: "← Volver a Formularios", onClick: closeBuilder }));
      main.appendChild(el("h1", { class: "page-title", text: isEditing ? "Editar formulario" : "Crear formulario" }));

      const card = el("div", { class: "detail-card" });

      const aiBox = el("div", { class: "ai-box" });
      aiBox.appendChild(el("p", { class: "ai-box-label", text: "Generar con IA (opcional)" }));
      aiBox.appendChild(
        el("p", {
          class: "detail-meta",
          text:
            "Pega aquí el texto de las preguntas (por ejemplo, lo que te dio ChatGPT). La IA llenará el " +
            "nombre, el cliente y las preguntas — podrás revisarlas y editarlas antes de guardar.",
        }),
      );
      const aiTextarea = el("textarea", { class: "field-input ai-textarea", rows: "5", placeholder: "Pega aquí el texto..." });
      aiTextarea.value = currentBuilder.aiText || "";
      aiTextarea.addEventListener("input", (e) => {
        currentBuilder.aiText = e.target.value;
      });
      aiBox.appendChild(aiTextarea);
      const aiError = el("p", { class: "modal-error" });
      aiError.style.display = "none";
      aiBox.appendChild(aiError);
      const aiBtn = el("button", { class: "btn", text: "Generar preguntas con IA" });
      aiBtn.addEventListener("click", async () => {
        aiBtn.disabled = true;
        aiBtn.textContent = "Generando...";
        aiError.style.display = "none";
        try {
          const data = await api("/api/admin/forms/generate", {
            method: "POST",
            body: JSON.stringify({ text: currentBuilder.aiText || "" }),
          });
          if (data.name) draft.name = data.name;
          if (data.clientName) draft.clientName = data.clientName;
          draft.questions = data.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            helper: q.helper || "",
            required: !!q.required,
            options: (q.options || []).map((o) => ({ id: o.id, label: o.label })),
          }));
          renderApp();
          showToast("Preguntas generadas. Revísalas antes de guardar.");
        } catch (error) {
          aiError.textContent = error.message;
          aiError.style.display = "block";
        } finally {
          aiBtn.disabled = false;
          aiBtn.textContent = "Generar preguntas con IA";
        }
      });
      aiBox.appendChild(aiBtn);
      card.appendChild(aiBox);

      card.appendChild(el("label", { class: "field-label", text: "Nombre del formulario" }));
      const nameInput = el("input", { type: "text", class: "field-input" });
      nameInput.value = draft.name;
      nameInput.addEventListener("input", (e) => {
        draft.name = e.target.value;
      });
      card.appendChild(nameInput);

      card.appendChild(el("label", { class: "field-label", text: "Nombre del cliente" }));
      const clientInput = el("input", { type: "text", class: "field-input" });
      clientInput.value = draft.clientName;
      clientInput.addEventListener("input", (e) => {
        draft.clientName = e.target.value;
      });
      card.appendChild(clientInput);

      if (isEditing) {
        card.appendChild(el("label", { class: "field-label", text: "Estado" }));
        const statusSelect = el("select", { class: "field-input" });
        for (const [value, label] of [
          ["activo", "Activo (visible públicamente)"],
          ["inactivo", "Inactivo (oculto)"],
        ]) {
          const opt = el("option", { value, text: label });
          if (draft.status === value) opt.setAttribute("selected", "selected");
          statusSelect.appendChild(opt);
        }
        statusSelect.addEventListener("change", (e) => {
          draft.status = e.target.value;
        });
        card.appendChild(statusSelect);
      }

      card.appendChild(el("h2", { class: "section-heading", text: "Preguntas" }));
      const questionsWrap = el("div", { class: "question-editor-list" });
      draft.questions.forEach((q, index) => questionsWrap.appendChild(renderQuestionEditor(q, index, draft)));
      card.appendChild(questionsWrap);

      card.appendChild(
        el("button", {
          class: "btn",
          text: "+ Añadir pregunta",
          onClick: () => {
            draft.questions.push(newEmptyQuestion());
            renderApp();
          },
        }),
      );

      const saveError = el("p", { class: "modal-error" });
      saveError.style.display = "none";

      const actionsRow = el("div", { class: "detail-actions" });
      const cancelBtn = el("button", { class: "btn", text: "Cancelar", onClick: closeBuilder });
      const saveBtn = el("button", { class: "btn btn-primary", text: "Guardar formulario" });
      saveBtn.addEventListener("click", async () => {
        const clientError = validateDraftClientSide(draft);
        if (clientError) {
          saveError.textContent = clientError;
          saveError.style.display = "block";
          return;
        }
        saveError.style.display = "none";
        saveBtn.disabled = true;
        saveBtn.textContent = "Guardando...";
        try {
          const payload = {
            name: draft.name,
            clientName: draft.clientName,
            questions: draft.questions,
            status: draft.status,
          };
          if (isEditing) {
            await api("/api/admin/forms/" + currentBuilder.formId, { method: "PATCH", body: JSON.stringify(payload) });
          } else {
            await api("/api/admin/forms", { method: "POST", body: JSON.stringify(payload) });
          }
          await loadForms();
          currentBuilder = null;
          renderApp();
          showToast(isEditing ? "Formulario actualizado." : "Formulario creado.");
        } catch (error) {
          saveError.textContent = error.message;
          saveError.style.display = "block";
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar formulario";
        }
      });
      actionsRow.appendChild(cancelBtn);
      actionsRow.appendChild(saveBtn);
      card.appendChild(saveError);
      card.appendChild(actionsRow);

      main.appendChild(card);
    }

    function renderFormCard(form) {
      const responseCount = (activeSubmissions || []).filter((s) => s.form_slug === form.slug).length;
      const path = publicPathFor(form.slug);

      const card = el("div", { class: "detail-card" });
      card.appendChild(
        el("div", { class: "form-card-header" }, [
          el("h2", { class: "section-heading", text: form.name }),
          el("span", {
            class: "badge " + (form.status === "activo" ? "badge-revisado" : "badge-nuevo"),
            text: form.status === "activo" ? "Activo" : "Inactivo",
          }),
        ]),
      );
      card.appendChild(el("p", { class: "detail-meta", text: form.clientName }));
      card.appendChild(
        el("p", { class: "detail-meta", text: form.questions.length + " pregunta(s) · " + responseCount + " respuesta(s)" }),
      );
      const linkRow = el("p", { class: "detail-meta" });
      linkRow.appendChild(document.createTextNode("Enlace público: "));
      linkRow.appendChild(el("a", { href: path, target: "_blank", rel: "noopener", text: window.location.origin + path }));
      card.appendChild(linkRow);
      card.appendChild(
        el("div", { class: "detail-actions" }, [
          el("button", { class: "btn", text: "Editar", onClick: () => openBuilderForEdit(form) }),
        ]),
      );
      return card;
    }

    function renderFormularios(main) {
      if (currentBuilder) {
        renderFormBuilder(main);
        return;
      }

      main.appendChild(
        el("div", { class: "section-header-row" }, [
          el("div", {}, [
            el("h1", { class: "page-title", text: "Formularios" }),
            el("p", { class: "page-subtitle", text: "Los formularios de BranCode OS", style: "margin:0" }),
          ]),
          el("button", { class: "btn btn-primary", text: "+ Crear formulario", onClick: openBuilderForNew }),
        ]),
      );

      if (!forms || forms.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "Todavía no hay formularios." }));
        return;
      }

      const grid = el("div", { class: "forms-grid" });
      for (const form of forms) grid.appendChild(renderFormCard(form));
      main.appendChild(grid);
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
          el("td", {
            "data-label": opts.trashed ? "Eliminada" : "Fecha",
            text: formatDate(opts.trashed ? submission.deleted_at : submission.created_at),
          }),
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

      if ((forms || []).length > 0) {
        const filterRow = el("div", { class: "filter-row" });
        filterRow.appendChild(el("label", { class: "filter-label", text: "Formulario:" }));
        const select = el("select", { class: "field-input field-input-inline" });
        const allOpt = el("option", { value: "all", text: "Todos los formularios" });
        if (respuestasFormFilter === "all") allOpt.setAttribute("selected", "selected");
        select.appendChild(allOpt);
        for (const form of forms) {
          const opt = el("option", { value: form.slug, text: form.name });
          if (respuestasFormFilter === form.slug) opt.setAttribute("selected", "selected");
          select.appendChild(opt);
        }
        select.addEventListener("change", (e) => {
          respuestasFormFilter = e.target.value;
          renderApp();
        });
        filterRow.appendChild(select);
        main.appendChild(filterRow);
      }

      const filtered =
        respuestasFormFilter === "all"
          ? activeSubmissions
          : activeSubmissions.filter((s) => s.form_slug === respuestasFormFilter);

      if (filtered.length === 0) {
        main.appendChild(el("p", { class: "empty-state", text: "No hay respuestas para este filtro." }));
        return;
      }
      main.appendChild(buildSubmissionsTable(filtered, { trashed: false }));
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

      const form = findForm(submission.form_slug);
      const questions = form ? form.questions : [];

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

      if (!form) {
        card.appendChild(
          el("p", { class: "error-state", text: "No se encontró la definición de este formulario." }),
        );
      }

      for (const question of questions) {
        const qa = el("div", { class: "qa" });
        qa.appendChild(el("p", { class: "qa-question", text: question.question }));
        const value = submission.answers[question.id];
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          qa.appendChild(el("p", { class: "qa-answer qa-empty", text: "Sin respuesta" }));
        } else {
          const answerText = Array.isArray(value) ? value.map((id) => optionLabel(question, id)).join(", ") : String(value);
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

      if (activeSubmissions === null || forms === null) {
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
    Promise.all([loadActive(), loadForms()])
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
