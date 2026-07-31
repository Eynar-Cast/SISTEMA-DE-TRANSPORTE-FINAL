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

export default function GastosChoferesPage() {
  const [choferes, setChoferes] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [filtro, setFiltro] = useState('dia');
  const [choferId, setChoferId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/choferes').then(r => r.json()).then(d => setChoferes(d.choferes || []));
  }, []);

  const cargarGastos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (choferId) params.set('choferId', choferId);
      if (desde || hasta) {
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
      } else {
        params.set('periodo', filtro);
      }
      const res = await fetch(`/api/gastos-choferes?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setGastos(data.gastos);
    } catch {
      // silencioso: se conservan los datos previos
    }
    setCargando(false);
  }, [filtro, choferId, desde, hasta]);

  useEffect(() => { cargarGastos(); }, [cargarGastos]);

  function limpiarFiltros() {
    setFiltro('todo'); setChoferId(''); setDesde(''); setHasta('');
  }

  const total = gastos.reduce((a, g) => a + Number(g.monto), 0);
  const pagados = gastos.filter(g => g.pagado).reduce((a, g) => a + Number(g.monto), 0);
  const pendientes = gastos.filter(g => !g.pagado).reduce((a, g) => a + Number(g.monto), 0);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gastos por Chofer</h1>
          <p className="text-slate-500 text-sm">Historial de gastos registrados por chofer</p>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Chofer</label>
          <select value={choferId} onChange={e => setChoferId(e.target.value)} className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">Todos</option>
            {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.placa}</option>)}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon="🚛" label="Gastos" valor={gastos.length} />
        <StatCard icon="💰" label="Total" valor={fmt(total)} />
        <StatCard icon="✅" label="Pagado" valor={fmt(pagados)} />
        <StatCard icon="⏳" label="Pendiente" valor={fmt(pendientes)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">No hay gastos en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Gasto</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Chofer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Factura</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Pago</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Registrado por</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{g.nombre}</div>
                      {g.descripcion && <div className="text-xs text-slate-500 mt-0.5">{g.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{g.chofer_nombre}</div>
                      <div className="text-xs text-slate-400">{g.chofer_placa}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{fmt(g.monto)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${g.tiene_factura ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {g.tiene_factura ? '✅ Factura' : '❌ Sin factura'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {g.pagado
                        ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{g.tipo_pago === 'qr' ? '📱 QR' : '💵 Físico'}</span>
                        : <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">⏳ Pendiente</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">👤 {g.usuario_nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtFecha(g.fecha)}</td>
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