import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../services/authService';

export default function PasswordRecoveryView({ mode, token, onBack, onResetComplete }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitRequest = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const message = await requestPasswordReset(email);
      setSuccess(message);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 12) {
      setError('La nueva contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const message = await resetPassword({ token, password });
      setSuccess(message);
      onResetComplete();
    } catch (resetError) {
      setError(resetError.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const isReset = mode === 'reset';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#00324D] text-white px-4 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#39A900]" />
          Sistema de gestión y evaluación de instructores
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#00324D]">
          Recuperación de acceso
        </h1>
      </div>

      <section className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="rounded-xl bg-[#39A900]/10 p-3 text-[#39A900]">
            {isReset ? <KeyRound className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#00324D]">
              {isReset ? 'Crea una nueva contraseña' : '¿Olvidaste tu contraseña?'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isReset
                ? 'Usa al menos 12 caracteres. Este enlace es de un solo uso y vence en 30 minutos.'
                : 'Ingresa el correo de tu cuenta. Si está registrado, recibirás instrucciones para recuperar el acceso.'}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {success}
          </p>
        )}

        {isReset ? (
          <form onSubmit={submitReset} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#39A900]"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Confirmar contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#39A900]"
              />
            </label>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-xl bg-[#39A900] px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitRequest} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Correo de tu cuenta
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@correo.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#39A900]"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#39A900] px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Enviando solicitud...' : 'Enviar instrucciones'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#00324D] hover:text-[#39A900]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </button>
      </section>

      <p className="max-w-xl mx-auto mt-6 text-center text-xs text-slate-400">
        Si no solicitaste el cambio, ignora el mensaje de recuperación. Nunca compartas el enlace con otras personas.
      </p>
    </div>
  );
}
