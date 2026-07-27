'use client';
import { useState, useEffect, useCallback } from 'react';

function fmt(n) {
  return 'Bs. ' + Number(n).toFixed(2);
}
function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DevolucionesPage() {
  const [compras, setCompras] = useState([]);
  const [compraId, setCompraId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipoPago, setTipoPago] = useState('fisico');
  const [comprobante, setComprobante] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarCompras = useCallback(async () => {
    const res = await fetch('/api/compras?periodo=todo');
    const data = await res.json();
    if (res.ok) {
      setCompras(data.compras.filter(c => !c.devuelto));
    }
  }, []);

  useEffect(() => { cargarCompras(); }, [cargarCompras]);

  const compraSeleccionada = compras.find(c => c.id === compraId);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx. 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setComprobante(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!compraId) return setError('Selecciona una compra');
    if (!motivo.trim()) return setError('El motivo es obligatorio');
    if (tipoPago === 'transferencia' && !comprobante) return setError('Sube el comprobante de transferencia');

    setGuardando(true);
    try {
      const res = await fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compraId, motivo, tipoPago, comprobante }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar la devolución');
        setGuardando(false);
        return;
      }
      setMensaje('🔄 Devolución registrada correctamente');
      setCompraId(''); setMotivo(''); setTipoPago('fisico'); setComprobante(null);
      await cargarCompras();
    } catch {
      setError('No se pudo conectar con el servidor');
    }
    setGuardando(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Devoluciones</h1>
      <p className="text-slate-500 text-sm mb-6">Registra una devolución de producto</p>

      {mensaje && <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">{mensaje}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar compra a devolver</label>
          <select
            value={compraId}
            onChange={(e) => setCompraId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— Selecciona una compra —</option>
            {compras.map(c => (
              <option key={c.id} value={c.id}>
                {c.producto} — {fmt(c.precio)} — {fmtFecha(c.fecha)}
              </option>
            ))}
          </select>
          {compras.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">No tienes compras disponibles para devolver.</p>
          )}
        </div>

        {compraSeleccionada && (
          <form onSubmit={handleSubmit}>
            <div className="p-3 rounded-lg mb-4 bg-orange-50 border border-orange-200">
              <div className="font-semibold text-orange-800">{compraSeleccionada.producto}</div>
              <div className="text-sm text-orange-700">
                Precio: {fmt(compraSeleccionada.precio)} · Comprado: {fmtFecha(compraSeleccionada.fecha)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de devolución *</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe el motivo de la devolución..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reembolso — Tipo *</label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={tipoPago === 'fisico'} onChange={() => setTipoPago('fisico')} />
                  Cobro físico (efectivo)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={tipoPago === 'transferencia'} onChange={() => setTipoPago('transferencia')} />
                  Transferencia bancaria
                </label>
              </div>
            </div>

            {tipoPago === 'transferencia' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Comprobante de transferencia (reembolso)</label>
                <input type="file" accept="image/*" onChange={handleFile} />
                {comprobante && <img src={comprobante} alt="Comprobante" className="mt-2 max-h-40 rounded-lg border" />}
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition"
            >
              {guardando ? 'Guardando...' : '🔄 Registrar devolución'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}