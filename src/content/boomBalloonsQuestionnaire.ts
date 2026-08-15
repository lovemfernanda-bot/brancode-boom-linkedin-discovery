import type { Question } from "./types";

/**
 * Boom Balloons Miami — LinkedIn Discovery questionnaire.
 * Final approved content (12 questions).
 */
export const boomBalloonsQuestionnaire: Question[] = [
  {
    id: "q1",
    type: "long-text",
    question: "¿Qué te inspiró a crear Boom Balloons Miami y cómo comenzó el negocio?",
    helper: "Cuéntanos con tus propias palabras.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q2",
    type: "long-text",
    question:
      "¿Cuáles son hoy los principales servicios de Boom Balloons Miami y cuáles te interesa impulsar más?",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q3",
    type: "multi-select",
    question: "¿Quiénes son actualmente sus principales clientes?",
    helper:
      "Por ejemplo: clientes particulares, empresas, hoteles, venues, event planners, marcas, agencias, etc.",
    required: true,
    options: [
      { id: "clientes-particulares", label: "Clientes particulares" },
      { id: "empresas", label: "Empresas" },
      { id: "hoteles", label: "Hoteles" },
      { id: "venues", label: "Venues" },
      { id: "event-planners", label: "Event planners" },
      { id: "marcas", label: "Marcas" },
      { id: "agencias", label: "Agencias" },
      { id: "otro", label: "Otro" },
    ],
  },
  {
    id: "q4",
    type: "long-text",
    question: "¿Qué tipo de clientes u oportunidades te gustaría atraer con mayor frecuencia?",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q5",
    type: "long-text",
    question:
      "¿Qué consideras que diferencia a Boom Balloons Miami de otras compañías de decoración/eventos en Miami?",
    helper: "Puede ser servicio, creatividad, experiencia, ejecución, calidad, relaciones, especialización, etc.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q6",
    type: "long-text",
    question:
      "¿Hay clientes, proyectos, eventos, colaboraciones, reconocimientos o logros que podamos mencionar públicamente para fortalecer la credibilidad de la marca?",
    required: false,
    placeholder: "Escribe tu respuesta... (opcional)",
  },
  {
    id: "q7",
    type: "long-text",
    question:
      "Más allá de Boom Balloons, ¿cómo te gustaría que las personas conozcan a Karol Salazar profesionalmente?",
    helper:
      "Esta pregunta es clave. Queremos entender si LinkedIn debe posicionarte únicamente alrededor de Boom Balloons o también como empresaria, líder, creativa, founder, etc.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q8",
    type: "multi-select",
    question: "¿De qué temas te sentirías cómoda hablando desde tu perfil personal de LinkedIn?",
    helper: "Selecciona todas las que apliquen.",
    required: true,
    options: [
      { id: "emprendimiento", label: "Emprendimiento" },
      { id: "construccion-negocios", label: "Construcción de negocios" },
      { id: "eventos-experiencias", label: "Eventos y experiencias" },
      { id: "creatividad-diseno", label: "Creatividad y diseño" },
      { id: "liderazgo", label: "Liderazgo" },
      { id: "mujeres-negocios", label: "Mujeres en los negocios" },
      { id: "crecimiento-empresarial", label: "Crecimiento empresarial" },
      { id: "experiencia-cliente", label: "Experiencia del cliente" },
      { id: "lecciones-aprendidas", label: "Lecciones aprendidas como empresaria" },
      { id: "behind-the-scenes", label: "Behind the scenes de Boom Balloons" },
      { id: "tendencias-eventos", label: "Tendencias de eventos" },
      { id: "otro", label: "Otro" },
    ],
  },
  {
    id: "q9",
    type: "multi-select",
    question: "¿Qué te gustaría conseguir principalmente con LinkedIn?",
    required: true,
    options: [
      { id: "posicionar-boom", label: "Posicionar profesionalmente a Boom Balloons Miami" },
      { id: "posicionar-fundadora", label: "Posicionarme como fundadora / empresaria" },
      { id: "clientes-corporativos", label: "Atraer clientes corporativos" },
      { id: "nuevas-oportunidades", label: "Generar nuevas oportunidades de negocio" },
      { id: "conectar-event-planners", label: "Conectar con event planners" },
      { id: "conectar-hoteles-venues", label: "Conectar con hoteles y venues" },
      { id: "partnerships-marcas", label: "Crear partnerships con marcas" },
      { id: "networking", label: "Networking profesional" },
      { id: "pr-medios", label: "PR / medios" },
      { id: "autoridad-industria", label: "Construir autoridad en la industria" },
      { id: "otro", label: "Otro" },
    ],
  },
  {
    id: "q10",
    type: "long-text",
    question:
      "¿Con qué personas, empresas o industrias te interesaría especialmente conectar a través de LinkedIn?",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q11",
    type: "long-text",
    question:
      "¿Qué tipo de oportunidades te gustaría que LinkedIn generara para Boom Balloons Miami o para ti personalmente?",
    helper:
      "Ej.: contratos corporativos, eventos de marcas, partnerships, venues, hoteles, speaking opportunities, collaborations, etc.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
  {
    id: "q12",
    type: "long-text",
    question:
      "Imagina que ha pasado un año y LinkedIn ha funcionado increíblemente bien. ¿Qué tendría que haber ocurrido para que dijeras “esto realmente valió la pena”?",
    helper: "No pienses solamente en seguidores. Piensa en clientes, relaciones, reputación, partnerships y crecimiento.",
    required: true,
    placeholder: "Escribe tu respuesta...",
  },
];
