'use client';

/**
 * StatCard — tarjeta de estadística reutilizable.
 *
 * Props:
 *   titulo  – texto descriptivo (ej. "Total compras")
 *   valor   – valor principal a mostrar (ej. "Bs. 12,500.00" o "23")
 *   icono   – emoji o string que se muestra junto al título (ej. "🛒")
 *   color   – variante de color: 'blue' | 'green' | 'amber' | 'red' | 'violet' (default: 'blue')
 */

const COLORES = {
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-700',
  red:    'bg-red-50 border-red-200 text-red-700',
  violet: 'bg-violet-50 border-violet-200 text-violet-700',
};

export default function StatCard({ titulo, valor, icono, color = 'blue' }) {
  const colorClasses = COLORES[color] || COLORES.blue;

  return (
    <div className={`rounded-xl border p-4 ${colorClasses}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80 mb-1">
        {icono && <span>{icono}</span>}
        <span>{titulo}</span>
      </div>
      <div className="text-2xl font-bold">{valor}</div>
    </div>
  );
}
