# Guía para el piloto de validación con usuarios

## Propósito

Validar que aprendices, instructores y coordinación puedan completar las tareas
principales del prototipo y detectar problemas de comprensión, accesibilidad,
seguridad y operación antes de considerar un despliegue más amplio.

El piloto valida una **versión académica en entorno aislado**; no representa una
integración oficial ni una autorización institucional para procesar datos reales.

## Condiciones antes de iniciar

- Obtener autorización del responsable académico y consentimiento informado de
  cada participante.
- Usar una instancia de pruebas separada de producción y sin datos personales
  reales; crear cuentas y horarios sintéticos.
- Definir quién administra las cuentas, dónde se ejecuta el piloto y quién recibe
  los reportes de defectos.
- Configurar SMTP en el entorno de pruebas y comprobar entrega, expiración y uso
  único de los enlaces de recuperación.
- Informar a las personas que las evaluaciones son seudónimas, no anónimas en
  sentido absoluto. No recopilar comentarios sobre docentes reales durante una
  demostración pública.
- Acordar el periodo, la ficha sintética, las personas responsables y las reglas
  de conservación/borrado de los datos generados.

## Participantes sugeridos

Para una sesión inicial controlada:

- 1 persona de coordinación.
- 1 o 2 instructores de prueba.
- Al menos 5 aprendices de prueba, de modo que se pueda validar el umbral mínimo
  de publicación de resultados.
- 1 facilitador que observe y registre tiempos y dificultades sin ayudar salvo
  que la persona se bloquee.

La cantidad es una propuesta para comprobar los flujos; debe ajustarse con el
responsable del proceso antes de reclutar participantes.

## Guion de tareas

| Código | Perfil | Tarea | Resultado esperado |
|---|---|---|---|
| P-01 | Todos | Iniciar sesión con la cuenta del rol asignado | Accede al panel correcto y no ve operaciones de otros roles |
| P-02 | Aprendiz | Encontrar la siguiente clase de la ficha sintética | Identifica día, hora, instructor y ambiente sin ayuda |
| P-03 | Aprendiz | Consultar una novedad registrada | Encuentra el tipo, mensaje y fecha de clase |
| P-04 | Coordinación | Crear o editar una ficha y sus bloques | Datos válidos se guardan; traslapes y horas inválidas se rechazan |
| P-05 | Coordinación | Publicar una cancelación y un cambio de ambiente | Ambas novedades aparecen en la consulta del aprendiz |
| P-06 | Instructor | Consultar sus fichas y cambiar su estado operativo | Solo consulta sus asignaciones y el estado actualizado persiste |
| P-07 | Aprendiz | Enviar una evaluación válida | Se registra la calificación y el aprendiz queda marcado como participante |
| P-08 | Aprendiz | Intentar enviar otra evaluación para la misma combinación | El sistema rechaza el duplicado y conserva una sola respuesta |
| P-09 | Coordinación/instructor | Consultar resultados antes de cinco respuestas y después de completar cinco | No se muestra la consolidación antes del umbral; se muestra al alcanzarlo |
| P-10 | Usuario de prueba | Solicitar recuperación, abrir el correo y cambiar contraseña | El enlace funciona una vez, vence en 30 minutos y las sesiones anteriores dejan de servir |
| P-11 | Usuario de prueba | Abrir de nuevo el enlace ya usado o uno vencido | El sistema lo rechaza e indica solicitar un enlace nuevo |
| P-12 | Coordinación | Intentar una acción administrativa con rol de aprendiz | La API responde acceso denegado |

No usar correos o contraseñas reales de aprendices en la evidencia del piloto.
Las claves de prueba se entregan por un canal separado y se cambian al terminar.

## Indicadores para registrar

Registrar únicamente datos necesarios para evaluar usabilidad. Para cada
tarea, anotar si se completó sin ayuda, si necesitó ayuda, el tiempo aproximado,
el error observado y una sugerencia textual sin datos personales.

| Indicador | Cálculo |
|---|---|
| Éxito de tarea | Tareas completadas sin ayuda / tareas intentadas × 100 |
| Tiempo de consulta | Mediana de segundos desde que se presenta la tarea P-02 hasta encontrar la sesión |
| Éxito de recuperación | Recuperaciones completadas / solicitudes de recuperación válidas × 100 |
| Intentos duplicados controlados | Intentos duplicados rechazados / intentos duplicados realizados × 100 |
| Satisfacción de tarea | Valoración posterior de 1 a 5 por tarea, junto con comentario opcional |
| Incidentes | Número y severidad de defectos reproducibles, especialmente permisos, datos expuestos o enlaces reutilizables |

Antes del piloto, el responsable debe fijar umbrales de aceptación y decidir qué
defectos bloquean el avance. Como criterio inicial propuesto, no avanzar con
defectos críticos o altos; revisar resultados de usabilidad con el equipo antes
de fijar porcentajes definitivos.

## Registro de resultados

Completar después de la sesión:

- Fecha, versión del prototipo y entorno:
- Responsable y perfiles participantes (usar códigos, no nombres):
- Tareas ejecutadas y tareas bloqueadas:
- Resultados de indicadores:
- Defectos priorizados (crítico/alto/medio/bajo):
- Observaciones de accesibilidad y comprensión:
- Decisión: continuar, corregir y repetir, o detener:
- Acciones, responsable y fecha objetivo:
- Confirmación de borrado o conservación autorizada de los datos de prueba:

## Cierre y protección de datos

Al finalizar, revocar cuentas de prueba, retirar enlaces pendientes, borrar o
conservar los resultados solo según la autorización previa y documentar el
cierre. No subir al repositorio exportaciones con nombres, documentos,
direcciones de correo, contraseñas ni evaluaciones identificables.
