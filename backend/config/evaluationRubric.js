const rubric = [
  {
    code: 'pedagogicas',
    name: 'Competencias Pedagógicas y Didácticas',
    questions: [
      {
        code: 'dominio_tecnico',
        label: 'Dominio técnico y conceptual',
        description: 'Explica con claridad y demuestra dominio actualizado de los temas.',
      },
      {
        code: 'metodologia',
        label: 'Metodología y estrategias',
        description: 'Usa estrategias, recursos y guías que facilitan el aprendizaje.',
      },
      {
        code: 'evaluacion',
        label: 'Claridad en la evaluación',
        description: 'Explica los criterios y brinda retroalimentación oportuna.',
      },
    ],
  },
  {
    code: 'comunicativas',
    name: 'Competencias Comunicativas y Relacionales',
    questions: [
      {
        code: 'comunicacion',
        label: 'Claridad en la comunicación',
        description: 'Explica los conceptos de forma comprensible y motivadora.',
      },
      {
        code: 'escucha',
        label: 'Escucha activa y receptividad',
        description: 'Atiende dudas, inquietudes y propuestas del grupo.',
      },
      {
        code: 'respeto_inclusion',
        label: 'Respeto e inclusión',
        description: 'Mantiene un trato digno, ético, imparcial y respetuoso.',
      },
    ],
  },
  {
    code: 'compromiso',
    name: 'Compromiso Institucional y Cumplimiento',
    questions: [
      {
        code: 'puntualidad',
        label: 'Puntualidad y asistencia',
        description: 'Cumple los horarios de las sesiones y talleres.',
      },
      {
        code: 'ambiente_aprendizaje',
        label: 'Gestión del ambiente de aprendizaje',
        description: 'Organiza y aprovecha adecuadamente el espacio o plataforma.',
      },
    ],
  },
];

const questions = rubric.flatMap((category) =>
  category.questions.map((question) => ({
    ...question,
    categoryCode: category.code,
    categoryName: category.name,
  }))
);

module.exports = { rubric, questions };
