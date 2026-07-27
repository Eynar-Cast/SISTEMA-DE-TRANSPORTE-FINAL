'use client';
import { useState, useEffect, useCallback } from 'react';

export default function GastoChoferPage() {
  const [choferes, setChoferes] = useState([]);
  const [choferId, setChoferId] = useState('');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tieneFactura, setTieneFactura] = useState(false);
  const [fotoFactura, setFotoFactura] = useState(null);
  const [pagado, setPagado] = useState(true);
  const [tipoPago, setTipoPago] = useState('fisico');
  const [fotoQr, setFotoQr] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarChoferes = useCallback(async () => {
    const res = await fetch('/api/choferes');
    const data = await res.json();
    if (res.ok) setChoferes(data.choferes);
  }, []);

  useEffect(() => { cargarChoferes(); }, [cargarChoferes]);

  function handleFile(e, setFn) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx. 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setFn(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setMensaje('');

    if (!choferId) return setError('Selecciona un chofer');
    if (!nombre.trim()) return setError('El nombre del gasto es obligatorio');
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return setError('Ingresa un monto válido');
    if (pagado && tipoPago === 'qr' && !fotoQr) return setError('Debes subir el comprobante QR');

    setGuardando(true);
    try {
      const res = await fetch('/api/gastos-choferes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choferId, nombre, monto: montoNum, descripcion, tieneFactura, fotoFactura, pagado, tipoPago, fotoQr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar el gasto');
        setGuardando(false);
        return;
      }
      setMensaje('✅ Gasto registrado correctamente');
      setChoferId(''); setNombre(''); setMonto(''); setDescripcion('');
      setTieneFactura(false); setFotoFactura(null);
      setPagado(true); setTipoPago('fisico'); setFotoQr(null);
    } catch {
      setError('No se pudo conectar con el servidor');
    }
    setGuardando(false);
  }

  if (choferes.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Gasto de Chofer</h1>
        <p className="text-slate-500 text-sm mb-6">Registra un gasto asociado a un chofer</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 text-sm">
          ⚠️ No hay choferes registrados todavía. El administrador debe registrar al menos un chofer antes de que puedas registrar gastos.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Gasto de Chofer</h1>
      <p className="text-slate-500 text-sm mb-6">Registra un gasto asociado a un chofer</p>

      {mensaje && <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">{mensaje}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chofer *</label>
          <select value={choferId} onChange={e => setChoferId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="">— Selecciona un chofer —</option>
            {choferes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} — {c.placa}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del gasto *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Combustible, Peaje..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Bs.) *</label>
            <input type="number" step="0.01" min="0" value={monto} onChange={e => setMonto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Detalles adicionales..." />
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <input type="checkbox" checked={tieneFactura} onChange={e => setTieneFactura(e.target.checked)} />
            ¿Tiene factura?
          </label>
          {tieneFactura && (
            <div>
              <input type="file" accept="image/*" onChange={e => handleFile(e, setFotoFactura)} />
              {fotoFactura && <img src={fotoFactura} alt="Factura" className="mt-2 max-h-40 rounded-lg border" />}
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="block text-sm font-semibold text-slate-700 mb-2">¿Fue pagado? *</label>
          <div className="flex gap-4 flex-wrap mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={pagado === true} onChange={() => setPagado(true)} />
              Sí, pagado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={pagado === false} onChange={() => setPagado(false)} />
              No pagado / pendiente
            </label>
          </div>

          {pagado && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de pago</label>
              <div className="flex gap-4 flex-wrap mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={tipoPago === 'fisico'} onChange={() => setTipoPago('fisico')} />
                  Pago físico
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={tipoPago === 'qr'} onChange={() => setTipoPago('qr')} />
                  QR / Transferencia
                </label>
              </div>
              {tipoPago === 'qr' && (
                <div>
                  <input type="file" accept="image/*" onChange={e => handleFile(e, setFotoQr)} />
                  {fotoQr && <img src={fotoQr} alt="Comprobante QR" className="mt-2 max-h-40 rounded-lg border" />}
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={guardando}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition">
          {guardando ? 'Guardando...' : '✅ Registrar gasto'}
        </button>
      </form>
    </div>
  );
}