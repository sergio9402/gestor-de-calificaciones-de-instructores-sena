import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import LoginView from './components/LoginView';
import InstructorDashboard from './components/InstructorDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import InstructorCard from './components/InstructorCard';
import MetricsPanel from './components/MetricsPanel';
import EvaluationModal from './components/EvaluationModal';
import InstructorDetailModal from './components/InstructorDetailModal';
import NotificationToast from './components/NotificationToast';
import { initialInstructors } from './data/mockInstructors';
import { mockUsers } from './data/mockFichas';
import { 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  Users, 
  Award, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  BarChart2, 
  PlusCircle 
} from 'lucide-react';

export default function App() {
  // Estado de usuario autenticado
  const [currentUser, setCurrentUser] = useState(mockUsers.instructor);

  // Estado dinámico global de instructores
  const [instructors, setInstructors] = useState(initialInstructors);
  
  // Navegación para vista Aprendiz
  const [aprendizActiveTab, setAprendizActiveTab] = useState('dashboard'); // 'dashboard' | 'metrics'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating-desc');

  // Modales
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalTargetInstructor, setEvalTargetInstructor] = useState(null);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailInstructor, setDetailInstructor] = useState(null);

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  // Categorías de formación
  const categories = [
    { id: 'ALL', label: 'Todos los Programas' },
    { id: 'ADSO', label: 'ADSO & Backend' },
    { id: 'Frontend', label: 'Frontend & UI/UX' },
    { id: 'Bases de Datos', label: 'Bases de Datos' },
    { id: 'Ciberseguridad', label: 'Ciberseguridad & Cloud' },
    { id: 'IA', label: 'IA & Analítica' },
  ];

  // Filtro y búsqueda para vista pública
  const filteredInstructors = useMemo(() => {
    return instructors
      .filter((inst) => {
        const name = (inst.name || inst.nombre || '').toLowerCase();
        const mod = (inst.module || inst.especialidad || '').toLowerCase();
        const center = (inst.center || inst.centro || '').toLowerCase();
        const tags = (inst.tags || []).map(t => t.toLowerCase());

        const query = searchTerm.toLowerCase();
        const matchesSearch = 
          name.includes(query) ||
          mod.includes(query) ||
          center.includes(query) ||
          tags.some(t => t.includes(query));

        if (!matchesSearch) return false;

        if (selectedCategory === 'ALL') return true;
        if (selectedCategory === 'ADSO') return mod.includes('adso') || tags.includes('adso');
        if (selectedCategory === 'Frontend') return mod.includes('frontend') || tags.includes('frontend');
        if (selectedCategory === 'Bases de Datos') return mod.includes('bases de datos') || tags.includes('sql');
        if (selectedCategory === 'Ciberseguridad') return mod.includes('seguridad') || tags.includes('aws');
        if (selectedCategory === 'IA') return mod.includes('inteligencia') || tags.includes('python');

        return true;
      })
      .sort((a, b) => {
        const aRating = Number(a.rating !== undefined ? a.rating : (a.promedioGeneral || 0));
        const bRating = Number(b.rating !== undefined ? b.rating : (b.promedioGeneral || 0));
        const aCount = a.ratingsCount || a.totalEvaluaciones || 0;
        const bCount = b.ratingsCount || b.totalEvaluaciones || 0;
        const aName = a.name || a.nombre || '';
        const bName = b.name || b.nombre || '';

        if (sortBy === 'rating-desc') return bRating - aRating;
        if (sortBy === 'rating-asc') return aRating - bRating;
        if (sortBy === 'evals-desc') return bCount - aCount;
        if (sortBy === 'name') return aName.localeCompare(bName);
        return 0;
      });
  }, [instructors, searchTerm, selectedCategory, sortBy]);

  // Manejo de Inicio y Cierre de Sesión
  const handleLogin = (user) => {
    setCurrentUser(user);
    setToast({
      title: '¡Sesión Iniciada con Éxito!',
      message: `Bienvenido(a) al portal SENA como ${user.name || user.nombre} (${(user.role || user.rol || '').toUpperCase()}).`
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToast({
      title: 'Sesión Finalizada',
      message: 'Has salido de forma segura de la plataforma.'
    });
  };

  // Abrir modal de evaluación
  const handleOpenEvaluate = (instructor = null) => {
    setEvalTargetInstructor(instructor);
    setIsEvalModalOpen(true);
  };

  // Abrir modal de detalle
  const handleOpenDetails = (instructor) => {
    setDetailInstructor(instructor);
    setIsDetailModalOpen(true);
  };

  // Instructor en detalle sincronizado en tiempo real
  const activeDetailInstructor = useMemo(() => {
    if (!detailInstructor) return null;
    const targetKey = String(detailInstructor.id || detailInstructor._id);
    return (
      instructors.find((i) => String(i.id || i._id) === targetKey) || detailInstructor
    );
  }, [instructors, detailInstructor]);

  // Sincronización en tiempo real del Estado Operativo del Instructor
  const handleUpdateInstructorStatus = (instructorId, newStatus) => {
    const targetIdStr = String(instructorId);

    setInstructors((prev) =>
      prev.map((inst) => {
        if (String(inst.id || inst._id) === targetIdStr) {
          return {
            ...inst,
            operationalStatus: newStatus,
            estado: newStatus
          };
        }
        return inst;
      })
    );

    // Actualizar también al usuario actual si es ese instructor
    setCurrentUser((prev) => {
      if (prev && String(prev.id || prev._id) === targetIdStr) {
        return {
          ...prev,
          operationalStatus: newStatus,
          estado: newStatus
        };
      }
      return prev;
    });

    setToast({
      title: '¡Estado Sincronizado en Vivo!',
      message: `El estado se actualizó a "${newStatus}" y ahora es visible en tiempo real para Coordinación.`
    });
  };

  // Envío y recálculo instantáneo de la evaluación del aprendiz
  const handleSubmitEvaluation = ({ instructorId, methodology, technicalDomain, comment, date }) => {
    const targetIdStr = String(instructorId);
    const numMethodology = Number(methodology);
    const numTechnical = Number(technicalDomain);

    setInstructors((prev) => {
      return prev.map((inst) => {
        // Comparación segura como strings
        if (String(inst.id || inst._id) === targetIdStr) {
          const prevCount = Number(inst.ratingsCount !== undefined ? inst.ratingsCount : (inst.totalEvaluaciones || 0));
          const newRatingsCount = prevCount + 1;

          const prevMethodology = Number(inst.methodology !== undefined ? inst.methodology : (inst.promedioMetodologia || 5.0));
          const prevTechnical = Number(inst.technicalDomain !== undefined ? inst.technicalDomain : (inst.promedioTecnico || 5.0));

          const newMethodology = Number(
            ((prevMethodology * prevCount + numMethodology) / newRatingsCount).toFixed(2)
          );
          const newTechnicalDomain = Number(
            ((prevTechnical * prevCount + numTechnical) / newRatingsCount).toFixed(2)
          );
          const overallNewScore = Number(
            ((newMethodology + newTechnicalDomain) / 2).toFixed(2)
          );

          const newEvalObj = {
            id: `eval-${Date.now()}`,
            date,
            methodology: numMethodology,
            technicalDomain: numTechnical,
            rating: Number(((numMethodology + numTechnical) / 2).toFixed(1)),
            comment
          };

          const updatedInst = {
            ...inst,
            rating: overallNewScore,
            promedioGeneral: overallNewScore,
            ratingsCount: newRatingsCount,
            totalEvaluaciones: newRatingsCount,
            methodology: newMethodology,
            promedioMetodologia: newMethodology,
            technicalDomain: newTechnicalDomain,
            promedioTecnico: newTechnicalDomain,
            evaluations: [newEvalObj, ...(inst.evaluations || [])]
          };

          return updatedInst;
        }
        return inst;
      });
    });

    // Si el usuario actualmente en sesión es ese instructor, actualizar su vista
    setCurrentUser((prev) => {
      if (prev && String(prev.id || prev._id) === targetIdStr) {
        return {
          ...prev,
          ratingsCount: (prev.ratingsCount || 0) + 1
        };
      }
      return prev;
    });

    const target = instructors.find(i => String(i.id || i._id) === targetIdStr);
    setToast({
      title: '¡Calificación Recalculada en Vivo!',
      message: `Se ha registrado tu evaluación para ${target ? (target.name || target.nombre) : 'el instructor'}. Promedio actualizado.`
    });
  };

  // Si no está autenticado, renderizar Login
  if (!currentUser) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <NotificationToast notification={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const currentRole = currentUser.role || currentUser.rol;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#39A900] selection:text-white">
      
      {/* Header Institucional */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={aprendizActiveTab}
        setActiveTab={setAprendizActiveTab}
        onOpenEvaluate={() => handleOpenEvaluate()}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ROL 1: INSTRUCTOR */}
        {currentRole === 'instructor' && (
          <InstructorDashboard
            user={currentUser}
            instructors={instructors}
            onUpdateStatus={handleUpdateInstructorStatus}
          />
        )}

        {/* ROL 2: COORDINADOR */}
        {currentRole === 'coordinator' && (
          <CoordinatorDashboard
            user={currentUser}
            instructors={instructors}
            onSelectInstructor={handleOpenDetails}
            onEvaluateInstructor={handleOpenEvaluate}
          />
        )}

        {/* ROL 3: APRENDIZ / VISTA PÚBLICA */}
        {currentRole === 'aprendiz' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Selector de Vistas de Aprendiz */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAprendizActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    aprendizActiveTab === 'dashboard'
                      ? 'bg-[#39A900] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Directorio de Instructores</span>
                </button>
                <button
                  onClick={() => setAprendizActiveTab('metrics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    aprendizActiveTab === 'metrics'
                      ? 'bg-[#39A900] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Métricas de Competencias</span>
                </button>
              </div>

              <button
                onClick={() => handleOpenEvaluate()}
                className="bg-[#39A900] hover:bg-[#329200] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva Evaluación</span>
              </button>
            </div>

            {aprendizActiveTab === 'dashboard' ? (
              <div className="space-y-6">
                
                {/* Buscador y Filtros */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por instructor, módulo (ADSO, SQL, React...) o sede..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 shrink-0">Ordenar:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                      >
                        <option value="rating-desc">Mayor Calificación</option>
                        <option value="rating-asc">Menor Calificación</option>
                        <option value="evals-desc">Más Evaluados</option>
                        <option value="name">Nombre (A - Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Chips de Categorías */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-[#39A900] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Instructores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInstructors.map((instructor) => (
                    <InstructorCard
                      key={instructor.id || instructor._id}
                      instructor={instructor}
                      onEvaluate={handleOpenEvaluate}
                      onSelect={handleOpenDetails}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <MetricsPanel
                instructors={instructors}
                onEvaluateInstructor={handleOpenEvaluate}
              />
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="text-xs font-bold text-[#00324D] uppercase tracking-wider">
                Servicio Nacional de Aprendizaje - SENA
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Dirección General • Sistema de Calidad y Evaluación Formativa
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Protocolo de Anonimato Activo
              </span>
              <span>Términos y Condiciones</span>
              <span>Ayuda Aprendiz</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            © 2026 Prototipo Funcional de Evaluación Docente y Gestión SENA | Desarrollado con React & Tailwind CSS
          </div>
        </div>
      </footer>

      {/* Modal de Evaluación */}
      <EvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        instructors={instructors}
        selectedInstructor={evalTargetInstructor}
        onSubmitEvaluation={handleSubmitEvaluation}
      />

      {/* Modal de Detalle / Reseñas (Sincronizado en Vivo) */}
      <InstructorDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        instructor={activeDetailInstructor}
        onEvaluate={handleOpenEvaluate}
      />

      {/* Toast Notification */}
      <NotificationToast
        notification={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
