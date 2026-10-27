export const initialInstructors = [
  {
    id: 1,
    name: "Ing. Carlos Andrés Mendoza",
    module: "Análisis y Desarrollo de Software (ADSO) - Backend & APIs",
    center: "Centro de Teleinformática y Producción Industrial - Regional Cauca",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    email: "carlos.mendoza@sena.edu.co",
    rating: 4.8,
    ratingsCount: 42,
    methodology: 4.7,
    technicalDomain: 4.9,
    punctuality: 4.8,
    clarity: 4.7,
    operationalStatus: "En Formación", // "En Formación", "Disponible", "En Asesoría", "En Reunión"
    currentRoom: "Ambiente 402 - Hub de Software",
    assignedFichas: ["2670142", "2715890"],
    tags: ["ADSO", "Node.js", "Docker", "PostgreSQL"],
    evaluations: [
      {
        id: "eval-101",
        date: "2026-10-24",
        methodology: 5,
        technicalDomain: 5,
        rating: 5,
        category: "Sobresaliente",
        comment: "Excelente dominio técnico de Node.js y patrones de diseño. Sus talleres con proyectos del mundo real nos ayudan a entender la industria."
      },
      {
        id: "eval-102",
        date: "2026-10-18",
        methodology: 4,
        technicalDomain: 5,
        rating: 4.5,
        category: "Muy Bueno",
        comment: "Explica con mucha paciencia la arquitectura de software. Me gustaría que dedicara un poco más de tiempo a la resolución de dudas en Git."
      },
      {
        id: "eval-103",
        date: "2026-10-09",
        methodology: 5,
        technicalDomain: 5,
        rating: 5,
        category: "Sobresaliente",
        comment: "El mejor instructor técnico del programa. Comparte buenas prácticas de seguridad informática y devops."
      }
    ]
  },
  {
    id: 2,
    name: "Dra. Laura Patricia Gómez",
    module: "Diseño Web UI/UX y Desarrollo Frontend (React & Tailwind)",
    center: "Centro de Diseño y Metrología - Regional Distrito Capital",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    email: "laura.gomez@sena.edu.co",
    rating: 4.9,
    ratingsCount: 56,
    methodology: 4.9,
    technicalDomain: 4.8,
    punctuality: 4.9,
    clarity: 5.0,
    operationalStatus: "En Formación",
    currentRoom: "Laboratorio MAC 201 - Diseño Digital",
    assignedFichas: ["2821450"],
    tags: ["Frontend", "React", "Figma", "Tailwind CSS"],
    evaluations: [
      {
        id: "eval-201",
        date: "2026-10-25",
        methodology: 5,
        technicalDomain: 5,
        rating: 5,
        category: "Sobresaliente",
        comment: "Su pedagogía es maravillosa. Transforma conceptos complejos de diseño de componentes en ejercicios prácticos y divertidos."
      },
      {
        id: "eval-202",
        date: "2026-10-15",
        methodology: 5,
        technicalDomain: 4,
        rating: 4.5,
        category: "Muy Bueno",
        comment: "Da retroalimentación personalizada a cada aprendiz en Figma y en el código. Muy motivadora."
      }
    ]
  },
  {
    id: 3,
    name: "Lic. Jorge Eliecer Torres",
    module: "Bases de Datos Relacionales y NoSQL (MySQL, MongoDB)",
    center: "Centro de Servicios y Gestión Empresarial - Regional Antioquia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    email: "jorge.torres@sena.edu.co",
    rating: 4.4,
    ratingsCount: 38,
    methodology: 4.2,
    technicalDomain: 4.7,
    punctuality: 4.5,
    clarity: 4.3,
    operationalStatus: "Disponible",
    currentRoom: "Sala de Instructores TIC",
    assignedFichas: ["2901234"],
    tags: ["SQL", "MongoDB", "Normalización", "Optimización"],
    evaluations: [
      {
        id: "eval-301",
        date: "2026-10-21",
        methodology: 4,
        technicalDomain: 5,
        rating: 4.5,
        category: "Muy Bueno",
        comment: "El profesor sabe muchísimo sobre consultas complejas y optimización de índices. Podría ir un poco más despacio en los diagramas entidad-relación."
      },
      {
        id: "eval-302",
        date: "2026-10-10",
        methodology: 4,
        technicalDomain: 4,
        rating: 4.0,
        category: "Bueno",
        comment: "Puntual en el inicio de la clase y las guías de aprendizaje en Territorium están muy bien organizadas."
      }
    ]
  },
  {
    id: 4,
    name: "Esp. Marcela Ospina Restrepo",
    module: "Seguridad Digital, Cloud Computing & Redes",
    center: "Centro de Electricidad y Automatización Industrial - Regional Valle",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    email: "marcela.ospina@sena.edu.co",
    rating: 4.7,
    ratingsCount: 29,
    methodology: 4.6,
    technicalDomain: 4.8,
    punctuality: 4.8,
    clarity: 4.6,
    operationalStatus: "En Asesoría",
    currentRoom: "Centro de Ciberseguridad SENA - Piso 3",
    assignedFichas: ["2754321"],
    tags: ["AWS", "Ciberseguridad", "Linux", "Redes CCNA"],
    evaluations: [
      {
        id: "eval-401",
        date: "2026-10-22",
        methodology: 5,
        technicalDomain: 5,
        rating: 5.0,
        category: "Sobresaliente",
        comment: "Laboratorios prácticos en máquinas virtuales muy completos. Se nota la amplia experiencia en la industria de ciberseguridad."
      }
    ]
  },
  {
    id: 5,
    name: "Ing. Andrés Felipe Quintana",
    module: "Metodologías Ágiles (Scrum, Kanban) & Pruebas QA",
    center: "Centro Colombo Alemán - Regional Atlántico",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    email: "andres.quintana@sena.edu.co",
    rating: 4.5,
    ratingsCount: 31,
    methodology: 4.8,
    technicalDomain: 4.3,
    punctuality: 4.6,
    clarity: 4.7,
    operationalStatus: "En Reunión",
    currentRoom: "Sala de Juntas Pedagógicas",
    assignedFichas: ["2619088"],
    tags: ["Scrum", "QA Testing", "Jira", "Selenium"],
    evaluations: [
      {
        id: "eval-501",
        date: "2026-10-20",
        methodology: 5,
        technicalDomain: 4,
        rating: 4.5,
        category: "Muy Bueno",
        comment: "Fomenta mucho el trabajo colaborativo y la dinámica de daily standups nos prepara para empresas reales."
      }
    ]
  },
  {
    id: 6,
    name: "Mg. Diana Carolina Rojas",
    module: "Inteligencia Artificial y Análisis de Datos con Python",
    center: "Centro Tecnológico del Mobiliario y Software - Regional Antioquia",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80",
    email: "diana.rojas@sena.edu.co",
    rating: 4.9,
    ratingsCount: 47,
    methodology: 4.8,
    technicalDomain: 5.0,
    punctuality: 4.9,
    clarity: 4.8,
    operationalStatus: "En Formación",
    currentRoom: "Laboratorio de Inteligencia Computacional",
    assignedFichas: ["2645899"],
    tags: ["Python", "Pandas", "Machine Learning", "Power BI"],
    evaluations: [
      {
        id: "eval-601",
        date: "2026-10-26",
        methodology: 5,
        technicalDomain: 5,
        rating: 5.0,
        category: "Sobresaliente",
        comment: "Dominio técnico impecable en algoritmos de machine learning. Nos acompaña paso a paso en el código."
      }
    ]
  }
];
