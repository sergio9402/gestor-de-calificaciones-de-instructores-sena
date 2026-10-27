import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Star, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Activity
} from 'lucide-react';
import StarRating from './StarRating';
import { mockFichas } from '../data/mockFichas';

export default function InstructorDashboard({ user, instructors, onUpdateStatus }) {
  // Encontrar datos actualizados en tiempo real desde el estado global
  const currentInstructorData = instructors.find(
    i => String(i.id || i._id) === String(user.id || user._id)
  ) || user;

  const myFichas = mockFichas.filter(
    f => String(f.instructorId) === String(user.id || user._id)
  );

  const [activeTab, setActiveTab] = useState('fichas'); // 'fichas' | 'evaluaciones'
  const [operationalStatus, setOperationalStatus] = useState(
    currentInstructorData.operationalStatus || currentInstructorData.estado || 'En Formación'
  );

  // Sincronizar estado local si cambia externamente
  useEffect(() => {
    const status = currentInstructorData.operationalStatus || currentInstructorData.estado;
    if (status) {
      setOperationalStatus(status);
    }
  }, [currentInstructorData]);

  // Manejador del cambio de estado operativo (sincroniza con Coordinación)
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setOperationalStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(user.id || user._id, newStatus);
    }
  };

  // Colores según estado operativo
  const getStatusColor = (status) => {
    switch (status) {
      case 'En Formación':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Asesoría Técnica':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Disponible':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'En Reunión':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Métricas calculadas en vivo
  const liveRating = Number(currentInstructorData.rating || currentInstructorData.promedioGeneral || 5.0).toFixed(1);
  const liveMethodology = Number(currentInstructorData.methodology || currentInstructorData.promedioMetodologia || 5.0).toFixed(1);
  const liveTechnical = Number(currentInstructorData.technicalDomain || currentInstructorData.promedioTecnico || 5.0).toFixed(1);
  const liveCount = currentInstructorData.ratingsCount || currentInstructorData.totalEvaluaciones || 0;
  const liveEvaluations = currentInstructorData.evaluations || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Profile & Status Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#39A900]/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Instructor Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={currentInstructorData.avatar || user.avatar}
                alt={currentInstructorData.name || user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-[#39A900]/20 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#39A900] text-white p-1 rounded-full ring-2 ring-white">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold bg-[#00324D] text-white px-2.5 py-0.5 rounded-full">
                  Instructor Titulado SENA
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(operationalStatus)}`}>
                  ● {operationalStatus}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#00324D]">
                {currentInstructorData.name || user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {currentInstructorData.module || currentInstructorData.especialidad || user.module}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentInstructorData.center || user.center}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {currentInstructorData.horario || user.schedule || '07:00 AM - 01:00 PM'}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Status Switcher (Sincronizado en Vivo) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 self-stretch sm:self-auto min-w-[260px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Mi Estado Operativo Actual
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <select
              value={operationalStatus}
              onChange={handleStatusChange}
              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] cursor-pointer shadow-xs"
            >
              <option value="En Formación">🟢 En Formación (En Aula)</option>
              <option value="Asesoría Técnica">🔵 En Asesoría Técnica</option>
              <option value="Disponible">⚪ Disponible en Sede</option>
              <option value="En Reunión">🟣 En Reunión Pedagógica</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3 text-[#39A900]" />
              Sincronizado en tiempo real con Coordinación.
            </p>
          </div>

        </div>

        {/* Competencies Ribbon Actualizado en Vivo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-900 block">Calificación General</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-black text-amber-950">
                {liveRating}
              </span>
              <span className="text-xs text-amber-800">/ 5.0</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-900 block">Metodología</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39A900]"></span>
              <span className="text-2xl font-black text-emerald-950">
                {liveMethodology}
              </span>
              <span className="text-xs text-emerald-800">/ 5.0</span>
            </div>
          </div>

          <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100">
            <span className="text-[11px] font-bold text-sky-900 block">Dominio Técnico</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00324D]"></span>
              <span className="text-2xl font-black text-sky-950">
                {liveTechnical}
              </span>
              <span className="text-xs text-sky-800">/ 5.0</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 block">Evaluaciones Recibidas</span>
            <div className="flex items-center gap-1.5 mt-1">
              <MessageSquare className="w-5 h-5 text-[#39A900]" />
              <span className="text-2xl font-black text-slate-800">
                {liveCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">aprendices</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Navigation: Fichas vs Evaluaciones */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('fichas')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fichas'
              ? 'bg-[#39A900] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Fichas Asignadas a mi Cargo ({myFichas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluaciones')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'evaluaciones'
              ? 'bg-[#39A900] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Opiniones & Retroalimentación Anónima ({liveEvaluations.length})</span>
        </button>
      </div>

      {/* View 1: Fichas Asignadas */}
      {activeTab === 'fichas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#00324D]">
                Grupos de Formación y Horarios Asignados
              </h2>
              <p className="text-xs text-slate-500">
                Seguimiento de grupos, ambientes de formación y tasa de participación en evaluaciones.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold border">
              Vigencia Académica 2026
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myFichas.map((ficha) => {
              const evalPercent = Math.round((ficha.completedEvaluations / ficha.totalStudents) * 100);

              return (
                <div
                  key={ficha.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#39A900]/10 text-[#39A900] font-black text-xs px-2.5 py-0.5 rounded-md border border-[#39A900]/20">
                          Ficha {ficha.code}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(ficha.status)}`}>
                          {ficha.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {ficha.program}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {ficha.phase}
                      </p>
                    </div>
                  </div>

                  {/* Ficha Details Grid */}
                  <div className="grid grid-cols-2 gap-3 py-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Horario & Días:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#39A900]" />
                        {ficha.jornada}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Ambiente Físico:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {ficha.ambiente}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Aprendices Inscritos:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {ficha.totalStudents} aprendices
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Evaluaciones Listas:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ficha.completedEvaluations} de {ficha.totalStudents} ({evalPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar of Evaluations */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Participación de Aprendices en Evaluación</span>
                      <span className="text-[#39A900]">{evalPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#39A900] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${evalPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Evaluaciones & Retroalimentación Anónima */}
      {activeTab === 'evaluaciones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#00324D]">
                Comentarios Constructivos de los Aprendices ({liveEvaluations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Retroalimentación 100% anónima para el fortalecimiento de tus prácticas pedagógicas.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-[#39A900]" />
              <span>Garantía de Anonimato SENA</span>
            </div>
          </div>

          <div className="space-y-4">
            {liveEvaluations.length > 0 ? (
              liveEvaluations.map((item) => (
                <div
                  key={item.id || item._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#39A900]/10 text-[#39A900] font-bold text-xs flex items-center justify-center">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Aprendiz de Ficha</span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.date || (item.fecha ? new Date(item.fecha).toISOString().split('T')[0] : 'Reciente')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ★ {item.rating ? Number(item.rating).toFixed(1) : Number((item.methodology + item.technicalDomain) / 2).toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold text-slate-700">
                      Metodología: <strong className="text-[#39A900]">{item.methodology || item.calificacionMetodologia}/5</strong>
                    </span>
                    <span className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold text-slate-700">
                      Dominio Técnico: <strong className="text-[#00324D]">{item.technicalDomain || item.calificacionTecnica}/5</strong>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 italic bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    "{item.comment || item.comentario}"
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No hay comentarios registrados todavía.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
