import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'gc_session';
const DURACION = '8h';

export async function crearSesion(usuario) {
  const token = await new SignJWT({
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    role: usuario.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export async function obtenerSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}