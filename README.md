# Sistema de gestión y evaluación de instructores SENA

Aplicación web académica para organizar información de aprendices, instructores,
fichas y horarios, comunicar novedades de formación y recoger evaluaciones de
instructores. El sistema ofrece vistas distintas para coordinación, instructores
y aprendices y persiste la información en MongoDB mediante una API.

Presentación tipo pitch: [descargar PowerPoint](./docs/pitch-gestor-evaluacion-instructores-sena.pptx).

> **Estado del proyecto:** prototipo funcional en desarrollo. No es un sistema
> oficial del SENA ni debe considerarse listo para producción sin una revisión
> adicional de seguridad, privacidad, operación y despliegue.

## Contenido

- [Situación problema](#situación-problema)
- [Solución propuesta](#solución-propuesta)
- [Objetivos](#objetivos)
- [Alcance](#alcance)
- [Roles e historias de usuario](#roles-e-historias-de-usuario)
- [Requisitos funcionales](#requisitos-funcionales)
- [Requisitos no funcionales](#requisitos-no-funcionales)
- [Reglas de negocio](#reglas-de-negocio)
- [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Recorridos principales](#recorridos-principales)
- [API disponible](#api-disponible)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Configuración](#configuración)
- [Datos de demostración](#datos-de-demostración)
- [Pruebas y compilación](#pruebas-y-compilación)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Piloto y validación con usuarios](#piloto-y-validación-con-usuarios)
- [Limitaciones y trabajo futuro](#limitaciones-y-trabajo-futuro)

## Situación problema

La gestión de la formación requiere que aprendices y personal de coordinación
puedan consultar quién dicta cada bloque, cuándo y dónde se realiza la clase, y
si existe una novedad que afecte su desarrollo. Cuando los horarios, cambios y
observaciones se comunican por medios dispersos, puede ser difícil conservar
una referencia común y dar seguimiento a las evaluaciones de los instructores.

Además, una evaluación recogida sin controles sobre la ficha, el instructor o
la participación puede quedar duplicada o asociada a una persona, lo que reduce
la confianza en los resultados. El proyecto aborda estas necesidades con una
aplicación centralizada, permisos por rol y reglas para limitar duplicados y
reducir la exposición de respuestas individuales.

## Solución propuesta

El sistema mantiene cuentas y fichas en una base MongoDB y las expone a través
de una API REST. Coordinación administra usuarios, fichas, inscripciones,
bloques de horario y novedades; el aprendiz consulta su formación y puede
evaluar a instructores asignados a su ficha; el instructor consulta sus fichas,
el estado operativo y los resultados consolidados disponibles.

Una evaluación registra dos calificaciones (metodología y dominio técnico,
ambas de 1 a 5) y un comentario constructivo. El registro de respuestas no
guarda el identificador del aprendiz. Un registro separado de participación
impide que una misma persona evalúe más de una vez al mismo instructor para una
ficha y periodo. Los resultados y comentarios agrupados se entregan al alcanzar
cinco respuestas para esa combinación.

La separación limita la asociación directa entre identidad y respuesta, pero
**no garantiza anonimato absoluto** ante administradores con acceso a la base,
copias de seguridad o información externa que permita correlacionar el momento
de envío.

## Objetivos

### Objetivo general

Desarrollar una aplicación web por capas que centralice la consulta de horarios,
la comunicación de novedades y la evaluación de instructores, con acceso
controlado por roles y persistencia en MongoDB.

### Objetivos específicos

1. Permitir a coordinación gestionar cuentas de aprendices e instructores, así
   como fichas, inscripciones y bloques horarios.
2. Facilitar al aprendiz la consulta de sus fichas, sesiones, instructores y
   novedades asociadas.
3. Habilitar evaluaciones de instructores con criterios y escala definidos, y
   controlar la participación duplicada.
4. Proporcionar a instructores y coordinación acceso a indicadores y
   retroalimentación consolidada según el umbral establecido.
5. Separar presentación, comunicación HTTP, reglas de negocio y persistencia
   para facilitar el mantenimiento y las pruebas.

## Alcance

### Incluido en la versión actual

- Inicio de sesión y perfil de usuario para coordinación, instructor y aprendiz.
- Solicitud de recuperación por correo y cambio de contraseña con enlace
  temporal de un solo uso.
- Autorización de operaciones según el rol.
- Creación, consulta, actualización y desactivación de cuentas de instructor y
  aprendiz desde coordinación.
- Creación, consulta, actualización y desactivación lógica de fichas.
- Inscripción de aprendices y asociación de instructores a sesiones de una ficha.
- Consulta de horarios semanales con día, horas, instructor, tema y ambiente.
- Publicación manual de novedades: cancelación, cambio de horario, cambio de
  ambiente o novedad general.
- Evaluación de instructores por aprendices elegibles.
- Consulta de promedios e información consolidada cuando se alcanza el mínimo
  requerido de respuestas.
- Importación opcional y protegida de datos de prueba en entornos no productivos.

### Fuera del alcance actual

- Integración con sistemas institucionales, directorios o servicios oficiales
  del SENA.
- Sincronización automática de horarios, asistencia, cancelaciones o cambios.
- Envío de notificaciones por correo, SMS o notificaciones push.
- Segundo factor de autenticación y recuperación asistida por personal
  institucional.
- Aplicación móvil nativa, funcionamiento sin conexión o soporte de múltiples
  instituciones/tenants.
- Flujos institucionales de aprobación, seguimiento formal de planes de mejora
  o exportación de informes a formatos específicos.
- Garantía de anonimato frente a administradores o análisis de correlación.
- Despliegue productivo automatizado, monitoreo y acuerdos de disponibilidad.

## Roles e historias de usuario

| ID | Como... | Quiero... | Para... | Criterios de aceptación |
|---|---|---|---|---|
| HU-01 | usuario registrado | iniciar sesión con mi cuenta | acceder a las funciones de mi rol | las credenciales se validan y la API devuelve un token; las rutas protegidas rechazan una sesión ausente o inválida |
| HU-02 | coordinador | crear, editar y desactivar cuentas de instructores y aprendices | mantener actualizado el directorio | el rol permitido se valida, los correos no se duplican y la contraseña inicial cumple la longitud exigida |
| HU-03 | coordinador | crear y mantener fichas con aprendices y sesiones | organizar la oferta formativa | los bloques tienen horas válidas, la hora final es posterior a la inicial y no hay traslapes en un mismo día |
| HU-04 | coordinador o instructor | publicar una novedad asociada a una ficha | informar una cancelación, cambio o situación general | la novedad tiene tipo, mensaje y fecha de clase y se muestra en la consulta del aprendiz |
| HU-05 | aprendiz | consultar mis fichas y horarios | saber qué clases tengo, quién las dicta y dónde | solo recibo fichas en las que estoy inscrito y veo sus sesiones y novedades |
| HU-06 | aprendiz | evaluar a un instructor de mi ficha | aportar retroalimentación sobre la formación recibida | solo puedo evaluar instructores asignados, ingreso calificaciones de 1 a 5 y un comentario válido, y no puedo repetir la evaluación para la misma ficha e instructor en el periodo |
| HU-07 | instructor | consultar mis fichas y cambiar mi estado operativo | mantener visible mi actividad | solo puedo consultar mis fichas y seleccionar uno de los estados permitidos |
| HU-08 | instructor o coordinador | consultar resultados consolidados | conocer la retroalimentación disponible | no se exponen resultados ni comentarios agrupados antes de cinco respuestas en la combinación de ficha y periodo |
| HU-09 | coordinador | revisar métricas generales | hacer seguimiento a la información registrada | las métricas se obtienen de la API y requieren rol de coordinación |
| HU-10 | usuario registrado | solicitar recuperación de contraseña | volver a ingresar si olvido mi clave | la respuesta no revela si el correo existe; el enlace expira, se usa una sola vez y el cambio invalida sesiones anteriores |

Las historias describen el comportamiento funcional esperado de esta versión y
se corresponden con las reglas implementadas en la API y las pantallas actuales.
No implican que el sistema realice notificaciones automáticas o procesos
institucionales externos.

## Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-01 | El sistema debe permitir autenticar usuarios y consultar su perfil mediante la API. |
| RF-02 | El sistema debe autorizar las operaciones protegidas de acuerdo con los roles `coordinador`, `instructor` y `aprendiz`. |
| RF-03 | Coordinación debe poder listar, crear, editar y desactivar cuentas de aprendices e instructores. |
| RF-04 | Coordinación debe poder listar, crear, editar y desactivar fichas de formación. |
| RF-05 | La gestión de ficha debe permitir asociar aprendices e instructores y definir periodos y sesiones semanales. |
| RF-06 | El sistema debe validar formato y orden de horas y fechas, y rechazar bloques que se traslapen en un mismo día. |
| RF-07 | El aprendiz debe poder consultar las fichas a las que está inscrito, sus sesiones y sus novedades. |
| RF-08 | El instructor debe poder consultar las fichas que tiene asignadas. |
| RF-09 | Coordinación e instructores deben poder registrar novedades en una ficha usando uno de los tipos admitidos. |
| RF-10 | El aprendiz inscrito debe poder evaluar a instructores relacionados con su ficha activa, con calificaciones de metodología y dominio técnico entre 1 y 5 y un comentario válido. |
| RF-11 | El sistema debe limitar a una evaluación por aprendiz, instructor, ficha y periodo. |
| RF-12 | El sistema debe calcular el promedio de la evaluación y actualizar las métricas del instructor. |
| RF-13 | El sistema debe agrupar resultados por instructor, ficha y periodo y no devolver la consolidación antes de cinco respuestas. |
| RF-14 | Coordinación debe poder consultar usuarios, fichas y métricas de gestión. |
| RF-15 | El sistema debe ofrecer una ruta de salud de la API para comprobar que el servicio responde. |
| RF-16 | En entornos no productivos, coordinación puede previsualizar y confirmar una importación de datos sintéticos si la opción está habilitada por configuración. |
| RF-17 | El usuario debe poder solicitar un enlace de recuperación por correo sin que la respuesta revele si la cuenta existe. |
| RF-18 | El usuario debe poder cambiar su contraseña con un enlace de un solo uso que vence a los 30 minutos; el cambio debe invalidar sesiones JWT anteriores. |

## Requisitos no funcionales

1. **Arquitectura mantenible:** separar las vistas del frontend, los servicios
   HTTP, las rutas, los controladores, la lógica de negocio y los modelos de
   persistencia.
2. **Control de acceso:** validar token y rol en el backend; no confiar
   únicamente en ocultar controles en la interfaz.
3. **Protección de contraseñas:** almacenar hashes (scrypt en la implementación
   actual), nunca devolver el campo de contraseña en consultas normales.
4. **Validación de datos:** validar datos tanto en los límites de la API como en
   los esquemas Mongoose para los casos cubiertos por la implementación.
5. **Privacidad de evaluaciones:** no guardar el identificador del aprendiz en
   el documento de respuesta y no exponer resultados agrupados antes del umbral
   configurado. No presentar esto como anonimato absoluto.
6. **Configuración segura:** guardar URI de base de datos, secreto JWT y
   configuraciones locales en variables de entorno; no subir secretos al
   repositorio.
7. **Separación de entornos:** bloquear en producción la importación de datos
   de prueba y las tareas de migración que están protegidas por el backend.
8. **Usabilidad:** mostrar estados de carga, error y confirmación en los flujos
   principales; interfaz adaptable a tamaños de pantalla habituales.
9. **Pruebas:** permitir ejecutar pruebas del backend con una base MongoDB
   temporal en memoria sin leer ni modificar la base configurada para la
   aplicación.
10. **Operación:** la disponibilidad, copias de seguridad, monitoreo y
    recuperación ante desastres dependen del entorno de despliegue y no están
    garantizados por el código de la aplicación.

## Reglas de negocio

- Los roles de cuenta son `coordinador`, `instructor` y `aprendiz`.
- La administración de usuarios solo crea cuentas de instructor o aprendiz;
  la cuenta de coordinación se provisiona fuera de ese formulario.
- Una contraseña inicial creada desde coordinación debe tener al menos 12
  caracteres. El esquema de usuario también establece una validación mínima
  general.
- Una ficha contiene un código único, programa, periodo, instructor principal,
  aprendices y sesiones. Las sesiones pueden asignar instructores distintos.
- En una ficha, la hora de finalización debe ser posterior a la hora de inicio.
  Los bloques del mismo día no pueden superponerse.
- Los tipos de novedad admitidos son `cancelacion`, `cambio_horario`,
  `cambio_ambiente` y `general`.
- Solo un aprendiz inscrito en una ficha activa puede evaluar a un instructor
  relacionado con esa ficha.
- Las calificaciones de metodología y dominio técnico son números de 1 a 5.
  El promedio individual es el promedio de ambas.
- El comentario de evaluación es obligatorio y debe tener entre 10 y 1000
  caracteres.
- Una persona puede participar una sola vez por instructor, ficha y periodo.
- Los resultados agregados y comentarios se muestran al alcanzar al menos
  cinco respuestas para el grupo de instructor, ficha y periodo.
- Las fichas y cuentas administradas por coordinación se desactivan
  lógicamente; la acción no debe entenderse como borrado físico garantizado.

## Tecnologías y arquitectura

### Tecnologías

| Área | Tecnología | Uso |
|---|---|---|
| Interfaz | React 18 | Componentes y vistas por rol |
| Herramientas frontend | Vite 5 | Servidor de desarrollo y compilación |
| Estilos | Tailwind CSS 3 | Diseño de la interfaz |
| Iconos | Lucide React | Iconografía |
| API | Node.js y Express 4 | API REST y middleware |
| Persistencia | MongoDB y Mongoose 8 | Base de datos documental y validación de esquemas |
| Autenticación | JSON Web Token | Token de acceso para solicitudes protegidas |
| Pruebas backend | Node.js Test Runner y mongodb-memory-server | Pruebas de API y persistencia temporal |

El frontend está configurado como proyecto JavaScript/JSX con Vite; no es una
aplicación TypeScript.

### Capas del frontend

```text
src/
├── components/   Componentes visuales, formularios y paneles por rol
├── hooks/        Carga y estado reutilizable de pantallas
├── services/     Operaciones de autenticación, gestión y evaluación
└── App.jsx       Composición y selección del panel según el usuario
```

Los componentes llaman a servicios de dominio; los servicios usan el cliente
HTTP común, que agrega la URL base, el token y el manejo de errores. Las vistas
no deberían construir URLs ni administrar directamente las cabeceras de
autenticación.

### Capas del backend

```text
backend/
├── routes/       Rutas HTTP y declaración de permisos
├── controllers/  Adaptación de solicitudes y respuestas HTTP
├── services/     Reglas de negocio y coordinación de operaciones
├── models/       Esquemas y persistencia Mongoose
├── middlewares/  Autenticación, autorización y tratamiento de errores
├── config/       Conexión, JWT, seed y migraciones manuales
└── test/         Pruebas automatizadas
```

`backend/app.js` compone middleware y rutas; `backend/server.js` carga
configuración, conecta con MongoDB e inicia el servidor. El recorrido principal
es `ruta -> controlador -> servicio -> modelo`.

## Modelo de datos

La persistencia se organiza en colecciones MongoDB:

- **`users`**: cuentas, rol, datos de perfil, estado y métricas agregadas.
  Almacena el hash de contraseña, no la contraseña en texto plano.
- **`fichas`**: ficha, periodo, fechas, referencias a usuarios, inscripciones,
  sesiones semanales y novedades.
- **`evaluations`**: instructor, ficha, periodo, calificaciones, comentario y
  fecha. No incluye `learnerId`.
- **`evaluationparticipations`**: registra por separado la participación del
  aprendiz y utiliza una clave única compuesta para impedir duplicados. No
  contiene la respuesta ni el comentario.

Las sesiones y novedades son subdocumentos de `fichas`, no colecciones
independientes. Las relaciones `ObjectId` son referencias administradas por
Mongoose; MongoDB no aplica automáticamente claves foráneas relacionales.

El diagrama lógico está en [docs/modelo-datos-mongodb.md](./docs/modelo-datos-mongodb.md).

## Recorridos principales

### Aprendiz: consulta y evaluación

1. Inicia sesión con una cuenta creada por coordinación.
2. Consulta sus fichas inscritas, vigencia, horarios, instructores, temas,
   ambientes y novedades registradas.
3. Selecciona un instructor disponible en su ficha y califica metodología y
   dominio técnico de 1 a 5.
4. Envía un comentario constructivo de 10 a 1000 caracteres.
5. La API valida inscripción, instructor y participación previa. Si ya evaluó
   esa combinación de instructor, ficha y periodo, rechaza el duplicado.
6. La respuesta se almacena separada del registro de participación; la
   consolidación se muestra al grupo al alcanzar cinco respuestas.

### Coordinación: gestión académica

1. Inicia sesión con perfil de coordinación.
2. Gestiona cuentas de aprendices e instructores, fichas, sesiones e
   inscripciones.
3. Puede registrar una novedad con tipo, mensaje y fecha de clase.
4. Consulta paneles y resultados disponibles según los permisos y umbrales.
5. La importación de prueba, si se usa, exige habilitación explícita del entorno,
   vista previa y confirmación.

### Instructor: seguimiento

1. Inicia sesión con perfil de instructor.
2. Consulta las fichas y horarios asociados.
3. Actualiza su estado operativo entre los valores admitidos: `En Formación`,
   `Asesoría Técnica`, `Disponible` y `En Reunión`.
4. Consulta la retroalimentación agrupada cuando existe el mínimo de respuestas.

## API disponible

La base de rutas es `/api`. Todas las rutas de gestión requieren autenticación;
las rutas listadas con rol restringen además el acceso a ese perfil.

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `GET` | `/api/health` | Público | Estado del servicio |
| `POST` | `/api/auth/login` | Público | Inicio de sesión |
| `POST` | `/api/auth/password-reset` | Público, limitado por IP | Solicitar enlace de recuperación |
| `POST` | `/api/auth/password-reset/confirm` | Público, limitado por IP | Cambiar contraseña con token de un solo uso |
| `GET` | `/api/auth/me/:id` | Usuario autenticado | Consultar perfil |
| `GET` | `/api/instructors` | Ruta pública según configuración actual | Listado de instructores |
| `GET` | `/api/instructors/metrics/summary` | Coordinador | Resumen de métricas |
| `GET` | `/api/instructors/:id` | Coordinador o instructor | Consultar instructor |
| `PATCH` | `/api/instructors/:id/status` | Coordinador o instructor | Actualizar estado operativo |
| `POST` | `/api/evaluations` | Aprendiz | Crear evaluación |
| `GET` | `/api/evaluations/recent` | Coordinador | Consultar evaluaciones recientes disponibles |
| `GET` | `/api/evaluations/instructor/:instructorId` | Coordinador o instructor | Consultar resultados consolidados del instructor |
| `GET` | `/api/management/users` | Coordinador | Listar usuarios administrables |
| `POST` | `/api/management/users` | Coordinador | Crear usuario |
| `PATCH` | `/api/management/users/:id` | Coordinador | Actualizar usuario |
| `DELETE` | `/api/management/users/:id` | Coordinador | Desactivar usuario |
| `GET` | `/api/management/fichas` | Coordinador | Listar fichas |
| `POST` | `/api/management/fichas` | Coordinador | Crear ficha |
| `PATCH` | `/api/management/fichas/:id` | Coordinador | Actualizar ficha |
| `DELETE` | `/api/management/fichas/:id` | Coordinador | Desactivar ficha |
| `POST` | `/api/management/fichas/:fichaId/novedades` | Coordinador o instructor | Publicar novedad |
| `GET` | `/api/management/learner/schedule` | Aprendiz | Consultar horario propio |
| `GET` | `/api/management/instructor/fichas` | Instructor | Consultar fichas propias |
| `POST` | `/api/management/test-imports/preview` | Coordinador, entorno habilitado | Previsualizar importación de prueba |
| `POST` | `/api/management/test-imports/confirm` | Coordinador, entorno habilitado | Confirmar importación de prueba |

La API devuelve JSON. En las operaciones protegidas, el cliente envía el token
JWT en el encabezado de autorización HTTP. Para conocer los campos exactos de
una solicitud, revisar los servicios del frontend y los controladores y
servicios del backend; los nombres de ruta no sustituyen esa validación de
contrato.

## Requisitos previos

- Node.js y npm instalados.
- MongoDB local o una instancia MongoDB Atlas accesible.
- Acceso de red desde el backend a la instancia de MongoDB.
- Dos terminales para ejecutar frontend y backend en desarrollo.

El repositorio no fija una versión de Node.js mediante `engines`; se recomienda
usar una versión LTS compatible con las dependencias instaladas.

## Despliegue: backend en Render y frontend en Vercel

El archivo [`render.yaml`](./render.yaml) define un Blueprint para el backend:
usa `backend/` como raíz, instala las dependencias, ejecuta `npm start`,
configura `/api/health` como health check y permite que Render genere un
`JWT_SECRET`. La URI de MongoDB y los dominios públicos se ingresan como valores
privados al crear el Blueprint.

### Configurar el backend en Render

Para crear un servicio desde el Blueprint:

1. En Render, selecciona **New → Blueprint** y conecta este repositorio y la
   rama que contiene `render.yaml`.
2. Revisa que el servicio use `backend/` como raíz. Al configurar el Blueprint,
   Render genera `JWT_SECRET` y solicita los valores marcados como secretos.
3. Ingresa:
   - `MONGO_URI`: URI de MongoDB Atlas. Autoriza en Atlas las conexiones desde
     Render según la configuración de red de tu proyecto.
   - `CLIENT_ORIGINS`: origen exacto del frontend en Vercel, por ejemplo
     `https://mi-proyecto.vercel.app`, sin una barra final.
   - `FRONTEND_URL`: URL completa del frontend en Vercel; se usa para formar
     los enlaces de recuperación de contraseña.
4. Conserva `NODE_ENV=production` y `ENABLE_TEST_DATA_IMPORT=false`. No agregues
   `PORT`: Render asigna ese valor.
5. Espera el deploy y prueba `https://<servicio>.onrender.com/api/health`.
   El servicio conecta a MongoDB antes de empezar a escuchar, así que una URI
   inválida o un acceso de red denegado también impiden que el health check pase.

Si el servicio de Render ya existe y fue creado manualmente, el Blueprint no
lo modifica automáticamente. En su página de configuración usa:

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

En **Environment**, configura `NODE_ENV=production`, `ENABLE_TEST_DATA_IMPORT=false`,
`JWT_SECRET` (al menos 32 caracteres aleatorios), `MONGO_URI`, `CLIENT_ORIGINS`
y `FRONTEND_URL`. Genera el secreto localmente y pégalo directamente en Render;
no lo envíes por chat ni lo guardes en el repositorio:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Configurar el frontend en Vercel

En el proyecto de Vercel agrega la variable de entorno:

```text
VITE_API_URL=https://<servicio>.onrender.com/api
```

Usa el dominio real de tu backend Render y vuelve a desplegar Vercel para que
Vite incorpore el valor. El dominio del frontend debe ser el mismo que
autorizaste en `CLIENT_ORIGINS` y configuraste como `FRONTEND_URL`. Si usas
dominio propio o alias de producción distintos, incluye todos los orígenes que
realmente necesites en `CLIENT_ORIGINS`, separados por comas.

La recuperación de contraseña requiere además las variables `SMTP_*` descritas
en la sección [Correo de recuperación](#correo-de-recuperación). Estas no son
necesarias para que arranque el backend; hasta configurarlas, la solicitud de
recuperación indicará que el servicio de correo no está configurado.

## Instalación y ejecución local

### Clonar en otro computador (Windows / PowerShell)

1. Instala Git y Node.js LTS desde sus sitios oficiales. Comprueba en una
   terminal nueva:

   ```powershell
   git --version
   node --version
   npm.cmd --version
   ```

2. Clona el repositorio y entra a su carpeta:

   ```powershell
   cd $HOME\Documents
   git clone https://github.com/sergio9402/gestor-de-calificaciones-de-instructores-sena.git
   cd gestor-de-calificaciones-de-instructores-sena
   ```

3. Instala las dependencias del frontend y del backend:

   ```powershell
   npm.cmd install
   npm.cmd install --prefix backend
   ```

4. Crea una configuración local a partir de la plantilla:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   notepad backend\.env
   ```

   Completa `MONGO_URI`, genera un `JWT_SECRET` nuevo para ese entorno y
   configura `CLIENT_ORIGINS`. No copies `backend/.env` desde el computador
   anterior ni compartas sus valores. Si vas a habilitar recuperación de
   contraseña, agrega los datos SMTP y una `FRONTEND_URL` accesible por el
   navegador de pruebas; sin SMTP configurado, la solicitud de recuperación
   responde con un error de configuración.

5. Si es posible, crea una base de pruebas separada para el nuevo computador.
   Si necesitas conectarte a Atlas, agrega la dirección IP del computador a la
   lista de acceso de red de Atlas y utiliza un usuario de base de datos con
   privilegios mínimos. No ejecutes el seed ni importes datos en una base que
   contenga información que quieras conservar. No compartas la base de pruebas
   existente sin autorización y respaldo.

6. Inicia el backend en una terminal PowerShell:

   ```powershell
   npm.cmd run dev --prefix backend
   ```

   En otra terminal, desde la raíz del repositorio, inicia el frontend:

   ```powershell
   npm.cmd run dev
   ```

   Abre la URL que Vite indique, normalmente `http://localhost:5173`. La API
   debe responder en `http://localhost:5000/api/health`.

7. Ejecuta las comprobaciones sin modificar la base configurada en `.env`:

   ```powershell
   npm.cmd test --prefix backend
   npm.cmd run build
   ```

Las cuentas de demostración no se copian desde el equipo anterior ni se crean
automáticamente. Si hace falta un seed, revisa [Datos de demostración](#datos-de-demostración)
y usa solo una base vacía y aislada.

### 1. Instalar dependencias del frontend

Desde la raíz del proyecto:

```bash
npm install
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar el backend

Copia `backend/.env.example` a `backend/.env` y completa al menos `MONGO_URI`
y `JWT_SECRET`. Consulta [Configuración](#configuración). No uses ni compartas
secretos de otra persona o entorno.

### 4. Iniciar la API

Desde la carpeta `backend/`:

```bash
npm run dev
```

La API escucha en `http://localhost:5000` de forma predeterminada. Se puede
comprobar en `http://localhost:5000/api/health`.

### 5. Iniciar el frontend

En otra terminal, desde la raíz:

```bash
npm run dev
```

Vite muestra en la terminal la dirección local, normalmente
`http://localhost:5173`. El cliente usa por defecto la API
`http://localhost:5000/api`; si el backend está en otra dirección, configura
`VITE_API_URL` en el entorno del frontend, por ejemplo
`http://localhost:5000/api`.

## Configuración

Variables reconocidas por el backend (`backend/.env`):

| Variable | Propósito |
|---|---|
| `PORT` | Puerto HTTP; por defecto `5000` |
| `MONGO_URI` | Cadena de conexión a la base MongoDB |
| `JWT_SECRET` | Secreto usado para firmar tokens; debe ser propio, aleatorio y de al menos 32 caracteres |
| `NODE_ENV` | Entorno de ejecución; usa `development` localmente y `production` en producción |
| `CLIENT_ORIGINS` | Orígenes CORS permitidos, separados por comas |
| `FRONTEND_URL` | URL del frontend incluida en el enlace de recuperación; requiere HTTPS en producción |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Host, puerto y modo TLS del proveedor de correo |
| `SMTP_USER`, `SMTP_PASS` | Credenciales SMTP; guarda la contraseña solo en el entorno local o gestor de secretos |
| `SMTP_FROM` | Remitente verificado autorizado por el proveedor SMTP |
| `DEMO_INITIAL_PASSWORD` | Clave inicial del seed de demostración; solo para entorno local controlado |
| `ENABLE_TEST_DATA_IMPORT` | Debe ser `true` para habilitar la importación de prueba fuera de producción |

Para generar un secreto JWT en Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El valor debe guardarse únicamente en `backend/.env` o en el gestor de secretos
del entorno. No lo escribas en el código, README, capturas ni repositorio.

### Correo de recuperación

La aplicación usa SMTP estándar mediante Nodemailer; se recomienda configurar
Brevo como proveedor inicial de pruebas. En el panel del proveedor crea o
consulta las credenciales SMTP y verifica el remitente. Configura esos valores
en `backend/.env` usando las variables `SMTP_*`, `SMTP_FROM` y
`FRONTEND_URL`. Para muchos proveedores, el puerto 587 usa STARTTLS
(`SMTP_SECURE=false`) y el puerto 465 usa TLS directo (`SMTP_SECURE=true`).
Confirma los valores vigentes en la documentación del proveedor antes de
configurarlo. No uses la contraseña normal de tu correo personal como clave SMTP.

Como referencia, Brevo suele proporcionar `smtp-relay.brevo.com` en el puerto
587, un usuario SMTP y una clave SMTP independiente; el remitente debe estar
verificado en la cuenta. Usa la configuración que aparezca en el panel de tu
cuenta, ya que el proveedor puede cambiar requisitos o credenciales.

El endpoint de solicitud responde con un mensaje genérico, almacena solo el hash
del token, reemplaza enlaces anteriores, limita solicitudes por IP y vence el
enlace a los 30 minutos. Al cambiar la contraseña, se invalidan los tokens de
recuperación pendientes y las sesiones JWT anteriores; el usuario debe iniciar
sesión otra vez. Si el SMTP no está configurado o falla el envío, la solicitud
devuelve un error y el servidor registra un mensaje de diagnóstico sin la
contraseña SMTP.

Los límites de solicitudes usan el almacén en memoria del proceso Express. En
un despliegue con varias instancias se debe configurar un almacén compartido
antes de producción para que el límite sea consistente entre instancias.

La URI de MongoDB puede contener credenciales: codifica los caracteres
especiales de usuario y contraseña según el formato de URI. Nunca publiques
`MONGO_URI`. Si Atlas proporciona una conexión SRV y la resolución DNS no está
disponible, consulta la configuración de red de Atlas antes de optar por hosts
individuales; cualquier URI alternativa sigue siendo confidencial.

## Datos de demostración

El backend incluye `npm run seed` para cargar cuentas de demostración solamente
cuando el seed se ejecuta explícitamente, el entorno no es producción y la base
está vacía. Configura primero `DEMO_INITIAL_PASSWORD` con una clave local segura.
Verifica cuidadosamente `MONGO_URI` antes de correrlo: no ejecutes seeds sobre
una base con información que debas conservar.

Existe además una importación temporal de datos sintéticos desde la pantalla de
gestión académica. La función requiere una base de pruebas aislada,
`ENABLE_TEST_DATA_IMPORT=true`, usuario coordinador y confirmación tras revisar
la vista previa. Se bloquea en producción. Los archivos con datos personales o
credenciales locales están excluidos de Git y no deben compartirse ni subirse.
La importación no es un paso requerido para ejecutar la aplicación.

Si una base de desarrollo fue creada con el índice anterior de participaciones,
la migración es manual, requiere respaldo previo y está bloqueada en producción.
Desde PowerShell, en la raíz del repositorio:

```powershell
$env:ALLOW_EVALUATION_PARTICIPATION_MIGRATION = 'true'
npm run migrate:participation --prefix backend
```

No ejecutes la migración en una base compartida o productiva sin revisión,
respaldo y autorización del responsable de esa base.

## Pruebas y compilación

Pruebas del backend:

```bash
npm test --prefix backend
```

Las pruebas usan `mongodb-memory-server` y una base MongoDB temporal en memoria;
no deben leer ni modificar `MONGO_URI`. En la primera ejecución puede ser
necesario descargar el binario de MongoDB usado localmente por esa dependencia.

Compilación de producción del frontend:

```bash
npm run build
```

Vista previa local de la compilación:

```bash
npm run preview
```

La vista previa de Vite no sustituye el despliegue de la API ni de MongoDB.

## Seguridad y privacidad

- No subas `backend/.env`, tokens, URI de MongoDB, credenciales ni CSV de claves.
- Usa una base de datos aislada para pruebas, seeds e importaciones.
- Las rutas de administración y evaluación verifican autenticación y rol en el
  backend.
- Las contraseñas se hashean con scrypt; el modelo no las selecciona en
  consultas normales.
- Los enlaces de recuperación se generan con tokens aleatorios de un solo uso;
  en MongoDB se almacena el hash y la expiración, no el token original. El
  cambio invalida los JWT emitidos antes de actualizar la contraseña.
- Los endpoints de recuperación tienen límites por IP en cada proceso del
  backend. Detrás de un proxy inverso, configura correctamente la confianza del
  proxy y un almacén de límites compartido antes de escalar.
- El token del frontend se guarda en `localStorage`. Para producción, revisa
  este diseño frente al modelo de amenazas del despliegue y considera una
  estrategia de sesión adecuada.
- Las respuestas de evaluación no contienen el identificador del aprendiz, pero
  la colección separada de participación sí permite controlar quién participó.
  Administradores con acceso a datos y registros de infraestructura pueden
  inferir información; no se debe prometer anonimato absoluto.
- El umbral de cinco respuestas reduce la exposición de grupos pequeños, pero
  no elimina todos los riesgos de inferencia ni reemplaza las políticas de
  tratamiento de datos personales.
- Antes de producción deben revisarse CORS, TLS, gestión y rotación de secretos,
  respaldos, registros, retención y eliminación de datos, autorización del
  personal y obligaciones institucionales aplicables.

## Piloto y validación con usuarios

El siguiente paso es ejecutar una prueba controlada con roles y datos
sintéticos, autorización del responsable académico y consentimiento de las
personas participantes. La guía incluye tareas, resultados esperados,
indicadores, registro de defectos y condiciones de cierre:
[guía del piloto](./docs/piloto-validacion-usuarios.md).

No usar una base real ni recopilar evaluaciones de instructores reales para
demostrar el flujo. Antes de iniciar, configura y prueba el correo SMTP de
recuperación en el entorno aislado.

## Limitaciones y trabajo futuro

1. Diseñar notificaciones y sincronización de novedades si se requieren avisos
   en tiempo real; hoy las novedades se consultan desde la aplicación.
2. Definir políticas institucionales de privacidad, conservación, acceso y
   eliminación de evaluaciones y datos personales.
3. Evaluar estrategias de despliegue, copias de seguridad, monitoreo,
   disponibilidad y recuperación ante fallas.
4. Ampliar validaciones automatizadas de interfaz y pruebas de accesibilidad.
5. Definir requisitos de exportación e informes con los responsables del
   proceso, antes de implementarlos.

## Licencia y uso

No se ha declarado una licencia de distribución en este documento. Antes de
reutilizar o publicar el software, confirma los derechos, dependencias y
condiciones de uso aplicables. Este proyecto es una herramienta académica y no
representa una aplicación oficial del SENA.
