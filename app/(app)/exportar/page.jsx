'use client';
import { useState } from 'react';

export default function ExportarPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [descargando, setDescargando] = useState('');
  const [error, setError] = useState('');

  async function descargar(formato) {
    setError('');
    setDescargando(formato);
    try {
      const params = new URLSearchParams({ formato });
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const res = await fetch(`/api/admin/exportar?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo generar el archivo');
      }

      const blob = await res.blob();
      const disposicion = res.headers.get('Content-Disposition') || '';
      const match = disposicion.match(/filename="(.+)"/);
      const nombreArchivo = match ? match[1] : `gestorcompras_respaldo.${formato}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
    setDescargando('');
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Exportar Datos</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Descarga un respaldo completo de compras, devoluciones y gastos de chofer, agrupado por usuario.
      </p>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Rango de fechas (opcional — déjalo vacío para exportar todo)
          </p>
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => descargar('xlsx')}
            disabled={!!descargando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            {descargando === 'xlsx' ? 'Generando...' : '📊 Descargar Excel (.xlsx)'}
          </button>
          <button
            onClick={() => descargar('json')}
            disabled={!!descargando}
            className="bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            {descargando === 'json' ? 'Generando...' : '🗂️ Descargar JSON'}
          </button>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300">
          💡 El Excel incluye 4 hojas: Resumen por usuario, Compras, Devoluciones y Gastos de chofer.
          El JSON trae la misma información en formato de datos, útil como respaldo técnico.
        </div>
      </div>
    </div>
  );
}