'use client';

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/ui/StatCard';
import TablaCompras from '@/components/tables/TablaCompras';
import ModalDetalle from '@/components/modals/ModalDetalle';
import { fmt } from '@/lib/utils';

/**
 * MisComprasPage — historial personal de compras del usuario logueado.
 *
 * Funcionalidades:
 *   - Tabs de período: Hoy / Esta Semana / Este Mes / Todo
 *   - Tarjetas de estadísticas: total gastado, # compras, facturado vs no facturado
 *   - Tabla de compras con badges y botón de detalle
 *   - Modal de detalle con info completa + devolución
 */

const PERIODOS = [
  { key: 'dia', label: 'Hoy' },
  { key: 'semana', label: 'Esta Semana' },
  { key: 'mes', label: 'Este Mes' },
  { key: 'todo', label: 'Todo' },
];

export default function MisComprasPage() {
  const [periodo, setPeriodo] = useState('todo');
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarCompras = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/compras?periodo=${periodo}`);
      const data = await res.json();
      setCompras(data.compras || []);
    } catch {
      setCompras([]);
    }
    setCargando(false);
  }, [periodo]);

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  // Cargar detalle completo con JOIN a devoluciones
  async function verDetalle(compra) {
    setCompraDetalle(compra);
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/compras/${compra.id}`);
      const data = await res.json();
      setDetalleCompleto(data.compra || compra);
    } catch {
      setDetalleCompleto(compra);
    }
    setCargandoDetalle(false);
  }

  function cerrarDetalle() {
    setCompraDetalle(null);
    setDetalleCompleto(null);
  }

  // Estadísticas calculadas del período actual
  const totalGastado = compras.reduce((sum, c) => sum + Number(c.precio), 0);
  const totalCompras = compras.length;
  const totalFacturado = compras.filter(c => c.tiene_factura).reduce((sum, c) => sum + Number(c.precio), 0);
  const totalDevuelto = compras.filter(c => c.devuelto).reduce((sum, c) => sum + Number(c.precio), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Mis Compras</h1>
      <p className="text-slate-500 text-sm mb-6">Historial de compras registradas por ti</p>

      {/* Tabs de período */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all
              ${periodo === p.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Total gastado" valor={fmt(totalGastado)} icono="💰" color="blue" />
        <StatCard titulo="Compras" valor={totalCompras} icono="🛒" color="green" />
        <StatCard titulo="Facturado" valor={fmt(totalFacturado)} icono="📄" color="violet" />
        <StatCard titulo="Devuelto" valor={fmt(totalDevuelto)} icono="↩" color="amber" />
      </div>

      {/* Tabla de compras */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-slate-400 text-sm">Cargando compras...</div>
          </div>
        ) : (
          <TablaCompras compras={compras} onVerDetalle={verDetalle} />
        )}
      </div>

      {/* Modal de detalle */}
      {compraDetalle && (
        cargandoDetalle ? (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-2xl text-slate-500 text-sm">
              Cargando detalle...
            </div>
          </div>
        ) : (
          <ModalDetalle compra={detalleCompleto} onClose={cerrarDetalle} />
        )
      )}
    </div>
  );
}