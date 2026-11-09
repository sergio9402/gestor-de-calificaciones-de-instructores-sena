import React, { useEffect, useState } from 'react';
import { login } from '../services/authService';
import PasswordRecoveryView from './PasswordRecoveryView';
import { 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Lock, 
  Mail, 
  ArrowRight, 
  Users, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [recoveryToken] = useState(() => (
    new URLSearchParams(window.location.hash.slice(1)).get('resetToken') || ''
  ));
  const [recoveryMode, setRecoveryMode] = useState(() => (
    new URLSearchParams(window.location.hash.slice(1)).has('resetToken') ? 'reset' : ''
  ));
  const [activeRoleTab, setActiveRoleTab] = useState('instructor'); // 'instructor' | 'coordinator' | 'aprendiz'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recoveryToken) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, [recoveryToken]);

  const clearRecoveryHash = () => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  if (recoveryMode) {
    return (
      <PasswordRecoveryView
        mode={recoveryMode}
        token={recoveryToken}
        onBack={() => {
          clearRecoveryHash();
          setRecoveryMode('');
        }}
        onResetComplete={clearRecoveryHash}
      />
    );
  }

  const handleTabChange = (role) => {
    setActiveRoleTab(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor diligencia tanto el correo como la contraseña institucional.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email: cleanEmail,
        password: cleanPassword,
        role: activeRoleTab,
      });
      onLogin(user);
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
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
                    Panel de control gerencial para consultar estados operativos registrados, fichas y métricas de desempeño.
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
            
            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all font-medium"
                  placeholder="usuario@sena.edu.co"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña Institucional
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setRecoveryMode('request');
                  }}
                  className="text-xs font-semibold text-[#277800] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#39A900] hover:bg-[#319200] disabled:opacity-50 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar como {activeRoleTab === 'instructor' ? 'Instructor' : activeRoleTab === 'coordinator' ? 'Coordinador' : 'Aprendiz'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#39A900]" />
          <span>Acceso autenticado con validación estricta de credenciales y JWT.</span>
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-xl mx-auto w-full text-center text-xs text-slate-400 mt-6">
        © 2026 Servicio Nacional de Aprendizaje SENA | Todos los derechos reservados
      </div>
    </div>
  );
}
