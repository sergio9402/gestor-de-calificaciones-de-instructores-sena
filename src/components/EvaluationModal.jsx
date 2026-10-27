import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Star, Send, CheckCircle2, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import StarRating from './StarRating';

export default function EvaluationModal({
  isOpen,
  onClose,
  instructors,
  selectedInstructor,
  onSubmitEvaluation
}) {
  const [instructorId, setInstructorId] = useState('');
  const [methodology, setMethodology] = useState(5);
  const [technicalDomain, setTechnicalDomain] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedInstructor) {
      setInstructorId(String(selectedInstructor.id || selectedInstructor._id));
    } else if (instructors.length > 0 && !instructorId) {
      setInstructorId(String(instructors[0].id || instructors[0]._id));
    }
    setError('');
  }, [selectedInstructor, isOpen, instructors]);

  if (!isOpen) return null;

  const currentInstructor = instructors.find(
    inst => String(inst.id || inst._id) === String(instructorId)
  );

  const getScoreDescription = (val) => {
    switch (val) {
      case 5: return { text: 'Excelente - Supera expectativas', color: 'text-emerald-600 bg-emerald-50' };
      case 4: return { text: 'Muy Bueno - Cumple ampliamente', color: 'text-blue-600 bg-blue-50' };
      case 3: return { text: 'Aceptable - Cumple lo básico', color: 'text-amber-600 bg-amber-50' };
      case 2: return { text: 'Regular - Requiere refuerzo', color: 'text-orange-600 bg-orange-50' };
      case 1: return { text: 'Deficiente - Requiere intervención', color: 'text-red-600 bg-red-50' };
      default: return { text: 'Selecciona una puntuación', color: 'text-slate-500 bg-slate-50' };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!instructorId) {
      setError('Por favor selecciona un instructor para evaluar.');
      return;
    }
    if (comment.trim().length < 15) {
      setError('Por favor escribe un comentario constructivo de al menos 15 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitEvaluation({
        instructorId: instructorId,
        methodology: Number(methodology),
        technicalDomain: Number(technicalDomain),
        comment: comment.trim(),
        date: new Date().toISOString().split('T')[0]
      });
      setIsSubmitting(false);
      setComment('');
      setMethodology(5);
      setTechnicalDomain(5);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#00324D] to-[#044c74] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#39A900] bg-[#39A900]/20 w-fit px-2.5 py-1 rounded-full mb-2 border border-[#39A900]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Evaluación Anónima del Aprendiz
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Evaluar Desempeño Docente SENA
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1">
            Tu retroalimentación impulsa la calidad pedagógica y el mejoramiento continuo de la formación profesional.
          </p>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-2.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#39A900] shrink-0" />
          <span>
            <strong>Garantía de Privacidad:</strong> Tu identidad nunca será visible para el instructor ni coordinadores.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Instructor Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Selecciona el Instructor a Evaluar
            </label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all cursor-pointer"
            >
              <option value="" disabled>-- Elige un instructor --</option>
              {instructors.map((inst) => (
                <option key={inst.id || inst._id} value={String(inst.id || inst._id)}>
                  {inst.name || inst.nombre} - {inst.module || inst.especialidad}
                </option>
              ))}
            </select>

            {/* Selected Instructor Preview Card */}
            {currentInstructor && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <img
                  src={currentInstructor.avatar}
                  alt={currentInstructor.name || currentInstructor.nombre}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {currentInstructor.name || currentInstructor.nombre}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {currentInstructor.module || currentInstructor.especialidad}
                  </p>
                  <p className="text-[11px] text-[#39A900] font-semibold">
                    Promedio actual: {Number(currentInstructor.rating || currentInstructor.promedioGeneral || 5.0).toFixed(1)} ★ ({currentInstructor.ratingsCount || currentInstructor.totalEvaluaciones || 0} evaluaciones)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Competency 1: Metodología */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/90 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#39A900]"></span>
                  2. Metodología de Enseñanza (1 - 5)
                </label>
                <p className="text-xs text-slate-500">
                  Claridad pedagógica, dinamismo, guía en talleres y resolución de dudas.
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${getScoreDescription(methodology).color}`}>
                {getScoreDescription(methodology).text}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <StarRating
                value={methodology}
                onChange={setMethodology}
                readOnly={false}
                size="lg"
              />
              <span className="text-lg font-black text-slate-800">
                {methodology}.0 <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </span>
            </div>
          </div>

          {/* Competency 2: Dominio Técnico */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/90 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00324D]"></span>
                  3. Dominio Técnico y Conocimiento del Módulo (1 - 5)
                </label>
                <p className="text-xs text-slate-500">
                  Profundidad en temas técnicos, ejemplos de la industria y uso de herramientas.
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${getScoreDescription(technicalDomain).color}`}>
                {getScoreDescription(technicalDomain).text}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <StarRating
                value={technicalDomain}
                onChange={setTechnicalDomain}
                readOnly={false}
                size="lg"
              />
              <span className="text-lg font-black text-slate-800">
                {technicalDomain}.0 <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </span>
            </div>
          </div>

          {/* Anonymous Constructive Comment */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#39A900]" />
                4. Comentario Constructivo Anónimo
              </label>
              <span className={`text-[11px] font-medium ${comment.length >= 15 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {comment.length} caracteres (mínimo 15)
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              placeholder="Ejemplo: El instructor domina excelentemente los conceptos prácticos. Sugiero que las diapositivas con ejemplos de código estén disponibles antes de la sesión..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all resize-none"
            ></textarea>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              Sé respetuoso y brinda observaciones constructivas que beneficien la formación.
            </p>
          </div>

          {/* Modal Footer / Submit */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#39A900] hover:bg-[#308d00] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Evaluación Anónima</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
