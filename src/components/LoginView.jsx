import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, UserCheck, Briefcase, Lock, Mail, ArrowRight, CheckCircle2, Users, Building, Sparkles } from 'lucide-react';
import { mockUsers } from '../data/mockFichas';

export default function LoginView({ onLogin }) {
  const [activeRoleTab, setActiveRoleTab] = useState('instructor'); // 'instructor' | 'coordinator' | 'aprendiz'
  const [email, setEmail] = useState('carlos.mendoza@sena.edu.co');
  const [password, setPassword] = useState('sena2026');
  const [error, setError] = useState('');

  // Handle role tab change and fill demo credentials
  const handleTabChange = (role) => {
    setActiveRoleTab(role);
    setError('');
    if (role === 'instructor') {
      setEmail('carlos.mendoza@sena.edu.co');
      setPassword('sena2026');
    } else if (role === 'coordinator') {
      setEmail('sofia.restrepo@sena.edu.co');
      setPassword('admin2026');
    } else {
      setEmail('aprendiz.adso@misena.edu.co');
      setPassword('adso2026');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor diligencia tus credenciales institucionales.');
      return;
    }

    if (activeRoleTab === 'instructor') {
      onLogin(mockUsers.instructor);
    } else if (activeRoleTab === 'coordinator') {
      onLogin(mockUsers.coordinator);
    } else {
      onLogin(mockUsers.aprendiz);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'instructor') onLogin(mockUsers.instructor);
    else if (role === 'coordinator') onLogin(mockUsers.coordinator);
    else onLogin(mockUsers.aprendiz);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#39A900] selection:text-white">
      
      {/* Top Brand Bar */}
      <div className="max-w-4xl mx-auto w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#00324D] text-white px-4 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#39A900] animate-pulse"></span>
          Servicio Nacional de Aprendizaje - SENA • Portal de Autenticación
        </div>
        <div className="flex justify-center items-center gap-3">
          <div className="bg-gradient-to-br from-[#39A900] to-[#277800] text-white p-3 rounded-2xl shadow-md">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-[#00324D] tracking-tight">
              SENA <span className="text-[#39A900]">EVAL & GESTIÓN</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Plataforma de Evaluación Docente y Seguimiento Operativo
            </p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 p-1.5 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('instructor')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'instructor'
                ? 'bg-white text-[#00324D] shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeRoleTab === 'instructor' ? 'text-[#39A900]' : 'text-slate-400'}`} />
            <span>Soy Instructor</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('coordinator')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'coordinator'
                ? 'bg-white text-[#00324D] shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeRoleTab === 'coordinator' ? 'text-[#39A900]' : 'text-slate-400'}`} />
            <span>Soy Coordinador</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('aprendiz')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              activeRoleTab === 'aprendiz'
                ? 'bg-white text-[#00324D] shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-4 h-4 ${activeRoleTab === 'aprendiz' ? 'text-[#39A900]' : 'text-slate-400'}`} />
            <span>Soy Aprendiz</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8">
          
          {/* Active Role Description Banner */}
          <div className="mb-6 p-4 rounded-2xl border flex items-start gap-3.5 bg-slate-50/80 border-slate-200">
            {activeRoleTab === 'instructor' && (
              <>
                <div className="p-2.5 bg-[#39A900]/15 rounded-xl text-[#39A900] shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#00324D]">Acceso Docente - Instructor SENA</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Visualiza tus fichas asignadas, horarios de formación, ambientes presenciales y la retroalimentación anónima de tus aprendices.
                  </p>
                </div>
              </>
            )}

            {activeRoleTab === 'coordinator' && (
              <>
                <div className="p-2.5 bg-[#00324D]/10 rounded-xl text-[#00324D] shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#00324D]">Acceso Directivo - Coordinación Académica</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Panel de control gerencial para auditar estados operativos en vivo (en clase, disponible, asesoría), cumplimiento de evaluaciones y métricas de desempeño.
                  </p>
                </div>
              </>
            )}

            {activeRoleTab === 'aprendiz' && (
              <>
                <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#00324D]">Acceso de Aprendiz - Evaluación Anónima</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Directorio público para calificar con 1 a 5 estrellas la metodología y dominio técnico de tus instructores de forma anónima.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Institucional (@sena.edu.co o @misena)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all font-medium"
                  placeholder="usuario@sena.edu.co"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña Institucional
                </label>
                <span className="text-[11px] text-[#39A900] font-semibold cursor-pointer hover:underline">
                  ¿Olvidaste tu clave?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#39A900] hover:bg-[#319200] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              <span>Ingresar como {activeRoleTab === 'instructor' ? 'Instructor' : activeRoleTab === 'coordinator' ? 'Coordinador' : 'Aprendiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Shortcut Cards for Demo Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
              ⚡ Acceso Rápido de Prueba (1 Clic)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('instructor')}
                className="p-3 bg-slate-50 hover:bg-[#39A900]/10 border border-slate-200 hover:border-[#39A900]/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#39A900]">
                    Ing. Carlos Mendoza
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Instructor ADSO • Fichas & Clases
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('coordinator')}
                className="p-3 bg-slate-50 hover:bg-[#00324D]/10 border border-slate-200 hover:border-[#00324D]/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00324D]"></span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#00324D]">
                    Dra. Sofía Restrepo
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Coordinación • Estado Operativo
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#39A900]" />
          <span>Acceso cifrado y autenticado bajo políticas SENA de Colombia.</span>
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-xl mx-auto w-full text-center text-xs text-slate-400 mt-6">
        © 2026 Servicio Nacional de Aprendizaje SENA | Todos los derechos reservados
      </div>
    </div>
  );
}

