import React, { useState } from 'react';
import { AlertCircle, Download, FileUp, ShieldCheck } from 'lucide-react';
import { confirmTestImport, previewTestImport } from '../services/managementService';

function downloadCredentials(credentials) {
  const rows = [
    ['Nombre', 'Correo', 'Rol', 'Contraseña de prueba'],
    ...credentials.map(({ nombre, email, rol, password }) => [nombre, email, rol, password]),
  ];
  const csv = rows.map((row) =>
    row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')
  ).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'credenciales-pruebas.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function TestDataImport({ onImported }) {
  const [payload, setPayload] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectFile = async (event) => {
    const file = event.target.files?.[0];
    setPayload(null);
    setPreview(null);
    setCredentials([]);
    setError('');
    if (!file) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(await file.text());
      setPayload(parsed);
      setFileName(file.name);
      setPreview(await previewTestImport(parsed));
    } catch (loadError) {
      setError(loadError.message || 'El archivo no contiene un JSON válido.');
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!payload || !preview?.valid || !window.confirm('Se crearán las cuentas y la ficha en la base de datos de este entorno. ¿Deseas continuar?')) return;
    setLoading(true);
    setError('');
    try {
      const result = await confirmTestImport(payload);
      setCredentials(result.credentials);
      await onImported?.(result.coordinator);
      setPreview({ ...preview, completed: true });
    } catch (importError) {
      setError(importError.message || 'No se pudo completar la importación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" /> Importación exclusiva para pruebas</p>
        <p className="mt-1">Solo funciona fuera de producción y con <code>ENABLE_TEST_DATA_IMPORT=true</code>. Usa correos del dominio reservado <code>example.test</code>; nunca habilites esta función en producción.</p>
      </div>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-[#39A900]">
        <FileUp className="h-7 w-7 text-[#39A900]" />
        <span className="font-bold text-slate-800">Seleccionar archivo JSON de importación</span>
        <span className="text-xs text-slate-500">{fileName || 'El archivo se revisará antes de guardar cambios.'}</span>
        <input className="sr-only" type="file" accept=".json,application/json" onChange={selectFile} disabled={loading} />
      </label>

      {error && <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-600">Validando datos...</p>}

      {preview && (
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-[#00324D]">Vista previa de importación</h3>
          {preview.summary && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-slate-500">Coordinador</dt><dd className="font-semibold">{preview.summary.coordinatorName}</dd></div>
              <div><dt className="text-slate-500">Ficha</dt><dd className="font-semibold">{preview.summary.fichaCode} · {preview.summary.period}</dd></div>
              <div><dt className="text-slate-500">Vigencia</dt><dd className="font-semibold">{preview.summary.dateRange.join(' – ')}</dd></div>
              <div><dt className="text-slate-500">Instructores</dt><dd className="font-semibold">{preview.summary.instructors}</dd></div>
              <div><dt className="text-slate-500">Aprendices</dt><dd className="font-semibold">{preview.summary.learners}</dd></div>
              <div><dt className="text-slate-500">Bloques horarios</dt><dd className="font-semibold">{preview.summary.sessions}</dd></div>
            </dl>
          )}
          {preview.errors?.length > 0 && (
            <ul className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {preview.errors.map((message) => <li key={message}>{message}</li>)}
            </ul>
          )}
          {payload?.learners && (
            <details className="rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">Revisar aprendices ({payload.learners.length})</summary>
              <div className="mt-3 max-h-72 overflow-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600"><tr><th className="p-2">Nombre</th><th className="p-2">Documento</th><th className="p-2">Correo ficticio</th></tr></thead>
                  <tbody>{payload.learners.map((learner) => <tr key={`${learner.tipoDocumento}-${learner.documento}`} className="border-t border-slate-100"><td className="p-2">{learner.nombre}</td><td className="p-2">{learner.tipoDocumento} {learner.documento}</td><td className="p-2">{learner.email}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
          {payload?.instructors && (
            <details className="rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">Revisar instructores y bloques ({payload.ficha?.sesiones?.length || 0})</summary>
              <div className="mt-3 max-h-72 overflow-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600"><tr><th className="p-2">Día</th><th className="p-2">Hora</th><th className="p-2">Instructor</th><th className="p-2">Tema</th><th className="p-2">Ambiente</th></tr></thead>
                  <tbody>{(payload.ficha?.sesiones || []).map((session, index) => {
                    const instructor = payload.instructors.find((row) => row.email === session.instructorEmail);
                    return <tr key={`${session.dia}-${session.horaInicio}-${index}`} className="border-t border-slate-100"><td className="p-2">{session.dia}</td><td className="p-2 whitespace-nowrap">{session.horaInicio}–{session.horaFin}</td><td className="p-2">{instructor?.nombre || session.instructorEmail}</td><td className="p-2">{session.tema}</td><td className="p-2">{session.ambiente}</td></tr>;
                  })}</tbody>
                </table>
              </div>
            </details>
          )}
          {preview.completed ? (
            <div className="space-y-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">Importación completada. Las claves de prueba solo se muestran ahora; descárgalas y guárdalas de forma segura.</p>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 font-bold text-white" onClick={() => downloadCredentials(credentials)}>
                <Download className="h-4 w-4" /> Descargar credenciales
              </button>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead><tr><th className="p-2">Nombre</th><th className="p-2">Correo</th><th className="p-2">Clave de prueba</th></tr></thead>
                  <tbody>{credentials.map((account) => <tr key={account.email} className="border-t border-emerald-200"><td className="p-2">{account.nombre}</td><td className="p-2">{account.email}</td><td className="p-2 font-mono">{account.password}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          ) : (
            <button type="button" disabled={!preview.valid || loading} onClick={confirmImport} className="rounded-lg bg-[#00324D] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              Confirmar y crear datos de prueba
            </button>
          )}
        </section>
      )}
    </div>
  );
}
