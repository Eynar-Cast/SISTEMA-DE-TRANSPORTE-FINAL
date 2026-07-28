import { obtenerSesion } from '@/lib/session';
import Sidebar from '@/components/nav/Sidebar';
import MobileHeader from '@/components/nav/MobileHeader';

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
  const nombre = sesion?.nombre || 'Usuario';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar items={items} nombre={nombre} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <MobileHeader items={items} nombre={nombre} />
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}