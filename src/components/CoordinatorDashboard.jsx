import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Activity, 
  Clock, 
  MapPin, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  BookOpen, 
  FileText,
  Building,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import MetricsPanel from './MetricsPanel';
import InstructorCard from './InstructorCard';
import StarRating from './StarRating';

export default function CoordinatorDashboard({ 
  user, 
  instructors, 
  onSelectInstructor, 
  onEvaluateInstructor 
}) {
  const [activeTab, setActiveTab] = useState('operational'); // 'operational' | 'metrics' | 'directory'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Counters
  const totalInstructors = instructors.length;
  const inClassCount = instructors.filter(i => i.operationalStatus === 'En Formación').length;
  const inAdvisoryCount = instructors.filter(i => i.operationalStatus === 'En Asesoría').length;
  const availableCount = instructors.filter(i => i.operationalStatus === 'Disponible').length;
  const avgOverall = (instructors.reduce((acc, curr) => acc + curr.rating, 0) / instructors.length).toFixed(2);

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'En Formación':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            En Formación
          </span>
        );
      case 'En Asesoría':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            En Asesoría
          </span>
        );
      case 'Disponible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Disponible
          </span>
        );
      case 'En Reunión':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            En Reunión
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            {status || 'Activo'}
          </span>
        );
    }
  };

  // Filtered list
  const filteredInstructors = instructors.filter(i => {
    const matchesSearch = 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.currentRoom?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    return i.operationalStatus === statusFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Executive Coordinator Banner */}
      <div className="bg-gradient-to-r from-[#00324D] via-[#034366] to-[#39A900] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-white/25">
            <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
            <span>Panel Gerencial • Coordinación Académica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Supervisión Operativa & Aseguramiento de Calidad
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Bienvenida, <strong>{user.name}</strong>. Monitorea en vivo el estado operativo de los instructores, las fichas en ejecución y los indicadores de satisfacción docente.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Instructores
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#00324D]">{totalInstructors}</span>
              <span className="text-xs text-slate-500 font-semibold">a cargo</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600">
              100% Asignados
            </span>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#00324D]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              En Formación Ahora
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-600">{inClassCount}</span>
              <span className="text-xs text-slate-500 font-semibold">en aula</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold text-slate-500">
              {inAdvisoryCount} en asesoría técnica
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Disponibles en Sede
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-sky-600">{availableCount}</span>
              <span className="text-xs text-slate-500 font-semibold">docentes</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold text-slate-500">
              Listos para refuerzo
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Promedio de Calidad
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-500">{avgOverall}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700">
              Nivel Sobresaliente
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Coordinator */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('operational')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'operational'
              ? 'bg-[#00324D] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-[#39A900]" />
          <span>Estado Operativo en Tiempo Real</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'bg-[#00324D] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#39A900]" />
          <span>Métricas & Competencias SENA</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'bg-[#00324D] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#39A900]" />
          <span>Directorio General</span>
        </button>
      </div>

      {/* Subview 1: Operational Status Table */}
      {activeTab === 'operational' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#00324D]">
                Bitácora de Estado Operativo de la Planta Docente
              </h2>
              <p className="text-xs text-slate-500">
                Monitorea la ubicación física, fichas activas y el rendimiento docente en vivo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar instructor o aula..."
                  className="pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#39A900]"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="En Formación">🟢 En Formación</option>
                <option value="En Asesoría">🔵 En Asesoría</option>
                <option value="Disponible">⚪ Disponible</option>
                <option value="En Reunión">🟣 En Reunión</option>
              </select>
            </div>
          </div>

          {/* Operational Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Instructor / Módulo</th>
                  <th className="py-3 px-4">Estado Operativo</th>
                  <th className="py-3 px-4">Ambiente / Ubicación</th>
                  <th className="py-3 px-4">Fichas Vinculadas</th>
                  <th className="py-3 px-4">Calificación Promedio</th>
                  <th className="py-3 px-4">Evaluaciones</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInstructors.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Instructor Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={inst.avatar}
                          alt={inst.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">
                            {inst.name}
                          </span>
                          <span className="text-slate-500 text-[11px] block line-clamp-1 max-w-[220px]">
                            {inst.module}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Operational Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(inst.operationalStatus)}
                    </td>

                    {/* Current Room */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {inst.currentRoom || 'Sede Principal'}
                      </span>
                    </td>

                    {/* Fichas */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {inst.assignedFichas && inst.assignedFichas.length > 0 ? (
                          inst.assignedFichas.map(f => (
                            <span key={f} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Sin ficha</span>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StarRating value={inst.rating} size="sm" />
                        <span className="font-extrabold text-slate-900 ml-1">
                          {inst.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Evaluations */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {inst.ratingsCount} votos
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectInstructor(inst)}
                        className="text-xs font-bold text-[#00324D] hover:text-[#39A900] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>Auditar</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Subview 2: Full Institutional Metrics Panel */}
      {activeTab === 'metrics' && (
        <MetricsPanel
          instructors={instructors}
          onEvaluateInstructor={onEvaluateInstructor}
        />
      )}

      {/* Subview 3: Directory */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((instructor) => (
            <InstructorCard
              key={instructor.id}
              instructor={instructor}
              onEvaluate={onEvaluateInstructor}
              onSelect={onSelectInstructor}
            />
          ))}
        </div>
      )}

    </div>
  );
}

