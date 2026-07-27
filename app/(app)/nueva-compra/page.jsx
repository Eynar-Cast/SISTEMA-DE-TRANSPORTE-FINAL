'use client';
import { useState } from 'react';

export default function NuevaCompraPage() {
  const [producto, setProducto] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tieneFactura, setTieneFactura] = useState(false);
  const [fotoFactura, setFotoFactura] = useState(null);
  const [tipoPago, setTipoPago] = useState('fisico');
  const [fotoQr, setFotoQr] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

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
    setError('');
    setMensaje('');

    if (!producto.trim()) return setError('El nombre del producto es obligatorio');
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) return setError('Ingresa un precio válido');
    if (tipoPago === 'qr' && !fotoQr) return setError('Debes subir el comprobante QR');

    setGuardando(true);
    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto, precio: precioNum, descripcion, tieneFactura, fotoFactura, tipoPago, fotoQr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar la compra');
        setGuardando(false);
        return;
      }
      setMensaje('✅ Compra registrada correctamente');
      setProducto(''); setPrecio(''); setDescripcion('');
      setTieneFactura(false); setFotoFactura(null);
      setTipoPago('fisico'); setFotoQr(null);
    } catch {
      setError('No se pudo conectar con el servidor');
    }
    setGuardando(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Nueva Compra</h1>
      <p className="text-slate-500 text-sm mb-6">Registra un nuevo producto adquirido</p>

      {mensaje && <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">{mensaje}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto *</label>
            <input value={producto} onChange={e=>setProducto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Filtro de aceite Volvo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio (Bs.) *</label>
            <input type="number" step="0.01" min="0" value={precio} onChange={e=>setPrecio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
          <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Detalles adicionales del producto..." />
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <input type="checkbox" checked={tieneFactura} onChange={e=>setTieneFactura(e.target.checked)} />
            ¿Tiene factura?
          </label>
          {tieneFactura && (
            <div>
              <input type="file" accept="image/*" onChange={e=>handleFile(e, setFotoFactura)} />
              {fotoFactura && <img src={fotoFactura} alt="Factura" className="mt-2 max-h-40 rounded-lg border" />}
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de pago *</label>
          <div className="flex gap-4 flex-wrap mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="pago" checked={tipoPago==='fisico'} onChange={()=>setTipoPago('fisico')} />
              Pago físico (efectivo)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="pago" checked={tipoPago==='qr'} onChange={()=>setTipoPago('qr')} />
              Transferencia QR
            </label>
          </div>
          {tipoPago === 'qr' && (
            <div>
              <input type="file" accept="image/*" onChange={e=>handleFile(e, setFotoQr)} />
              {fotoQr && <img src={fotoQr} alt="Comprobante QR" className="mt-2 max-h-40 rounded-lg border" />}
            </div>
          )}
        </div>

        <button type="submit" disabled={guardando}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition">
          {guardando ? 'Guardando...' : '✅ Registrar compra'}
        </button>
      </form>
    </div>
  );
}