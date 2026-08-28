import type { Question } from "../src/content/types";
import { normalizeQuestions, validateFormInput } from "./forms";

const SYSTEM_PROMPT = `Eres un asistente que convierte texto libre en preguntas estructuradas para un formulario de descubrimiento de cliente. Analiza el texto que te da el usuario (puede venir de ChatGPT u otra fuente, en cualquier formato) y devuelve ÚNICAMENTE un objeto JSON, sin texto adicional, sin explicaciones, sin markdown ni bloques de código, con este formato exacto:

{
  "name": "nombre corto y claro para el formulario",
  "clientName": "nombre del cliente o empresa si se menciona en el texto, o cadena vacía si no se menciona",
  "questions": [
    {
      "question": "el texto de la pregunta",
      "type": "long-text" | "single-choice" | "multi-select",
      "required": true,
      "helper": "texto de ayuda opcional (omite esta propiedad si no aplica)",
      "options": ["opción 1", "opción 2"]
    }
  ]
}

Reglas:
- Usa "single-choice" si la pregunta permite elegir solo una opción, "multi-select" si permite elegir varias, y "long-text" si es una respuesta abierta sin opciones.
- Solo incluye "options" cuando type sea "single-choice" o "multi-select", con al menos dos opciones.
- Si no es claro si una pregunta es obligatoria, usa required: true.
- No inventes preguntas que no estén en el texto original. No agregues preguntas de ejemplo.
- Responde solo con el objeto JSON, nada más — sin comentarios, sin markdown.`;

interface GeneratedForm {
  name: string;
  clientName: string;
  questions: Question[];
}

/** Errors of this type carry a message that is safe to show the admin verbatim. */
export class AiGenerationError extends Error {}

function extractJsonObject(text: string): unknown {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se encontró un objeto JSON en la respuesta.");
  }
  return JSON.parse(withoutFences.slice(start, end + 1));
}

export async function generateFormFromText(ai: Ai, text: string): Promise<GeneratedForm> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new AiGenerationError("Pega el texto del formulario antes de generar.");
  }
  if (trimmed.length > 12000) {
    throw new AiGenerationError("El texto es demasiado largo. Intenta con un fragmento más corto.");
  }

  let response: Awaited<ReturnType<Ai["run"]>>;
  try {
    response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
      temperature: 0.2,
    });
  } catch (error) {
    console.error("Workers AI call failed", error);
    // This endpoint is already gated behind an authenticated admin session, so
    // it's safe to surface the underlying error message here (unlike a public
    // endpoint) — it's the only way to diagnose a production-only failure
    // without direct access to Cloudflare's dashboard logs. Still guard
    // against ever echoing something that looks like a local filesystem/stack
    // trace, just in case.
    const detail = error instanceof Error ? error.message : String(error);
    const looksLikeStackTrace = /node_modules|\/(home|root)\//.test(detail);
    throw new AiGenerationError(
      "El generador con IA no está disponible en este momento. Puedes crear las preguntas manualmente." +
        (detail && !looksLikeStackTrace ? ` (Detalle técnico: ${detail})` : ""),
    );
  }

  const rawText =
    typeof response === "object" && response !== null && "response" in response
      ? String((response as { response: unknown }).response ?? "")
      : String(response);

  let parsed: unknown;
  try {
    parsed = extractJsonObject(rawText);
  } catch (error) {
    console.error("Failed to parse Workers AI response as JSON", error, rawText);
    throw new AiGenerationError("No pudimos interpretar el texto. Intenta de nuevo o crea las preguntas manualmente.");
  }

  const draft = parsed as { name?: unknown; clientName?: unknown; questions?: unknown[] };
  const questions = normalizeQuestions(Array.isArray(draft.questions) ? draft.questions : []);

  const validationError = validateFormInput({
    name: draft.name,
    clientName: typeof draft.clientName === "string" && draft.clientName.trim() ? draft.clientName : "Cliente",
    questions,
  });
  if (validationError) {
    throw new AiGenerationError("El texto no generó preguntas válidas: " + validationError);
  }

  return {
    name: typeof draft.name === "string" ? draft.name.trim() : "Formulario sin título",
    clientName: typeof draft.clientName === "string" ? draft.clientName.trim() : "",
    questions,
  };
}
