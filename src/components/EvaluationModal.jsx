import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import StarRating from './StarRating';

const initialAnswers = (rubric) => Object.fromEntries(
  rubric.flatMap((category) => category.questions.map((question) => [
    question.code,
    { score: 5, noAplica: false },
  ]))
);

export default function EvaluationModal({
  isOpen,
  onClose,
  instructors,
  selectedInstructor,
  selectedFichaId,
  rubric,
  onSubmitEvaluation,
}) {
  const [instructorId, setInstructorId] = useState('');
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedInstructor) {
      setInstructorId(String(selectedInstructor.id || selectedInstructor._id));
    } else if (instructors.length > 0 && !instructorId) {
      setInstructorId(String(instructors[0].id || instructors[0]._id));
    }
    if (rubric.length > 0) setAnswers(initialAnswers(rubric));
    setError('');
  }, [selectedInstructor, isOpen, instructors, rubric]);

  if (!isOpen) return null;

  const currentInstructor = instructors.find(
    (instructor) => String(instructor.id || instructor._id) === String(instructorId)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!instructorId) {
      setError('Por favor selecciona un instructor para evaluar.');
      return;
    }
    if (rubric.length === 0) {
      setError('No se pudo cargar la rúbrica. Cierra el formulario e inténtalo nuevamente.');
      return;
    }
    if (comment.trim().length < 15) {
      setError('Por favor escribe un comentario constructivo de al menos 15 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitEvaluation({
        instructorId,
        fichaId: selectedFichaId,
        respuestas: rubric.flatMap((category) =>
          category.questions.map((question) => ({
            codigo: question.code,
            calificacion: answers[question.code].noAplica
              ? null
              : Number(answers[question.code].score),
            noAplica: answers[question.code].noAplica,
          }))
        ),
        comment: comment.trim(),
      });
      setComment('');
      setAnswers(initialAnswers(rubric));
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'No se pudo enviar la evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#00324D] to-[#044c74] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10"
            aria-label="Cerrar evaluación"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#39A900] bg-[#39A900]/20 w-fit px-2.5 py-1 rounded-full mb-2 border border-[#39A900]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Evaluación anónima del aprendiz
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Evaluar desempeño docente</h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1">
            Califica los aspectos que observaste durante tu formación. Usa una escala de 1 a 5.
          </p>
        </div>

        <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-2.5 flex items-center gap-2.5 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-[#39A900] shrink-0" />
          <span>
            <strong>Privacidad:</strong> la respuesta no guarda tu identificador; la prevención de duplicados se almacena por separado.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="evaluation-instructor" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Instructor a evaluar
            </label>
            <select
              id="evaluation-instructor"
              value={instructorId}
              onChange={(event) => setInstructorId(event.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="" disabled>-- Elige un instructor --</option>
              {instructors.map((instructor) => (
                <option key={instructor.id || instructor._id} value={String(instructor.id || instructor._id)}>
                  {instructor.name || instructor.nombre} - {instructor.module || instructor.especialidad}
                </option>
              ))}
            </select>
            {currentInstructor && (
              <p className="mt-2 text-xs text-slate-600">
                Promedio actual: {Number(currentInstructor.rating || currentInstructor.promedioGeneral || 0).toFixed(1)} / 5
                {' '}({currentInstructor.ratingsCount || currentInstructor.totalEvaluaciones || 0} evaluaciones)
              </p>
            )}
          </div>

          {rubric.map((category, categoryIndex) => (
            <fieldset key={category.code} className="rounded-xl border border-slate-200 p-4 space-y-4">
              <legend className="px-2 text-sm font-bold text-[#00324D]">
                {categoryIndex + 1}. {category.name}
              </legend>
              {category.questions.map((question) => (
                <div key={question.code} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{question.label}</p>
                      <p className="text-xs text-slate-500">{question.description}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {answers[question.code]?.noAplica
                        ? 'No aplica'
                        : `${answers[question.code]?.score || 5} / 5`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <StarRating
                      value={answers[question.code]?.score || 5}
                      onChange={(score) => setAnswers((current) => ({
                        ...current,
                        [question.code]: { score, noAplica: false },
                      }))}
                      readOnly={Boolean(answers[question.code]?.noAplica)}
                      size="md"
                    />
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(answers[question.code]?.noAplica)}
                      onChange={(event) => setAnswers((current) => ({
                        ...current,
                        [question.code]: {
                          ...current[question.code],
                          noAplica: event.target.checked,
                        },
                      }))}
                    />
                    No me consta / No aplica
                  </label>
                </div>
              ))}
            </fieldset>
          ))}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="evaluation-comment" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#39A900]" />
                Comentario constructivo anónimo
              </label>
              <span className={`text-[11px] font-medium ${comment.length >= 15 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {comment.length} caracteres (mínimo 15)
              </span>
            </div>
            <textarea
              id="evaluation-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows="3"
              maxLength={1000}
              placeholder="Escribe una observación respetuosa que ayude a mejorar la formación."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#39A900] resize-y"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              Sé respetuoso y brinda observaciones constructivas.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rubric.length === 0}
              className="flex items-center gap-2 bg-[#39A900] hover:bg-[#308d00] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : <><Send className="w-3.5 h-3.5" /> Enviar evaluación</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
