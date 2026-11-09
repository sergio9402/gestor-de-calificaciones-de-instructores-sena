import React from 'react';
import { X, Star, Building2, BookOpen, MessageSquare, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';

export default function InstructorDetailModal({ instructor, isOpen, onClose, onEvaluate }) {
  if (!isOpen || !instructor) return null;

  const totalEvaluations = instructor.totalEvaluaciones || 0;
  const ratingVal = totalEvaluations ? Number(instructor.promedioGeneral || 0).toFixed(1) : '—';
  const methVal = totalEvaluations ? Number(instructor.promedioMetodologia || 0).toFixed(1) : '—';
  const techVal = totalEvaluations ? Number(instructor.promedioTecnico || 0).toFixed(1) : '—';
  const instName = instructor.name || instructor.nombre || 'Instructor';
  const instModule = instructor.module || instructor.especialidad || 'Módulo de Formación';
  const instCenter = instructor.center || instructor.centro || 'Centro SENA';
  const evaluationsList = instructor.evaluacionesConsolidadas || [];
  const feedbackCount = evaluationsList.reduce(
    (count, group) => count + (group.comentarios?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00324D] to-[#044c74] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={instructor.avatar}
              alt={instName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
            />
            <div className="text-center sm:text-left">
              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#39A900] text-white mb-1.5 shadow-xs">
                Instructor SENA Titulado
              </span>
              <h2 className="text-2xl font-black text-white">{instName}</h2>
              <p className="text-xs text-slate-200 mt-1 flex items-center justify-center sm:justify-start gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#39A900]" />
                {instModule}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {instCenter}
              </p>
            </div>
          </div>
        </div>

        {/* Score Summary Strip */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200 p-4 text-center">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Promedio General</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xl font-black text-slate-900">{ratingVal}</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Metodología</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39A900]"></span>
              <span className="text-xl font-black text-slate-900">{methVal}</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Dominio Técnico</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00324D]"></span>
              <span className="text-xl font-black text-slate-900">{techVal}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Evaluations / Comments */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#39A900]" />
              Retroalimentaciones de Aprendices ({feedbackCount})
            </h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Comentarios sin datos identificativos
            </span>
          </div>

          {evaluationsList.length > 0 ? (
            <div className="space-y-3">
              {evaluationsList.map((evalItem) => {
                const itemRating = ((evalItem.promedioMetodologia + evalItem.promedioTecnico) / 2).toFixed(1);
                return (
                  <div 
                    key={`${evalItem.fichaId}-${evalItem.periodo}`}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Periodo {evalItem.periodo} · {evalItem.totalEvaluaciones} respuestas
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          ★ {itemRating}
                        </span>
                      </div>
                    </div>

                    {/* Competencies Badges in review */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                        Metodología promedio: <strong className="text-emerald-700">{evalItem.promedioMetodologia}/5</strong>
                      </span>
                      <span className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                        Dominio Técnico promedio: <strong className="text-[#00324D]">{evalItem.promedioTecnico}/5</strong>
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {(evalItem.comentarios || []).map((comment, index) => (
                        <li key={`${evalItem.fichaId}-${evalItem.periodo}-${index}`} className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                          “{comment}”
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Los comentarios se muestran al alcanzar al menos cinco respuestas en el grupo.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-all"
          >
            Cerrar
          </button>
          {onEvaluate && <button
            onClick={() => {
              onClose();
              onEvaluate(instructor);
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 text-white bg-[#39A900] hover:bg-[#329200] rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Evaluar a este Instructor</span>
          </button>}
        </div>
      </div>
    </div>
  );
}
