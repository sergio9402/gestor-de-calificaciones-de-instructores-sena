import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, MapPin, RefreshCw, Star } from 'lucide-react';
import EvaluationModal from './EvaluationModal';
import Header from './Header';
import { submitEvaluation } from '../services/evaluationService';
import { getLearnerSchedule } from '../services/managementService';

export default function LearnerDashboard({ user, onLogout }) {
  const [fichas, setFichas] = useState([]);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLearnerSchedule();
      setFichas(data || []);
    } catch (loadError) {
      setError(loadError.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleEvaluation = async ({
    instructorId,
    fichaId,
    methodology,
    technicalDomain,
    comment,
  }) => {
    await submitEvaluation({
      instructorId,
      fichaId,
      methodology,
      technicalDomain,
      comment,
    });
    await loadSchedule();
    setNotice('Tu evaluación fue recibida de forma anónima.');
  };

  const instructorsForFicha = (ficha) => {
    if (ficha.sesiones?.length) {
      return [...new Map(
        ficha.sesiones
          .filter((session) => session.instructor?._id)
          .map((session) => [String(session.instructor._id), {
            ...session.instructor,
            name: session.instructor.nombre,
            module: session.instructor.especialidad || session.tema,
          }])
      ).values()];
    }
    return ficha.instructor ? [{
      ...ficha.instructor,
      name: ficha.instructor.nombre,
      module: ficha.instructor.especialidad,
    }] : [];
  };

  const openEvaluation = (ficha, instructorId) => {
    setNotice('');
    setSelectedFicha(ficha);
    setSelectedInstructorId(instructorId || instructorsForFicha(ficha)[0]?._id || '');
  };

  return (
    <>
      <Header
        currentUser={user}
        onLogout={onLogout}
        onOpenEvaluate={() => fichas[0] && openEvaluation(fichas[0])}
      />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl bg-[#00324D] p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold">Mi formación</h1>
          <p className="mt-2 text-sm text-slate-200">
            Consulta tus fichas, horarios, instructores y novedades. La evaluación no incluye tu identidad y sus resultados se muestran cuando hay al menos cinco respuestas.
          </p>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button type="button" className="ml-auto underline" onClick={loadSchedule}>
              Reintentar
            </button>
          </div>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Fichas asignadas</h2>
          <button
            type="button"
            onClick={loadSchedule}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>

        {loading ? (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-600">Cargando tus fichas...</p>
        ) : fichas.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Aún no tienes fichas asignadas. Comunícate con coordinación.
          </p>
        ) : (
          <div className="grid gap-4">
            {fichas.map((ficha) => (
              <article key={ficha._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#39A900]">
                      Ficha {ficha.codigo}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#00324D]">{ficha.programa}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Periodo {ficha.periodo}</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Instructor: {ficha.instructor?.nombre || 'Por asignar'}
                    </p>
                    {ficha.fechaInicio && ficha.fechaFin && (
                      <p className="mt-1 text-xs text-slate-500">
                        Vigencia: {new Date(ficha.fechaInicio).toLocaleDateString('es-CO', { timeZone: 'UTC' })} – {new Date(ficha.fechaFin).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                      </p>
                    )}
                  </div>
                </div>

                {ficha.sesiones?.length ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-slate-800">Horario semanal</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left text-xs">
                        <thead className="text-slate-500">
                          <tr><th className="p-2">Día</th><th className="p-2">Hora</th><th className="p-2">Instructor</th><th className="p-2">Tema</th><th className="p-2">Ambiente</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ficha.sesiones.map((session, index) => (
                            <tr key={`${session.dia}-${session.horaInicio}-${index}`}>
                              <td className="p-2 font-semibold">{session.dia}</td>
                              <td className="p-2 whitespace-nowrap"><Clock3 className="mr-1 inline h-3.5 w-3.5 text-[#39A900]" />{session.horaInicio}–{session.horaFin}</td>
                              <td className="p-2">{session.instructor?.nombre || 'Instructor pendiente'}</td>
                              <td className="p-2">{session.tema || 'Por confirmar'}</td>
                              <td className="p-2"><MapPin className="mr-1 inline h-3.5 w-3.5 text-[#39A900]" />{session.ambiente || 'Por confirmar'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {instructorsForFicha(ficha).map((instructor) => {
                        const evaluated = ficha.instructoresEvaluados?.includes(String(instructor._id));
                        return (
                          <button
                            key={instructor._id}
                            type="button"
                            disabled={evaluated}
                            onClick={() => openEvaluation(ficha, String(instructor._id))}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#39A900] px-3 py-2 text-xs font-bold text-white hover:bg-[#318f00] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Star className="h-4 w-4" />
                            {evaluated ? `Evaluación enviada: ${instructor.nombre}` : `Evaluar: ${instructor.nombre}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <p><CalendarDays className="mr-2 inline h-4 w-4 text-[#39A900]" />{ficha.dias?.length ? ficha.dias.join(', ') : 'Días por confirmar'}</p>
                      <p><Clock3 className="mr-2 inline h-4 w-4 text-[#39A900]" />{ficha.horaInicio} – {ficha.horaFin}</p>
                      <p><MapPin className="mr-2 inline h-4 w-4 text-[#39A900]" />{ficha.ambiente || 'Ambiente por confirmar'}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!ficha.instructor?._id || ficha.yaEvaluo}
                      onClick={() => openEvaluation(ficha)}
                      className="inline-flex h-fit items-center justify-center gap-2 rounded-xl bg-[#39A900] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#318f00] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Star className="h-4 w-4" />
                      {ficha.yaEvaluo ? 'Evaluación enviada' : 'Evaluar instructor'}
                    </button>
                  </div>
                )}

                {ficha.novedades?.length > 0 && (
                  <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="text-sm font-bold text-amber-900">Novedades de la ficha</h4>
                    <ul className="mt-2 space-y-2">
                      {ficha.novedades.map((novedad) => (
                        <li key={novedad._id} className="text-sm text-amber-900">
                          <strong>{novedad.tipo.replaceAll('_', ' ')}</strong>
                          {' — '}{novedad.mensaje}
                          <span className="ml-2 text-xs text-amber-700">
                            Clase: {new Date(novedad.fechaClase).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      <EvaluationModal
        isOpen={Boolean(selectedFicha)}
        onClose={() => setSelectedFicha(null)}
        instructors={selectedFicha ? instructorsForFicha(selectedFicha).map((instructor) => ({
          ...instructor,
          rating: instructor.promedioGeneral,
          ratingsCount: instructor.totalEvaluaciones,
        })) : []}
        selectedInstructor={selectedFicha
          ? instructorsForFicha(selectedFicha).find((instructor) =>
            String(instructor._id) === String(selectedInstructorId)
          )
          : null}
        selectedFichaId={selectedFicha?._id}
        onSubmitEvaluation={handleEvaluation}
      />
    </>
  );
}
