'use client';
import { useState, useEffect, useCallback } from 'react';

const FILTROS = [
  { key: 'dia', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'todo', label: 'Todo' },
];

function fmt(n) { return 'Bs. ' + Number(n).toFixed(2); }
function fmtFecha(iso) { return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function StatCard({ icon, label, valor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-0.5">{valor}</div>
    </div>
  );
}

export default function HistorialPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [compras, setCompras] = useState([]);
  const [filtro, setFiltro] = useState('dia');
  const [userId, setUserId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(d.usuarios || []));
  }, []);

  const cargarCompras = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (desde || hasta) {
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
    } else {
      params.set('periodo', filtro);
    }
    const res = await fetch(`/api/compras?${params.toString()}`);
    const data = await res.json();
    if (res.ok) setCompras(data.compras);
    setCargando(false);
  }, [filtro, userId, desde, hasta]);

  useEffect(() => { cargarCompras(); }, [cargarCompras]);

  function limpiarFiltros() {
    setFiltro('todo'); setUserId(''); setDesde(''); setHasta('');
  }

  const totalGastado = compras.reduce((a, c) => a + (c.devuelto ? 0 : Number(c.precio)), 0);
  const totalDev = compras.filter(c => c.devuelto).reduce((a, c) => a + Number(c.precio), 0);

  function nombreUsuario(id) {
    const u = usuarios.find(x => x.id === id);
    return u ? u.nombre : '—';
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Compras</h1>
          <p className="text-slate-500 text-sm">Todas las compras de todos los usuarios</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => (
            <button key={f.key} onClick={() => { setDesde(''); setHasta(''); setFiltro(f.key); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filtro === f.key && !desde && !hasta ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
              {f.label}
            </button>
          ))}
          <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800">
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex gap-3 flex-wrap items-end print:hidden">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
          <select value={userId} onChange={e => setUserId(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">Todos</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <button onClick={limpiarFiltros} className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300">Limpiar</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <StatCard icon="📦" label="Total compras" valor={compras.length} />
        <StatCard icon="💰" label="Total gastado" valor={fmt(totalGastado)} />
        <StatCard icon="🔄" label="Devoluciones" valor={compras.filter(c => c.devuelto).length} />
        <StatCard icon="💸" label="Total devuelto" valor={fmt(totalDev)} />
        <StatCard icon="📊" label="Saldo neto" valor={fmt(totalGastado - totalDev)} />
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
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Factura</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Pago</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{c.producto}</div>
                      {c.descripcion && <div className="text-xs text-slate-500 mt-0.5">{c.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{nombreUsuario(c.user_id)}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}