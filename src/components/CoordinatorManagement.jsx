import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import {
  createFichaNotice,
  deactivateRecord,
  listFichas,
  listUsers,
  saveFicha as saveFichaRequest,
  saveUser as saveUserRequest,
} from '../services/managementService';
import TestDataImport from './TestDataImport';
const EMPTY_USER = {
  nombre: '',
  email: '',
  rol: 'instructor',
  password: '',
  especialidad: '',
  centro: '',
};
const EMPTY_FICHA = {
  codigo: '',
  programa: '',
  periodo: '',
  fechaInicio: '',
  fechaFin: '',
  instructor: '',
  ambiente: '',
  dias: '',
  horaInicio: '07:00',
  horaFin: '13:00',
  sesiones: [],
  aprendices: [],
};
const EMPTY_SESSION = {
  dia: 'Lunes',
  horaInicio: '07:00',
  horaFin: '09:00',
  instructor: '',
  tema: '',
  ambiente: '',
};

export default function CoordinatorManagement({ onDataChanged, onUserUpdated }) {
  const [users, setUsers] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [fichaForm, setFichaForm] = useState(EMPTY_FICHA);
  const [editingUserId, setEditingUserId] = useState('');
  const [editingFichaId, setEditingFichaId] = useState('');
  const [noticeFichaId, setNoticeFichaId] = useState('');
  const [noticeForm, setNoticeForm] = useState({
    tipo: 'general',
    mensaje: '',
    fechaClase: '',
  });
  const [section, setSection] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userRows, fichaRows] = await Promise.all([listUsers(), listFichas()]);
      setUsers(userRows);
      setFichas(fichaRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetMessage = () => {
    setError('');
    setSuccess('');
  };

  const saveUser = async (event) => {
    event.preventDefault();
    resetMessage();
    try {
      const body = { ...userForm };
      if (editingUserId && !body.password) delete body.password;
      if (body.documento) {
        body.tipoDocumento = body.tipoDocumento || 'CC';
      } else {
        delete body.documento;
        delete body.tipoDocumento;
      }
      await saveUserRequest(editingUserId, body);
      setSuccess(editingUserId ? 'Usuario actualizado.' : 'Usuario creado.');
      setUserForm(EMPTY_USER);
      setEditingUserId('');
      await loadData();
      await onDataChanged?.();
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return null;
    }
  };

  const saveFicha = async (event) => {
    event.preventDefault();
    resetMessage();
    try {
      const body = {
        ...fichaForm,
        dias: fichaForm.dias.split(',').map((day) => day.trim()).filter(Boolean),
        sesiones: fichaForm.sesiones.map((session) => ({
          ...session,
          instructor: session.instructor?._id || session.instructor,
        })),
      };
      if (!body.fechaInicio) delete body.fechaInicio;
      if (!body.fechaFin) delete body.fechaFin;
      await saveFichaRequest(editingFichaId, body);
      setSuccess(editingFichaId ? 'Ficha actualizada.' : 'Ficha creada.');
      setFichaForm(EMPTY_FICHA);
      setEditingFichaId('');
      await loadData();
      await onDataChanged?.();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const editUser = (user) => {
    resetMessage();
    setSection('users');
    setEditingUserId(user._id);
    setUserForm({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      password: '',
      especialidad: user.especialidad || '',
      centro: user.centro || '',
      tipoDocumento: user.tipoDocumento || '',
      documento: user.documento || '',
    });
  };

  const editFicha = (ficha) => {
    resetMessage();
    setSection('fichas');
    setEditingFichaId(ficha._id);
    setFichaForm({
      codigo: ficha.codigo,
      programa: ficha.programa,
      periodo: ficha.periodo,
      fechaInicio: ficha.fechaInicio ? new Date(ficha.fechaInicio).toISOString().slice(0, 10) : '',
      fechaFin: ficha.fechaFin ? new Date(ficha.fechaFin).toISOString().slice(0, 10) : '',
      instructor: ficha.instructor?._id || ficha.instructor || '',
      ambiente: ficha.ambiente || '',
      dias: (ficha.dias || []).join(', '),
      horaInicio: ficha.horaInicio,
      horaFin: ficha.horaFin,
      sesiones: (ficha.sesiones || []).map((session) => ({
        ...session,
        instructor: session.instructor?._id || session.instructor || '',
      })),
      aprendices: (ficha.aprendices || []).map((learner) => learner._id || learner),
    });
  };

  const deactivate = async (path, label) => {
    if (!window.confirm(`¿Deseas desactivar ${label}? El registro histórico se conservará.`)) return;
    resetMessage();
    try {
      await deactivateRecord(path);
      setSuccess(`${label} desactivado.`);
      await loadData();
      await onDataChanged?.();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const saveNotice = async (event) => {
    event.preventDefault();
    resetMessage();
    try {
      await createFichaNotice(noticeFichaId, noticeForm);
      setSuccess('Novedad publicada para los aprendices inscritos.');
      setNoticeFichaId('');
      setNoticeForm({ tipo: 'general', mensaje: '', fechaClase: '' });
      await loadData();
      await onDataChanged?.();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#39A900] focus:outline-none focus:ring-2 focus:ring-[#39A900]/20';
  const buttonClass = 'inline-flex items-center gap-2 rounded-lg bg-[#00324D] px-4 py-2 text-sm font-bold text-white hover:bg-[#064868]';

  const handleTestImport = async (coordinator) => {
    setSuccess('Datos de prueba importados. Guarda las claves generadas.');
    await loadData();
    await onDataChanged?.();
    onUserUpdated?.({
      ...coordinator,
      name: coordinator.nombre,
      role: 'coordinator',
    });
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#00324D]">Gestión académica</h2>
          <p className="mt-1 text-sm text-slate-500">Administra cuentas, fichas, horarios e inscripciones.</p>
        </div>
        <button type="button" className={buttonClass} onClick={loadData} disabled={loading}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {['users', 'fichas', 'test-import'].map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => { setSection(tab); resetMessage(); }}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${section === tab ? 'bg-[#39A900] text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {tab === 'users'
              ? 'Instructores y aprendices'
              : tab === 'fichas' ? 'Fichas y horarios' : 'Importación de prueba'}
          </button>
        ))}
      </div>

      {section === 'users' ? (
        <>
          <form onSubmit={saveUser} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">Nombre
              <input className={inputClass} required maxLength={100} value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Correo
              <input className={inputClass} required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </label>
            {!editingUserId && (
              <label className="text-xs font-bold text-slate-700">Contraseña inicial (12+ caracteres)
                <input className={inputClass} required minLength={12} type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              </label>
            )}
            <label className="text-xs font-bold text-slate-700">Perfil
              <select className={inputClass} value={userForm.rol} onChange={(e) => setUserForm({ ...userForm, rol: e.target.value, tipoDocumento: e.target.value === 'aprendiz' ? (userForm.tipoDocumento || 'CC') : '', documento: e.target.value === 'aprendiz' ? userForm.documento : '' })} disabled={Boolean(editingUserId)}>
                <option value="instructor">Instructor</option>
                <option value="aprendiz">Aprendiz</option>
              </select>
            </label>
            {userForm.rol === 'aprendiz' && (
              <>
                <label className="text-xs font-bold text-slate-700">Tipo de documento
                  <select className={inputClass} value={userForm.tipoDocumento || 'CC'} onChange={(e) => setUserForm({ ...userForm, tipoDocumento: e.target.value })}>
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="TI">Tarjeta de identidad</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700">Número de documento
                  <input className={inputClass} inputMode="numeric" pattern="[0-9]{6,15}" value={userForm.documento || ''} onChange={(e) => setUserForm({ ...userForm, documento: e.target.value })} />
                </label>
              </>
            )}
            {userForm.rol === 'instructor' && (
              <>
                <label className="text-xs font-bold text-slate-700">Especialidad
                  <input className={inputClass} value={userForm.especialidad} onChange={(e) => setUserForm({ ...userForm, especialidad: e.target.value })} />
                </label>
                <label className="text-xs font-bold text-slate-700">Centro
                  <input className={inputClass} value={userForm.centro} onChange={(e) => setUserForm({ ...userForm, centro: e.target.value })} />
                </label>
              </>
            )}
            <div className="flex items-end gap-2">
              <button type="submit" className={buttonClass}>
                <Plus className="h-4 w-4" /> {editingUserId ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
              {editingUserId && (
                <button type="button" aria-label="Cancelar edición" className="rounded-lg border p-2" onClick={() => { setEditingUserId(''); setUserForm(EMPTY_USER); }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Nombre</th><th className="p-3">Documento</th><th className="p-3">Correo</th><th className="p-3">Rol</th><th className="p-3">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="p-3 font-semibold">{user.nombre}</td>
                    <td className="p-3">{user.documento ? `${user.tipoDocumento} ${user.documento}` : '—'}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 capitalize">{user.rol}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button type="button" aria-label={`Editar ${user.nombre}`} onClick={() => editUser(user)} className="rounded-md border p-2 text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                        <button type="button" aria-label={`Desactivar ${user.nombre}`} onClick={() => deactivate(`/management/users/${user._id}`, user.nombre)} className="rounded-md border p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && <tr><td className="p-4 text-slate-500" colSpan="5">No hay cuentas registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : section === 'fichas' ? (
        <>
          <form onSubmit={saveFicha} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">Código de ficha
              <input className={inputClass} required maxLength={30} value={fichaForm.codigo} onChange={(e) => setFichaForm({ ...fichaForm, codigo: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Programa
              <input className={inputClass} required value={fichaForm.programa} onChange={(e) => setFichaForm({ ...fichaForm, programa: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Periodo de formación
              <input className={inputClass} required maxLength={30} placeholder="2026-2" value={fichaForm.periodo} onChange={(e) => setFichaForm({ ...fichaForm, periodo: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Fecha de inicio
              <input className={inputClass} type="date" value={fichaForm.fechaInicio} onChange={(e) => setFichaForm({ ...fichaForm, fechaInicio: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Fecha de finalización
              <input className={inputClass} type="date" value={fichaForm.fechaFin} onChange={(e) => setFichaForm({ ...fichaForm, fechaFin: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Instructor
              <select className={inputClass} required value={fichaForm.instructor} onChange={(e) => setFichaForm({ ...fichaForm, instructor: e.target.value })}>
                <option value="">Selecciona un instructor</option>
                {users.filter((user) => user.rol === 'instructor').map((user) => <option key={user._id} value={user._id}>{user.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Ambiente
              <input className={inputClass} value={fichaForm.ambiente} onChange={(e) => setFichaForm({ ...fichaForm, ambiente: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Días (separados por coma)
              <input className={inputClass} placeholder="Lunes, Miércoles, Viernes" value={fichaForm.dias} onChange={(e) => setFichaForm({ ...fichaForm, dias: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Aprendices inscritos
              <select
                multiple
                className={`${inputClass} min-h-24`}
                value={fichaForm.aprendices}
                onChange={(e) => setFichaForm({ ...fichaForm, aprendices: Array.from(e.target.selectedOptions, (option) => option.value) })}
              >
                {users.filter((user) => user.rol === 'aprendiz').map((user) => <option key={user._id} value={user._id}>{user.nombre} ({user.email})</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Hora inicio
              <input className={inputClass} required type="time" value={fichaForm.horaInicio} onChange={(e) => setFichaForm({ ...fichaForm, horaInicio: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-slate-700">Hora fin
              <input className={inputClass} required type="time" value={fichaForm.horaFin} onChange={(e) => setFichaForm({ ...fichaForm, horaFin: e.target.value })} />
            </label>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#00324D]">Bloques semanales por instructor</h3>
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold" onClick={() => setFichaForm({ ...fichaForm, sesiones: [...fichaForm.sesiones, { ...EMPTY_SESSION }] })}>
                  Agregar bloque
                </button>
              </div>
              {fichaForm.sesiones.map((session, index) => (
                <div key={`${index}-${session.dia}`} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-bold text-slate-700">Día
                    <select className={inputClass} value={session.dia} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, dia: e.target.value } : row) })}>
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">Instructor
                    <select className={inputClass} required value={session.instructor?._id || session.instructor || ''} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, instructor: e.target.value } : row) })}>
                      <option value="">Selecciona un instructor</option>
                      {users.filter((user) => user.rol === 'instructor').map((user) => <option key={user._id} value={user._id}>{user.nombre}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">Hora inicio
                    <input className={inputClass} required type="time" value={session.horaInicio} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, horaInicio: e.target.value } : row) })} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Hora fin
                    <input className={inputClass} required type="time" value={session.horaFin} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, horaFin: e.target.value } : row) })} />
                  </label>
                  <label className="text-xs font-bold text-slate-700 lg:col-span-2">Tema
                    <input className={inputClass} maxLength={500} value={session.tema || ''} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, tema: e.target.value } : row) })} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Ambiente
                    <input className={inputClass} maxLength={120} value={session.ambiente || ''} onChange={(e) => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.map((row, rowIndex) => rowIndex === index ? { ...row, ambiente: e.target.value } : row) })} />
                  </label>
                  <button type="button" className="self-end rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700" onClick={() => setFichaForm({ ...fichaForm, sesiones: fichaForm.sesiones.filter((_, rowIndex) => rowIndex !== index) })}>Quitar bloque</button>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className={buttonClass}><Plus className="h-4 w-4" /> {editingFichaId ? 'Guardar cambios' : 'Crear ficha'}</button>
              {editingFichaId && <button type="button" aria-label="Cancelar edición" className="rounded-lg border p-2" onClick={() => { setEditingFichaId(''); setFichaForm(EMPTY_FICHA); }}><X className="h-4 w-4" /></button>}
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {fichas.map((ficha) => (
              <article key={ficha._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#00324D]">Ficha {ficha.codigo} · {ficha.programa} · {ficha.periodo}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {ficha.sesiones?.length
                        ? `${ficha.sesiones.length} bloques horarios · ${[...new Set(ficha.sesiones.map((session) => session.instructor?.nombre).filter(Boolean))].join(', ')}`
                        : `${ficha.instructor?.nombre} · ${ficha.dias?.join(', ')} · ${ficha.horaInicio}–${ficha.horaFin}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{ficha.aprendices?.length || 0} aprendices inscritos · {ficha.ambiente || 'Ambiente pendiente'}</p>
                  </div>
                  <div className="flex h-fit gap-2">
                    <button type="button" aria-label={`Editar ficha ${ficha.codigo}`} onClick={() => editFicha(ficha)} className="rounded-md border p-2 text-slate-700"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label={`Desactivar ficha ${ficha.codigo}`} onClick={() => deactivate(`/management/fichas/${ficha._id}`, `la ficha ${ficha.codigo}`)} className="rounded-md border p-2 text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {noticeFichaId === ficha._id ? (
                  <form onSubmit={saveNotice} className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-700">Tipo de novedad
                      <select className={inputClass} value={noticeForm.tipo} onChange={(e) => setNoticeForm({ ...noticeForm, tipo: e.target.value })}>
                        <option value="general">Aviso general</option>
                        <option value="cancelacion">Cancelación</option>
                        <option value="cambio_horario">Cambio de horario</option>
                        <option value="cambio_ambiente">Cambio de ambiente</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-700">Fecha y hora de la clase
                      <input className={inputClass} required type="datetime-local" value={noticeForm.fechaClase} onChange={(e) => setNoticeForm({ ...noticeForm, fechaClase: e.target.value })} />
                    </label>
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Mensaje para aprendices
                      <textarea className={inputClass} required maxLength={500} rows={2} value={noticeForm.mensaje} onChange={(e) => setNoticeForm({ ...noticeForm, mensaje: e.target.value })} />
                    </label>
                    <div className="flex gap-2">
                      <button type="submit" className={buttonClass}>Publicar aviso</button>
                      <button type="button" className="rounded-lg border px-3 text-sm" onClick={() => setNoticeFichaId('')}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="mt-4 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50"
                    onClick={() => { setNoticeFichaId(ficha._id); resetMessage(); }}
                  >
                    Reportar novedad o cancelación
                  </button>
                )}
              </article>
            ))}
            {!loading && fichas.length === 0 && <p className="text-sm text-slate-500">No hay fichas registradas.</p>}
          </div>
        </>
      ) : (
        <TestDataImport onImported={handleTestImport} />
      )}
    </section>
  );
}
