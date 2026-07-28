'use client';
import { useState, useEffect, useCallback } from 'react';

const FILTROS = [
  { key: 'dia', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'todo', label: 'Todo' },
];

function fmt(n) {
  return 'Bs. ' + Number(n).toFixed(2);
}
function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtFechaHora(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon, label, valor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-0.5">{valor}</div>
    </div>
  );
}

export default function MisComprasPage() {
  const [filtro, setFiltro] = useState('dia');
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [imagenGrande, setImagenGrande] = useState(null);

  const cargarCompras = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/compras?periodo=${filtro}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setCompras(data.compras);
    } catch (err) {
      setError(err.message);
    }
    setCargando(false);
  }, [filtro]);

  useEffect(() => { cargarCompras(); }, [cargarCompras]);

  async function verDetalle(id) {
    setErrorDetalle('');
    setCargandoDetalle(true);
    setDetalle({ id }); // abre el modal ya en estado de carga
    try {
      const res = await fetch(`/api/compras/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el detalle');
      setDetalle(data.compra);
    } catch (err) {
      setErrorDetalle(err.message);
    }
    setCargandoDetalle(false);
  }

  const totalGastado = compras.reduce((a, c) => a + (c.devuelto ? 0 : Number(c.precio)), 0);
  const totalDevueltas = compras.filter(c => c.devuelto).length;
  const totalDevuelto = compras.filter(c => c.devuelto).reduce((a, c) => a + Number(c.precio), 0);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Compras</h1>
          <p className="text-slate-500 text-sm">Historial personal de compras</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                filtro === f.key ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon="📦" label="Compras" valor={compras.length} />
        <StatCard icon="💰" label="Total gastado" valor={fmt(totalGastado)} />
        <StatCard icon="🔄" label="Devoluciones" valor={totalDevueltas} />
        <StatCard icon="💸" label="Total devuelto" valor={fmt(totalDevuelto)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : compras.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">No hay compras en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Factura</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Pago</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{c.producto}</div>
                      {c.descripcion && <div className="text-xs text-slate-500 mt-0.5">{c.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{fmt(c.precio)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tiene_factura ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.tiene_factura ? '✅ Con factura' : '❌ Sin factura'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {c.tipo_pago === 'qr' ? '📱 QR' : '💵 Físico'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.devuelto
                        ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">🔄 Devuelto</span>
                        : <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Activo</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtFecha(c.fecha)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => verDetalle(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detalle && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDetalle(null); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900">Detalle de Compra</h3>
              <button onClick={() => setDetalle(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            {cargandoDetalle ? (
              <div className="p-8 text-center text-slate-400">Cargando...</div>
            ) : errorDetalle ? (
              <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm">{errorDetalle}</div>
            ) : (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase mb-1">Producto</div>
                    <div className="font-bold text-slate-900">{detalle.producto}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase mb-1">Precio</div>
                    <div className="font-bold text-slate-900 text-lg">{fmt(detalle.precio)}</div>
                  </div>
                </div>
                {detalle.descripcion && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase mb-1">Descripción</div>
                    <div className="text-slate-700 text-sm">{detalle.descripcion}</div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase mb-1">Fecha</div>
                  <div className="text-slate-700 text-sm">{fmtFechaHora(detalle.fecha)}</div>
                </div>
                {detalle.foto_factura && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1.5">📄 Foto de factura</div>
                    <img
                      src={detalle.foto_factura}
                      alt="Factura"
                      className="max-h-44 rounded-lg border border-slate-200 cursor-zoom-in"
                      onClick={() => setImagenGrande(detalle.foto_factura)}
                    />
                  </div>
                )}
                {detalle.foto_qr && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1.5">📱 Comprobante QR</div>
                    <img
                      src={detalle.foto_qr}
                      alt="Comprobante"
                      className="max-h-44 rounded-lg border border-slate-200 cursor-zoom-in"
                      onClick={() => setImagenGrande(detalle.foto_qr)}
                    />
                  </div>
                )}
                {detalle.devuelto && (
                  <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="text-sm font-bold text-red-600 mb-2">🔄 Esta compra fue devuelta</div>
                    {detalle.devolucion_motivo && (
                      <div className="text-sm text-slate-700 mb-1"><strong>Motivo:</strong> {detalle.devolucion_motivo}</div>
                    )}
                    {detalle.devolucion_tipo_pago && (
                      <div className="text-sm text-slate-700 mb-1">
                        <strong>Reembolso:</strong> {detalle.devolucion_tipo_pago === 'transferencia' ? 'Transferencia bancaria' : 'Cobro físico'}
                      </div>
                    )}
                    {detalle.devolucion_fecha && (
                      <div className="text-sm text-slate-700 mb-2"><strong>Fecha devolución:</strong> {fmtFecha(detalle.devolucion_fecha)}</div>
                    )}
                    {detalle.devolucion_comprobante && (
                      <img
                        src={detalle.devolucion_comprobante}
                        alt="Comprobante de reembolso"
                        className="max-h-44 rounded-lg border border-slate-200 cursor-zoom-in"
                        onClick={() => setImagenGrande(detalle.devolucion_comprobante)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom de imagen */}
      {imagenGrande && (
        <div
          className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4"
          onClick={() => setImagenGrande(null)}
        >
          <img src={imagenGrande} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}