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
  // Authentication State (default to instructor or login screen)
  const [currentUser, setCurrentUser] = useState(mockUsers.instructor);

  // Instructors dynamic state
  const [instructors, setInstructors] = useState(initialInstructors);
  
  // Navigation for Aprendiz view
  const [aprendizActiveTab, setAprendizActiveTab] = useState('dashboard'); // 'dashboard' | 'metrics'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating-desc');

  // Modals state
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalTargetInstructor, setEvalTargetInstructor] = useState(null);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailInstructor, setDetailInstructor] = useState(null);

  // Notification state
  const [toast, setToast] = useState(null);

  // Categories list for Aprendiz view
  const categories = [
    { id: 'ALL', label: 'Todos los Programas' },
    { id: 'ADSO', label: 'ADSO & Backend' },
    { id: 'Frontend', label: 'Frontend & UI/UX' },
    { id: 'Bases de Datos', label: 'Bases de Datos' },
    { id: 'Ciberseguridad', label: 'Ciberseguridad & Cloud' },
    { id: 'IA', label: 'IA & Analítica' },
  ];

  // Filter & Search Logic for Aprendiz view
  const filteredInstructors = useMemo(() => {
    return instructors
      .filter((inst) => {
        const matchesSearch = 
          inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.center.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (selectedCategory === 'ALL') return true;
        if (selectedCategory === 'ADSO') return inst.module.includes('ADSO') || inst.tags.includes('ADSO');
        if (selectedCategory === 'Frontend') return inst.module.includes('Frontend') || inst.tags.includes('Frontend');
        if (selectedCategory === 'Bases de Datos') return inst.module.includes('Bases de Datos') || inst.tags.includes('SQL');
        if (selectedCategory === 'Ciberseguridad') return inst.module.includes('Seguridad') || inst.tags.includes('AWS');
        if (selectedCategory === 'IA') return inst.module.includes('Inteligencia') || inst.tags.includes('Python');

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        if (sortBy === 'rating-asc') return a.rating - b.rating;
        if (sortBy === 'evals-desc') return b.ratingsCount - a.ratingsCount;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [instructors, searchTerm, selectedCategory, sortBy]);

  // Auth Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    setToast({
      title: '¡Sesión Iniciada con Éxito!',
      message: `Bienvenido(a) al portal SENA como ${user.name} (${user.role.toUpperCase()}).`
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToast({
      title: 'Sesión Finalizada',
      message: 'Has salido de forma segura de la plataforma.'
    });
  };

  // Handle open evaluation
  const handleOpenEvaluate = (instructor = null) => {
    setEvalTargetInstructor(instructor);
    setIsEvalModalOpen(true);
  };

  // Handle open details
  const handleOpenDetails = (instructor) => {
    setDetailInstructor(instructor);
    setIsDetailModalOpen(true);
  };

  // Submit anonymous evaluation & update live state
  const handleSubmitEvaluation = ({ instructorId, methodology, technicalDomain, comment, date }) => {
    setInstructors((prev) => {
      return prev.map((inst) => {
        if (inst.id === instructorId) {
          const newRatingsCount = inst.ratingsCount + 1;
          const newMethodology = Number(((inst.methodology * inst.ratingsCount + methodology) / newRatingsCount).toFixed(2));
          const newTechnicalDomain = Number(((inst.technicalDomain * inst.ratingsCount + technicalDomain) / newRatingsCount).toFixed(2));
          const overallNewScore = Number(((newMethodology + newTechnicalDomain) / 2).toFixed(2));

          const newEvalObj = {
            id: `eval-${Date.now()}`,
            date,
            methodology,
            technicalDomain,
            rating: Number(((methodology + technicalDomain) / 2).toFixed(1)),
            comment
          };

          return {
            ...inst,
            rating: overallNewScore,
            ratingsCount: newRatingsCount,
            methodology: newMethodology,
            technicalDomain: newTechnicalDomain,
            evaluations: [newEvalObj, ...(inst.evaluations || [])]
          };
        }
        return inst;
      });
    });

    const target = instructors.find(i => i.id === instructorId);
    setToast({
      title: '¡Evaluación Registrada con Éxito!',
      message: `Tu evaluación anónima para ${target ? target.name : 'el instructor'} ha sido agregada y calculada en el sistema.`
    });
  };

  // If user is not authenticated, render Login View
  if (!currentUser) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <NotificationToast notification={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#39A900] selection:text-white">
      
      {/* Dynamic Institutional Header based on Role */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={aprendizActiveTab}
        setActiveTab={setAprendizActiveTab}
        onOpenEvaluate={() => handleOpenEvaluate()}
      />

      {/* Main Container - Conditional Rendering per Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ROL 1: INSTRUCTOR */}
        {currentUser.role === 'instructor' && (
          <InstructorDashboard
            user={currentUser}
            instructors={instructors}
          />
        )}

        {/* ROL 2: COORDINADOR */}
        {currentUser.role === 'coordinator' && (
          <CoordinatorDashboard
            user={currentUser}
            instructors={instructors}
            onSelectInstructor={handleOpenDetails}
            onEvaluateInstructor={handleOpenEvaluate}
          />
        )}

        {/* ROL 3: APRENDIZ / VISTA PÚBLICA */}
        {currentUser.role === 'aprendiz' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* View Switcher for Apprentice */}
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
                
                {/* Search and Filters */}
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

                  {/* Category Filter Chips */}
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

                {/* Instructors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInstructors.map((instructor) => (
                    <InstructorCard
                      key={instructor.id}
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

      {/* Institutional Footer */}
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

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        instructors={instructors}
        selectedInstructor={evalTargetInstructor}
        onSubmitEvaluation={handleSubmitEvaluation}
      />

      {/* Instructor Detail / Reviews Modal */}
      <InstructorDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        instructor={detailInstructor}
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
