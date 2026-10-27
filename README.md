# Sistema de Evaluación y Gestión Operativa SENA 🎓🇨🇴

Prototipo frontend moderno, funcional y responsivo desarrollado con **React**, **Tailwind CSS** y **Lucide Icons** para la evaluación continua, supervisión operativa y gestión docente en los centros de formación del SENA.

---

## 🔐 Módulo de Autenticación & Roles Simulados

La plataforma cuenta con un sistema de autenticación con control de acceso basado en roles (RBAC) y perfiles simulados:

### 1. Perfil "Instructor" (Docente)
- **Credenciales Demo:** `carlos.mendoza@sena.edu.co` / `sena2026`
- **Panel Exclusivo (`InstructorDashboard.jsx`):**
  - **Fichas Asignadas:** Lista de grupos de formación (ej. Ficha ADSO 2670142, Ficha 2715890), ambientes de formación (físico/virtual), horario asignado y número de aprendices.
  - **Estado Operativo en Tiempo Real:** Selector para conmutar estado (*En Formación 🟢*, *Asesoría Técnica 🔵*, *Disponible ⚪*, *En Reunión 🟣*), visible al instante para la coordinación.
  - **Tasa de Participación:** Barra de progreso con el porcentaje de aprendices que han completado la evaluación de la ficha.
  - **Opiniones & Retroalimentación Anónima:** Bandeja para consultar los comentarios constructivos de sus aprendices organizados por fecha y notas de metodología/técnica.

### 2. Perfil "Coordinador" (Dirección y Calidad)
- **Credenciales Demo:** `sofia.restrepo@sena.edu.co` / `admin2026`
- **Panel Gerencial (`CoordinatorDashboard.jsx`):**
  - **Bitácora Operativa en Vivo:** Tabla interactiva para verificar en tiempo real el estado de cada instructor (activo en aula, en asesoría, disponible), aula asignada, fichas vinculadas y promedio de desempeño.
  - **Métricas Institucionales:** Acceso directo al análisis comparativo de competencias (*Metodología* vs *Dominio Técnico*).
  - **Directorio y Auditoría:** Inspección detallada del historial de evaluaciones y observaciones por instructor.

### 3. Perfil "Aprendiz" (Evaluación Anónima)
- **Acceso:** Modo directo o con credenciales `aprendiz.adso@misena.edu.co` / `adso2026`.
- **Funcionalidades:**
  - Directorio público de instructores con buscador y filtros por especialidad.
  - Formulario modal de evaluación anónima (1-5 estrellas para Metodología y Dominio Técnico + comentario constructivo).
  - Garantía de confidencialidad institucional.

---

## 🚀 Cómo Iniciar el Proyecto

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   Abrirá la aplicación en `http://localhost:3000`.

3. **Construir para Producción:**
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologías Utilizadas

- **React 18** (Functional Components, Hooks: `useState`, `useMemo`, `useEffect`)
- **Tailwind CSS 3** (Diseño utility-first con paleta oficial SENA: `#39A900`, `#00324D`)
- **Vite 5** (Entorno de desarrollo y empaquetador ultrarrápido)
- **Lucide React** (Iconografía vectorial moderna y accesible)
