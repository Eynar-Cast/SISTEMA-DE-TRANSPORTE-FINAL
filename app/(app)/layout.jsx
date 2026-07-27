import { obtenerSesion } from '@/lib/session';
import Link from 'next/link';
import LogoutButton from '@/components/nav/LogoutButton';

const NAV_USER = [
  { href: '/nueva-compra', label: 'Nueva compra', icon: '➕' },
  { href: '/mis-compras', label: 'Mis compras', icon: '📋' },
  { href: '/devoluciones', label: 'Devoluciones', icon: '🔄' },
  { href: '/gasto-chofer', label: 'Gasto de chofer', icon: '🚛' },
];

const NAV_ADMIN = [
  { href: '/historial', label: 'Historial global', icon: '📊' },
  { href: '/choferes', label: 'Choferes', icon: '🚛' },
  { href: '/gastos-choferes', label: 'Gastos choferes', icon: '📋' },
  { href: '/usuarios', label: 'Usuarios', icon: '👥' },
];

export default async function AppLayout({ children }) {
  const sesion = await obtenerSesion();
  const items = sesion?.role === 'admin' ? NAV_ADMIN : NAV_USER;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="font-bold text-white">GestorCompras</div>
          <div className="text-xs text-slate-500">{sesion?.nombre}</div>
        </div>
        <nav className="p-3 flex-1">
          {items.map(i => (
            <Link key={i.href} href={i.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 hover:text-white mb-1">
              <span>{i.icon}</span><span>{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}