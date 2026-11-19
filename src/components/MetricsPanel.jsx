import React, { useState } from 'react';
import { BarChart3, TrendingUp, Award, Users, BookOpen, CheckCircle2, Star, Sparkles, Filter } from 'lucide-react';

export default function MetricsPanel({
  instructors,
  metrics,
  onEvaluateInstructor,
  showEvaluate = true,
}) {
  const [filterModule, setFilterModule] = useState('ALL');
  const [sortField, setSortField] = useState('rating'); // 'rating', 'methodology', 'technicalDomain'

  // Calculate Institutional Metrics reactivamente
  const totalEvaluations = metrics?.totalEvaluaciones ?? instructors.reduce(
    (acc, curr) => acc + (curr.ratingsCount || curr.totalEvaluaciones || 0), 
    0
  );

  const avgOverall = metrics?.promedioGlobal !== undefined
    ? Number(metrics.promedioGlobal).toFixed(2)
    : instructors.length > 0
    ? (instructors.reduce((acc, curr) => acc + Number(curr.promedioGeneral || 0), 0) / instructors.length).toFixed(2)
    : '0.00';

  const averageCategory = (categoryCode) => {
    const institutionalValue = metrics?.promediosPorCategoria?.[categoryCode];
    if (Number.isFinite(institutionalValue)) return institutionalValue.toFixed(2);
    const eligibleInstructors = instructors.filter(
      (instructor) =>
        (instructor.totalEvaluaciones || 0) >= 5 &&
        Number.isFinite(instructor.promediosPorCategoria?.[categoryCode])
    );
    const responseCount = eligibleInstructors.reduce(
      (total, instructor) => total + instructor.totalEvaluaciones,
      0
    );
    if (!responseCount) return '0.00';
    const weightedAverage = eligibleInstructors.reduce(
      (total, instructor) =>
        total + instructor.promediosPorCategoria[categoryCode] * instructor.totalEvaluaciones,
      0
    ) / responseCount;
    return weightedAverage.toFixed(2);
  };
  const avgPedagogical = averageCategory('pedagogicas');
  const avgCommunication = averageCategory('comunicativas');
  const avgCommitment = averageCategory('compromiso');

  // Filter & Sort
  const filteredInstructors = instructors
    .filter(inst => {
      if (filterModule === 'ALL') return true;
      const mod = inst.module || inst.especialidad || '';
      return mod.toLowerCase().includes(filterModule.toLowerCase());
    })
    .sort((a, b) => {
      const getFieldVal = (item, field) => {
        if (field === 'rating') return Number(item.rating !== undefined ? item.rating : (item.promedioGeneral || 0));
        if (field === 'methodology') return Number(item.methodology !== undefined ? item.methodology : (item.promedioMetodologia || 0));
        return Number(item.technicalDomain !== undefined ? item.technicalDomain : (item.promedioTecnico || 0));
      };
      return getFieldVal(b, sortField) - getFieldVal(a, sortField);
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-[#00324D] via-[#00476e] to-[#39A900] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
            Consolidado Institucional de Competencias
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panel de Desempeño & Métricas de Formación
          </h2>
          <p className="text-slate-200 text-sm mt-2 leading-relaxed">
            Resumen de desempeño docente según los ocho criterios de la rúbrica vigente.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid Actualizados en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Promedio Institucional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Promedio Global SENA</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#00324D]">{avgOverall}</span>
              <span className="text-xs font-medium text-slate-400">/ 5.0</span>
            </div>
            <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Nivel de Calidad Superior
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Card 2: Pedagógicas y didácticas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pedagógicas y didácticas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#39A900]">{avgPedagogical}</span>
              <span className="text-xs font-medium text-slate-400">/ 5.0</span>
            </div>
            <span className="inline-block mt-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              3 criterios
            </span>
          </div>
          <div className="w-12 h-12 bg-[#39A900]/10 rounded-2xl flex items-center justify-center text-[#39A900] border border-[#39A900]/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Comunicativas y relacionales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comunicativas y relacionales</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#00324D]">{avgCommunication}</span>
              <span className="text-xs font-medium text-slate-400">/ 5.0</span>
            </div>
            <span className="inline-block mt-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              3 criterios
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-100">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Compromiso y cumplimiento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compromiso y cumplimiento</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-violet-700">{avgCommitment}</span>
              <span className="text-xs font-medium text-slate-400">/ 5.0</span>
            </div>
            <span className="inline-block mt-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              2 criterios
            </span>
          </div>
          <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 border border-violet-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: Total Evaluaciones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluaciones Recibidas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{totalEvaluations}</span>
              <span className="text-xs font-medium text-slate-400">votos</span>
            </div>
            <span className="inline-block mt-2 text-[11px] font-semibold text-[#39A900] bg-emerald-50 px-2 py-0.5 rounded-md">
              100% Participación Activa
            </span>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-200">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Comparative Competencies Chart / Graph */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        {/* Controls and Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#00324D]">
                Comparativa de Competencias por Instructor
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {filteredInstructors.length} instructores
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluación paralela: <span className="font-semibold text-[#39A900]">Metodología (Verde)</span> vs <span className="font-semibold text-[#00324D]">Dominio Técnico (Azul Petróleo)</span>
            </p>
          </div>

          {/* Filters & Sorters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Ordenar por:</span>
            </div>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="rating">Calificación General (Mayor a menor)</option>
              <option value="methodology">Metodología (Mayor a menor)</option>
              <option value="technicalDomain">Dominio Técnico (Mayor a menor)</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 py-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#39A900]"></span>
            <span>Metodología de Enseñanza</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#00324D]"></span>
            <span>Dominio Técnico Especializado</span>
          </div>
        </div>

        {/* Visual Bar Breakdown Chart */}
        <div className="space-y-6 pt-2">
          {filteredInstructors.map((inst, index) => {
            const hasEvaluations = inst.totalEvaluaciones > 0;
            const instRating = hasEvaluations ? Number(inst.promedioGeneral || 0) : 0;
            const categoryScores = hasEvaluations && inst.totalEvaluaciones >= 5
              ? inst.promediosPorCategoria || {}
              : {};
            const instName = inst.name || inst.nombre || '';
            const instModule = inst.module || inst.especialidad || '';

            return (
              <div 
                key={inst.id || inst._id} 
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-all hover:border-slate-200"
              >
                {/* Instructor Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <img
                      src={inst.avatar || 'https://placehold.co/40x40?text=SENA'}
                      alt={instName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-2xs"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {instName}
                        {instRating >= 4.8 && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Top
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">{instModule}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Promedio</span>
                      <span className="text-base font-extrabold text-[#00324D]">{hasEvaluations ? `${instRating.toFixed(1)} ★` : 'Sin evaluaciones'}</span>
                    </div>
                    {showEvaluate && <button
                      onClick={() => onEvaluateInstructor(inst)}
                      className="text-xs font-semibold px-3 py-1.5 bg-white text-[#39A900] border border-[#39A900]/30 hover:bg-[#39A900] hover:text-white rounded-lg transition-colors shadow-2xs"
                    >
                      Calificar
                    </button>}
                  </div>
                </div>

                {/* Category score bars */}
                <div className="space-y-2 mt-2">
                  {[
                    ['pedagogicas', 'Pedagógicas y didácticas', 'bg-[#39A900]'],
                    ['comunicativas', 'Comunicativas y relacionales', 'bg-[#00324D]'],
                    ['compromiso', 'Compromiso y cumplimiento', 'bg-violet-600'],
                  ].map(([code, label, barColor]) => {
                    const score = categoryScores[code];
                    const percent = Number.isFinite(score) ? Math.min(100, (score / 5) * 100) : 0;
                    return (
                      <div key={code}>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>{label}</span>
                          <span className="font-bold text-slate-800">
                            {Number.isFinite(score) ? `${score.toFixed(1)} / 5.0` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden">
                          <div className={`${barColor} h-3 rounded-full transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
