export const mockFichas = [
  {
    id: "ficha-2670142",
    code: "2670142",
    program: "Análisis y Desarrollo de Software (ADSO)",
    instructorId: 1, // Carlos Andrés Mendoza
    jornada: "Diurna (07:00 - 13:00)",
    ambiente: "Ambiente 402 - Hub de Desarrollo de Software",
    totalStudents: 28,
    status: "En Formación",
    phase: "Fase de Ejecución - Sprint 4",
    pendingEvaluations: 4,
    completedEvaluations: 24,
    days: "Lunes a Viernes"
  },
  {
    id: "ficha-2715890",
    code: "2715890",
    program: "Tecnología en Desarrollo Web y Aplicaciones Móviles",
    instructorId: 1, // Carlos Andrés Mendoza
    jornada: "Mixta / Asesoría Virtual (14:00 - 18:00)",
    ambiente: "Ambiente Virtual Teams / Territorium",
    totalStudents: 32,
    status: "Asesoría Técnica",
    phase: "Fase de Planeación y Arquitectura",
    pendingEvaluations: 7,
    completedEvaluations: 25,
    days: "Martes y Jueves"
  },
  {
    id: "ficha-2821450",
    code: "2821450",
    program: "Diseño e Integración de Interfaces Multimedia (UI/UX)",
    instructorId: 2, // Laura Patricia Gómez
    jornada: "Diurna (07:00 - 13:00)",
    ambiente: "Laboratorio MAC 201 - Diseño Digital",
    totalStudents: 26,
    status: "En Formación",
    phase: "Fase de Ejecución - Prototipado Figma",
    pendingEvaluations: 2,
    completedEvaluations: 24,
    days: "Lunes a Viernes"
  },
  {
    id: "ficha-2901234",
    code: "2901234",
    program: "Administración de Bases de Datos & Big Data",
    instructorId: 3, // Jorge Eliecer Torres
    jornada: "Nocturna (18:00 - 22:00)",
    ambiente: "Ambiente 105 - Redes y Servidores",
    totalStudents: 22,
    status: "Disponible",
    phase: "Fase de Evaluación de Competencias",
    pendingEvaluations: 8,
    completedEvaluations: 14,
    days: "Lunes a Jueves"
  },
  {
    id: "ficha-2754321",
    code: "2754321",
    program: "Ciberseguridad y Gestión de Infraestructura Cloud",
    instructorId: 4, // Marcela Ospina Restrepo
    jornada: "Diurna (07:00 - 13:00)",
    ambiente: "Centro de Ciberseguridad SENA - Piso 3",
    totalStudents: 30,
    status: "En Formación",
    phase: "Fase de Ejecución - Hacking Ético",
    pendingEvaluations: 3,
    completedEvaluations: 27,
    days: "Lunes a Viernes"
  },
  {
    id: "ficha-2645899",
    code: "2645899",
    program: "Inteligencia Artificial y Machine Learning Aplicado",
    instructorId: 6, // Diana Carolina Rojas
    jornada: "Fines de Semana (08:00 - 17:00)",
    ambiente: "Laboratorio de Inteligencia Computacional",
    totalStudents: 24,
    status: "Preparación de Clase",
    phase: "Fase de Análisis de Modelos Predictivos",
    pendingEvaluations: 5,
    completedEvaluations: 19,
    days: "Sábados y Domingos"
  }
];

export const mockUsers = {
  instructor: {
    id: 1,
    role: "instructor",
    name: "Ing. Carlos Andrés Mendoza",
    email: "carlos.mendoza@sena.edu.co",
    document: "1098765432",
    title: "Instructor Técnico ADSO",
    center: "Centro de Teleinformática y Producción Industrial - Regional Cauca",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    module: "Análisis y Desarrollo de Software (ADSO) - Backend & APIs",
    operationalStatus: "En Formación",
    currentRoom: "Ambiente 402 - Hub de Software",
    schedule: "07:00 AM - 01:00 PM (Diurna)",
    contractType: "Carrera Administrativa SENA"
  },
  coordinator: {
    id: 99,
    role: "coordinator",
    name: "Dra. Sofía Restrepo Cárdenas",
    email: "sofia.restrepo@sena.edu.co",
    document: "52890123",
    title: "Coordinadora Académica y Aseguramiento de la Calidad",
    center: "SENA Sede Central - Dirección de Formación Profesional",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    managedInstructorsCount: 36,
    activeFichasCount: 84
  },
  aprendiz: {
    id: 501,
    role: "aprendiz",
    name: "Aprendiz en Formación (Acceso Abierto)",
    email: "aprendiz.adso@misena.edu.co",
    title: "Ficha ADSO 2670142",
    center: "Centro de Teleinformática - Regional Cauca"
  }
};

// Registro de credenciales oficiales para validación estricta de seguridad
export const validCredentials = [
  {
    email: "carlos.mendoza@sena.edu.co",
    password: "sena2026",
    role: "instructor",
    user: mockUsers.instructor
  },
  {
    email: "laura.gomez@sena.edu.co",
    password: "sena2026",
    role: "instructor",
    user: {
      ...mockUsers.instructor,
      id: 2,
      name: "Dra. Laura Patricia Gómez",
      email: "laura.gomez@sena.edu.co",
      module: "Diseño Web UI/UX y Desarrollo Frontend (React & Tailwind)",
      operationalStatus: "En Formación"
    }
  },
  {
    email: "jorge.torres@sena.edu.co",
    password: "sena2026",
    role: "instructor",
    user: {
      ...mockUsers.instructor,
      id: 3,
      name: "Lic. Jorge Eliecer Torres",
      email: "jorge.torres@sena.edu.co",
      module: "Bases de Datos Relacionales y NoSQL (MySQL, MongoDB)",
      operationalStatus: "Disponible"
    }
  },
  {
    email: "sofia.restrepo@sena.edu.co",
    password: "admin2026",
    role: "coordinator",
    user: mockUsers.coordinator
  },
  {
    email: "aprendiz.adso@misena.edu.co",
    password: "adso2026",
    role: "aprendiz",
    user: mockUsers.aprendiz
  }
];
