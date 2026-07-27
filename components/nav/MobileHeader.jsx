'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

/**
 * MobileHeader — header fijo con menú hamburguesa para pantallas < md.
 *
 * En desktop está oculto (hidden md:...) porque se usa el Sidebar.
 *
 * Props:
 *   items   – array de { href, label, icon }
 *   nombre  – nombre del usuario logueado
 */

export default function MobileHeader({ items, nombre }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  function cerrar() {
    setAbierto(false);
  }

  return (
    <div className="md:hidden">
      {/* Header fijo superior */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white flex items-center justify-between px-4 h-14">
        <span className="font-bold">GestorCompras</span>
        <button
          onClick={() => setAbierto(!abierto)}
          className="p-2 rounded-lg hover:bg-white/10 transition"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {abierto ? '✕' : '☰'}
        </button>
      </header>

      {/* Spacer para compensar el header fijo */}
      <div className="h-14" />

      {/* Overlay + menú desplegable */}
      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={cerrar}
          />
          <nav className="fixed top-14 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 shadow-xl">
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-xs text-slate-500">{nombre}</p>
            </div>
            {items.map((i) => {
              const activo = pathname === i.href;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={cerrar}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors
                    ${activo
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span>{i.icon}</span>
                  <span>{i.label}</span>
                </Link>
              );
            })}
            <div className="px-4 py-3 border-t border-white/10">
              <LogoutButton />
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
