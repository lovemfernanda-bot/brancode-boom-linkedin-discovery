import type { Question } from "./types";

/**
 * Boom Balloons Miami — LinkedIn Discovery questionnaire.
 *
 * Questions 1 and 4 are transcribed verbatim from the approved design
 * reference screenshots. Every other question below is a PLACEHOLDER
 * standing in for the real questionnaire content so the 11-question flow,
 * progress counter, and all three input types can be reviewed end to end.
 * Placeholders are clearly labeled and must be replaced with the final
 * question text before this form is used with the client — nothing about
 * Boom Balloons Miami has been invented here.
 */
export const boomBalloonsQuestionnaire: Question[] = [
  {
    id: "founder-inspiration",
    type: "long-text",
    section: "HISTORIA DE LA FUNDADORA — KAROL SALAZAR",
    question: "¿Qué te inspiró a crear Boom Balloons Miami?",
    helper: "Cuéntanos con tus propias palabras.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "placeholder-2",
    type: "long-text",
    section: "HISTORIA DE LA FUNDADORA — KAROL SALAZAR",
    question: "[Pendiente: pregunta 2 del cuestionario final]",
    helper: "Este contenido se reemplazará por la pregunta real.",
    required: true,
    placeholder: "Escribe tu respuesta...",
    isPlaceholder: true,
  },
  {
    id: "placeholder-3",
    type: "long-text",
    section: "HISTORIA DE LA FUNDADORA — KAROL SALAZAR",
    question: "[Pendiente: pregunta 3 del cuestionario final]",
    helper: "Este contenido se reemplazará por la pregunta real.",
    required: true,
    placeholder: "Escribe tu respuesta...",
    isPlaceholder: true,
  },
  {
    id: "professional-positioning",
    type: "long-text",
    section: "HISTORIA DE LA FUNDADORA — KAROL SALAZAR",
    question:
      "Más allá de Boom Balloons, ¿cómo te gustaría que las personas conozcan a Karol Salazar profesionalmente?",
    helper:
      'Esta pregunta es CLAVE. No queremos que LinkedIn termine posicionándote simplemente como "the balloon lady" si eres una empresaria con una visión mayor.',
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "placeholder-5",
    type: "single-choice",
    section: "[Pendiente: sección 5]",
    question: "[Pendiente: pregunta 5 del cuestionario final — opción única]",
    helper: "Este contenido se reemplazará por la pregunta real.",
    required: true,
    options: [
      { id: "a", label: "Opción 1" },
      { id: "b", label: "Opción 2" },
      { id: "c", label: "Opción 3" },
    ],
    isPlaceholder: true,
  },
  {
    id: "placeholder-6",
    type: "multi-select",
    section: "[Pendiente: sección 6]",
    question: "[Pendiente: pregunta 6 del cuestionario final — selección múltiple]",
    helper: "Este contenido se reemplazará por la pregunta real.",
    required: true,
    options: [
      { id: "a", label: "Opción 1" },
      { id: "b", label: "Opción 2" },
      { id: "c", label: "Opción 3" },
      { id: "d", label: "Opción 4" },
    ],
    isPlaceholder: true,
  },
  {
    id: "placeholder-7",
    type: "long-text",
    section: "[Pendiente: sección 7]",
    question: "[Pendiente: pregunta 7 del cuestionario final]",
    required: true,
    placeholder: "Escribe tu respuesta...",
    isPlaceholder: true,
  },
  {
    id: "placeholder-8",
    type: "long-text",
    section: "[Pendiente: sección 8]",
    question: "[Pendiente: pregunta 8 del cuestionario final]",
    required: true,
    placeholder: "Escribe tu respuesta...",
    isPlaceholder: true,
  },
  {
    id: "placeholder-9",
    type: "multi-select",
    section: "[Pendiente: sección 9]",
    question: "[Pendiente: pregunta 9 del cuestionario final — selección múltiple]",
    required: true,
    options: [
      { id: "a", label: "Opción 1" },
      { id: "b", label: "Opción 2" },
      { id: "c", label: "Opción 3" },
    ],
    isPlaceholder: true,
  },
  {
    id: "placeholder-10",
    type: "single-choice",
    section: "[Pendiente: sección 10]",
    question: "[Pendiente: pregunta 10 del cuestionario final — opción única]",
    required: true,
    options: [
      { id: "a", label: "Opción 1" },
      { id: "b", label: "Opción 2" },
    ],
    isPlaceholder: true,
  },
  {
    id: "placeholder-11",
    type: "long-text",
    section: "[Pendiente: sección 11]",
    question: "[Pendiente: pregunta 11 del cuestionario final]",
    helper: "Última pregunta de este bloque.",
    required: false,
    placeholder: "Escribe tu respuesta... (opcional)",
    isPlaceholder: true,
  },
];
