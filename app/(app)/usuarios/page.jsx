'use client';
import { useState, useEffect, useCallback } from 'react';

function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuNombre, setNuNombre] = useState('');
  const [nuUser, setNuUser] = useState('');
  const [nuPass, setNuPass] = useState('');
  const [nuCargo, setNuCargo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [modalPass, setModalPass] = useState(null); // usuario seleccionado
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (res.ok) setUsuarios(data.usuarios);
    } catch {
      setError('No se pudo cargar la lista de usuarios');
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function crearUsuario() {
    setError('');
    if (!nuNombre.trim() || !nuUser.trim() || !nuPass) {
      setError('Nombre, usuario y contraseña son obligatorios');
      return;
    }
    setGuardando(true);
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: nuUser, password: nuPass, nombre: nuNombre, cargo: nuCargo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Error al crear usuario');
      setGuardando(false);
      return;
    }
    setModalNuevo(false); setGuardando(false);
    setNuNombre(''); setNuUser(''); setNuPass(''); setNuCargo('');
    await cargar();
  }

  async function toggleUsuario(id) {
    await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'toggle' }),
    });
    await cargar();
  }

  async function guardarPassword() {
    setError('');
    if (pass1.length < 6) return setError('Mínimo 6 caracteres');
    if (pass1 !== pass2) return setError('Las contraseñas no coinciden');
    await fetch(`/api/usuarios/${modalPass.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'password', password: pass1 }),
    });
    setModalPass(null); setPass1(''); setPass2('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm">Solo el administrador puede crear usuarios</p>
        </div>
        <button onClick={() => { setError(''); setModalNuevo(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm">
          ➕ Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay usuarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Cargo</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Compras</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Creado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900">{u.nombre}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.cargo || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{u.n_compras}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{fmtFecha(u.creado)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleUsuario(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${u.activo ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => { setModalPass(u); setPass1(''); setPass2(''); setError(''); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300">
                          🔑 Contraseña
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalNuevo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalNuevo(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Usuario</h3>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}
            <div className="grid gap-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input value={nuNombre} onChange={e => setNuNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ej: Pedro Mamani" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario (login) *</label>
                <input value={nuUser} onChange={e => setNuUser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ej: pedro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <input type="password" value={nuPass} onChange={e => setNuPass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Área</label>
                <input value={nuCargo} onChange={e => setNuCargo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ej: Almacén, Compras..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModalNuevo(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300">Cancelar</button>
              <button onClick={crearUsuario} disabled={guardando} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                {guardando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalPass(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900">Cambiar contraseña</h3>
              <button onClick={() => setModalPass(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Usuario: {modalPass.nombre}</p>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}
            <div className="grid gap-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña *</label>
                <input type="password" value={pass1} onChange={e => setPass1(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña *</label>
                <input type="password" value={pass2} onChange={e => setPass2(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repite la contraseña" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModalPass(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300">Cancelar</button>
              <button onClick={guardarPassword} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}