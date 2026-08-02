'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setCargando(false);
        return;
      }

      // Login correcto: redirige según el rol
      router.push(data.role === 'admin' ? '/historial' : '/nueva-compra');
      router.refresh();
    } catch (err) {
      setError('No se pudo conectar con el servidor');
      setCargando(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4
                 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-600
                 md:bg-none md:bg-[url('/imagenes/login.jpg')] md:bg-cover md:bg-center md:bg-no-repeat"
    >
      {/* Capa translúcida solo en escritorio, para que la imagen no compita con la tarjeta */}
      <div className="hidden md:block absolute inset-0 bg-blue-950/20" />

      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🏭
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">GestorCompras</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sistema de Registro de Compras</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Ingresa tu usuario"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}