import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  PlusCircle, 
  BarChart2, 
  Users, 
  Search, 
  GraduationCap, 
  LogOut, 
  Briefcase, 
  UserCheck, 
  BookOpen 
} from 'lucide-react';

export default function Header({ 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  onOpenEvaluate 
}) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'instructor':
        return (
          <span className="bg-[#39A900]/15 text-[#39A900] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#39A900]/30 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Instructor
          </span>
        );
      case 'coordinator':
        return (
          <span className="bg-[#00324D] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Coordinación Académica
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" /> Aprendiz SENA
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      
      {/* Top Institutional Ribbon */}
      <div className="bg-[#00324D] text-white px-4 py-1.5 text-xs font-medium flex justify-between items-center tracking-wide">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#39A900] animate-pulse"></span>
          <span>SENA • Servicio Nacional de Aprendizaje | Sistema de Gestión y Desempeño</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-slate-300">
          <span>{currentUser?.center || 'Regional Distrito Capital & Sedes Nacionales'}</span>
          <span className="text-slate-400">|</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Sesión Autenticada y Protegida
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#39A900] to-[#2b7e02] text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#00324D]">
                  SENA <span className="text-[#39A900]">EVAL</span>
                </span>
                {currentUser && getRoleBadge(currentUser.role)}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser?.role === 'instructor'
                  ? 'Panel Docente de Fichas y Autogestión'
                  : currentUser?.role === 'coordinator'
                  ? 'Panel Gerencial de Supervisión y Calidad'
                  : 'Evaluación Continua y Desempeño de Instructores'}
              </p>
            </div>
          </div>

          {/* User Profile Info & Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* User Profile Pill */}
            {currentUser && (
              <div className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#39A900]/15 text-[#39A900] font-black text-sm flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[160px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Action for Apprentice Role: Calificar */}
            {currentUser?.role === 'aprendiz' && (
              <button
                onClick={() => onOpenEvaluate()}
                className="hidden sm:flex items-center gap-2 bg-[#39A900] hover:bg-[#329400] text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Calificar Instructor</span>
              </button>
            )}

            {/* Functional Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all shadow-2xs"
              title="Cerrar sesión y volver al login"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
