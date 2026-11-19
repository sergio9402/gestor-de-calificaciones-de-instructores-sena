# Diagrama del modelo de datos MongoDB

Este diagrama describe las colecciones del backend y sus referencias. Las
perfiles por rol, periodos, inscripciones, horarios y novedades son
colecciones independientes; las evaluaciones, respuestas y participaciones
también permanecen separadas.

```mermaid
erDiagram
    INSTRUCTORES {
        ObjectId _id PK
        string nombre
        string email
        string password "Hash; no se devuelve en consultas"
        string rol
        boolean activo
        number authVersion
        string tipoDocumento
        string documento
        string especialidad
        string estado
        string centro
        number promedioGeneral
        number totalEvaluaciones
    }

    APRENDICES {
        ObjectId _id PK
        string nombre
        string email
        string password "Hash; no se devuelve en consultas"
        string rol
        boolean activo
        number authVersion
        string tipoDocumento
        string documento
        ObjectId[] fichas FK "Sincronizadas con inscripciones"
    }

    COORDINADORES {
        ObjectId _id PK
        string nombre
        string email
        string password "Hash; no se devuelve en consultas"
        string rol
        boolean activo
        number authVersion
        string tipoDocumento
        string documento
        string centro
        string area
    }

    PERIODOS {
        ObjectId _id PK
        string nombre UK
        date fechaInicio
        date fechaFin
        string estado
    }

    FICHAS {
        ObjectId _id PK
        string codigo UK
        string programa
        ObjectId periodoId FK
        ObjectId instructor FK
        date fechaInicio
        date fechaFin
        boolean activa
    }

    INSCRIPCIONES {
        ObjectId _id PK
        ObjectId aprendizId FK
        ObjectId fichaId FK
        date fechaInscripcion
        string estado
    }

    HORARIOS {
        ObjectId _id PK
        ObjectId fichaId FK
        ObjectId instructor FK
        string dia
        string horaInicio
        string horaFin
        string tema
        string ambiente
        boolean activa
    }

    NOVEDADES {
        ObjectId _id PK
        ObjectId fichaId FK
        ObjectId horarioId FK
        ObjectId creadaPor
        string rolCreador
        string tipo
        string mensaje
        date fechaClase
    }

    EVALUATIONS {
        ObjectId _id PK
        ObjectId instructorId FK
        ObjectId fichaId FK
        ObjectId periodoId FK
        string periodo "Etiqueta histórica/compatibilidad"
        string comentario
        date fecha
    }

    EVALUATIONANSWERS {
        ObjectId _id PK
        ObjectId evaluationId FK
        string criterionCode
        string categoryCode
        number score
        boolean noAplica
    }

    EVALUATIONPARTICIPATIONS {
        ObjectId _id PK
        ObjectId learnerId FK
        ObjectId instructorId FK
        ObjectId fichaId FK
        ObjectId periodoId FK
        string periodo "Etiqueta histórica/compatibilidad"
    }

    PERIODOS ||--o{ FICHAS : contiene
    INSTRUCTORES ||--o{ FICHAS : "instructor principal"
    APRENDICES ||--o{ INSCRIPCIONES : inscrito
    FICHAS ||--o{ INSCRIPCIONES : recibe
    FICHAS ||--o{ HORARIOS : programa
    INSTRUCTORES ||--o{ HORARIOS : dicta
    FICHAS ||--o{ NOVEDADES : registra
    HORARIOS o|--o{ NOVEDADES : afecta
    INSTRUCTORES ||--o{ NOVEDADES : publica
    COORDINADORES ||--o{ NOVEDADES : publica
    INSTRUCTORES ||--o{ EVALUATIONS : "recibe evaluación"
    FICHAS ||--o{ EVALUATIONS : agrupa
    PERIODOS ||--o{ EVALUATIONS : contextualiza
    EVALUATIONS ||--o{ EVALUATIONANSWERS : contiene
    APRENDICES ||--o{ EVALUATIONPARTICIPATIONS : participa
    INSTRUCTORES ||--o{ EVALUATIONPARTICIPATIONS : evaluado
    FICHAS ||--o{ EVALUATIONPARTICIPATIONS : contextualiza
    PERIODOS ||--o{ EVALUATIONPARTICIPATIONS : controla
```

## Colecciones y reglas principales

- **`instructores`**, **`aprendices`** y **`coordinadores`** contienen cada uno
  los datos propios del rol y los datos de acceso: nombre, correo, hash de
  contraseña, rol, estado activo y versión de autenticación. La contraseña no
  se devuelve en las respuestas normales. El correo se valida como único entre
  roles en el servicio de usuarios; los documentos de instructor y
  coordinación son opcionales hasta que se ingresen sus valores reales.
- **`periodos`** contiene el nombre único del periodo y sus fechas/estado.
  Fichas y registros nuevos de evaluación apuntan a su `periodoId`; la etiqueta
  `periodo` permanece en evaluaciones/participaciones para compatibilidad con
  datos e índices existentes.
- **`fichas`** conserva código, programa, vigencia e instructor principal.
  Aprendices se vinculan mediante **`inscripciones`**; los bloques semanales
  viven en **`horarios`** y pueden tener instructores distintos.
  El perfil de aprendiz contiene también `fichas` como lista de referencias
  sincronizada con las inscripciones activas para facilitar su visualización.
- **`novedades`** son documentos independientes ligados a una ficha y,
  opcionalmente, a un horario. Guardan el ID y rol del instructor o coordinador
  que publicó el aviso; el ID se mantiene igual al migrar las cuentas.
- **`evaluations`** contiene la cabecera y comentario, sin identidad del
  aprendiz. **`evaluationanswers`** guarda la calificación (1 a 5) o la marca
  “No me consta / No aplica”. **`evaluationparticipations`** controla por
  separado el envío duplicado con un índice único.
- Los resultados se muestran cuando alcanzan cinco respuestas. Separar las
  colecciones reduce la vinculación directa, pero no garantiza anonimato
  absoluto frente a acceso administrativo o correlación de tiempos.

## Estado de migración

El backend ya usa los esquemas normalizados con autenticación dentro de cada
perfil. [La migración de cuentas](../backend/config/migrateAccountsIntoProfiles.js)
copia credenciales de la antigua colección `cuentas` a los perfiles, conserva
los IDs y permite eliminar `cuentas` solo después de verificar las copias.
La migración de roles copia directamente datos de una colección legacy `users`
y puede retirar esa colección con confirmación. Cuando hay datos académicos
embebidos, la migración de roles debe ejecutarse antes que
[la migración académica](../backend/config/migrateAcademicCollections.js),
porque las inscripciones y horarios referencian perfiles. Esta segunda
migración convierte los documentos embebidos y limpia esos campos de `fichas`;
haz un respaldo y pruébala primero en una copia no productiva. La base de
pruebas configurada ya tiene los 31 perfiles migrados y verificados; la
colección `cuentas` fue retirada. No se modificó producción.

Los documentos de materias, categorías, preguntas y versiones de rúbrica son
una posible ampliación; actualmente el tema continúa como texto del horario y
la rúbrica se define en configuración del backend.

## Nota para la presentación académica

Este es un **modelo lógico adaptado a documentos MongoDB**. Las relaciones
marcadas con `FK` son referencias `ObjectId` que valida la aplicación;
MongoDB no aplica claves foráneas automáticamente.
