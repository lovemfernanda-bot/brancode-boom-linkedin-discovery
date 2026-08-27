import type { Question, QuestionType } from "../src/content/types";

export type FormStatus = "activo" | "inactivo";

export interface FormRow {
  id: string;
  slug: string;
  name: string;
  client_name: string;
  questions: string;
  status: FormStatus;
  created_at: string;
  updated_at: string;
}

export interface FormRecord {
  id: string;
  slug: string;
  name: string;
  clientName: string;
  questions: Question[];
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: FormRow): FormRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    clientName: row.client_name,
    questions: JSON.parse(row.questions) as Question[],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFormBySlug(db: D1Database, slug: string): Promise<FormRecord | null> {
  const row = await db.prepare(`SELECT * FROM forms WHERE slug = ?`).bind(slug).first<FormRow>();
  return row ? rowToRecord(row) : null;
}

export async function getFormById(db: D1Database, id: string): Promise<FormRecord | null> {
  const row = await db.prepare(`SELECT * FROM forms WHERE id = ?`).bind(id).first<FormRow>();
  return row ? rowToRecord(row) : null;
}

export async function listForms(db: D1Database): Promise<FormRecord[]> {
  const result = await db.prepare(`SELECT * FROM forms ORDER BY created_at DESC`).all<FormRow>();
  return (result.results ?? []).map(rowToRecord);
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "formulario";
}

async function generateUniqueSlug(db: D1Database, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let counter = 2;
  while (await getFormBySlug(db, candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export interface FormInput {
  name: string;
  clientName: string;
  questions: Question[];
}

const VALID_TYPES: QuestionType[] = ["long-text", "single-choice", "multi-select"];

/** Shared structural validation for both manually-built and AI-generated forms. */
export function validateFormInput(input: {
  name?: unknown;
  clientName?: unknown;
  questions?: unknown;
}): string | null {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return "El formulario necesita un nombre.";
  }
  if (typeof input.clientName !== "string" || input.clientName.trim().length === 0) {
    return "El formulario necesita el nombre del cliente.";
  }
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    return "El formulario necesita al menos una pregunta.";
  }
  for (const [index, raw] of input.questions.entries()) {
    const q = raw as Partial<Question> | null;
    if (!q || typeof q !== "object") {
      return `La pregunta ${index + 1} no es válida.`;
    }
    if (typeof q.question !== "string" || q.question.trim().length === 0) {
      return `La pregunta ${index + 1} necesita un texto.`;
    }
    if (!VALID_TYPES.includes(q.type as QuestionType)) {
      return `La pregunta ${index + 1} tiene un tipo inválido.`;
    }
    if (q.type === "single-choice" || q.type === "multi-select") {
      const options = q.options;
      if (!Array.isArray(options) || options.length < 2) {
        return `La pregunta ${index + 1} necesita al menos dos opciones.`;
      }
      for (const option of options) {
        if (!option || typeof option.label !== "string" || option.label.trim().length === 0) {
          return `La pregunta ${index + 1} tiene una opción sin texto.`;
        }
      }
    }
  }
  return null;
}

/** Normalizes question ids/options ids so every question has a stable identifier. */
export function normalizeQuestions(rawQuestions: unknown[]): Question[] {
  return rawQuestions.map((raw, index) => {
    const q = raw as Partial<Question>;
    const id = typeof q.id === "string" && q.id.trim().length > 0 ? q.id : `q_${crypto.randomUUID().slice(0, 8)}`;
    const question: Question = {
      id,
      type: q.type as QuestionType,
      question: (q.question as string).trim(),
      required: Boolean(q.required),
    };
    if (typeof q.helper === "string" && q.helper.trim().length > 0) question.helper = q.helper.trim();
    if (typeof q.placeholder === "string" && q.placeholder.trim().length > 0) {
      question.placeholder = q.placeholder.trim();
    }
    if (q.type === "single-choice" || q.type === "multi-select") {
      question.options = (q.options ?? []).map((opt, optIndex) => ({
        id:
          opt && typeof opt.id === "string" && opt.id.trim().length > 0
            ? opt.id
            : `opt_${index}_${optIndex}_${crypto.randomUUID().slice(0, 6)}`,
        label: (opt.label as string).trim(),
      }));
    }
    return question;
  });
}

export async function createForm(db: D1Database, input: FormInput): Promise<FormRecord> {
  const id = crypto.randomUUID();
  const slug = await generateUniqueSlug(db, input.name);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO forms (id, slug, name, client_name, questions, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'activo', ?, ?)`,
    )
    .bind(id, slug, input.name.trim(), input.clientName.trim(), JSON.stringify(input.questions), now, now)
    .run();

  return {
    id,
    slug,
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    questions: input.questions,
    status: "activo",
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateForm(
  db: D1Database,
  id: string,
  input: FormInput & { status: FormStatus },
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE forms SET name = ?, client_name = ?, questions = ?, status = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(input.name.trim(), input.clientName.trim(), JSON.stringify(input.questions), input.status, now, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
