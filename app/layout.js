import './globals.css';

export const metadata = {
  title: 'GestorCompras',
  description: 'Sistema de Registro de Compras',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}