'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

/**
 * Sidebar — barra de navegación lateral (solo visible en desktop ≥ md).
 *
 * Props:
 *   items   – array de { href, label, icon }
 *   nombre  – nombre del usuario logueado
 */

export default function Sidebar({ items, nombre }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-slate-900 text-slate-300 min-h-screen flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="font-bold text-white text-lg">GestorCompras</div>
        <div className="text-xs text-slate-500 mt-0.5">{nombre}</div>
      </div>

      <nav className="p-3 flex-1">
        {items.map((i) => {
          const activo = pathname === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors
                ${activo
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>{i.icon}</span>
              <span>{i.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <LogoutButton />
      </div>
    </aside>
  );
}
