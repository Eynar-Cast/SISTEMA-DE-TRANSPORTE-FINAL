import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { query } from '@/lib/db';
import { obtenerSesion } from '@/lib/session';

const FRASE_CONFIRMACION = 'BORRAR';

// ============================================================
// GET — estadísticas actuales, para mostrar antes de limpiar
// ============================================================
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const [compras] = await query('SELECT COUNT(*)::int AS n, MIN(fecha) AS desde FROM compras');
  const [devoluciones] = await query('SELECT COUNT(*)::int AS n FROM devoluciones');
  const [gastos] = await query('SELECT COUNT(*)::int AS n FROM gastos_chofer');
  const [fotos] = await query(`
    SELECT
      (SELECT COUNT(*) FROM compras WHERE foto_factura IS NOT NULL) +
      (SELECT COUNT(*) FROM compras WHERE foto_qr IS NOT NULL) +
      (SELECT COUNT(*) FROM devoluciones WHERE comprobante IS NOT NULL) +
      (SELECT COUNT(*) FROM gastos_chofer WHERE foto_factura IS NOT NULL) +
      (SELECT COUNT(*) FROM gastos_chofer WHERE foto_qr IS NOT NULL)
    AS n
  `);

  return NextResponse.json({
    compras: compras.n,
    devoluciones: devoluciones.n,
    gastosChofer: gastos.n,
    fotos: Number(fotos.n),
    desde: compras.desde,
  });
}

// ============================================================
// POST — ejecuta la limpieza (requiere frase de confirmación)
//
// Borra: compras, devoluciones (cascada desde compras) y gastos_chofer.
// NO toca: usuarios ni choferes (son datos maestros, no transaccionales).
// Antes de borrar de la base de datos, elimina también las fotos
// correspondientes en Vercel Blob para liberar ese espacio también.
// ============================================================
export async function POST(request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.confirmacion !== FRASE_CONFIRMACION) {
    return NextResponse.json(
      { error: `Debes enviar la confirmación exacta ("${FRASE_CONFIRMACION}")` },
      { status: 400 }
    );
  }

  // ---- 1. Contar antes de borrar (para el reporte final) ----
  const [{ n: totalCompras }] = await query('SELECT COUNT(*)::int AS n FROM compras');
  const [{ n: totalDevoluciones }] = await query('SELECT COUNT(*)::int AS n FROM devoluciones');
  const [{ n: totalGastos }] = await query('SELECT COUNT(*)::int AS n FROM gastos_chofer');

  // ---- 2. Reunir todas las URLs de fotos que hay que borrar de Blob ----
  const filasConFotos = await query(`
    SELECT foto_factura, foto_qr, NULL AS comprobante FROM compras
    UNION ALL
    SELECT NULL, NULL, comprobante FROM devoluciones
    UNION ALL
    SELECT foto_factura, foto_qr, NULL FROM gastos_chofer
  `);

  const urls = [];
  for (const fila of filasConFotos) {
    for (const campo of [fila.foto_factura, fila.foto_qr, fila.comprobante]) {
      // Solo URLs reales de Blob (https://...) — ignora restos viejos en
      // base64, esos se eliminan solos junto con la fila de la base de datos.
      if (campo && campo.startsWith('https://')) urls.push(campo);
    }
  }

  let fotosEliminadas = 0;
  let fotosConError = 0;
  for (const url of urls) {
    try {
      await del(url);
      fotosEliminadas++;
    } catch {
      // El archivo puede ya no existir o la URL puede estar corrupta — no
      // detenemos la limpieza completa por una foto individual.
      fotosConError++;
    }
  }

  // ---- 3. Borrar las filas (compras arrastra devoluciones por CASCADE) ----
  await query('DELETE FROM compras');
  await query('DELETE FROM gastos_chofer');

  return NextResponse.json({
    ok: true,
    comprasEliminadas: totalCompras,
    devolucionesEliminadas: totalDevoluciones,
    gastosEliminados: totalGastos,
    fotosEliminadas,
    fotosConError,
    limpiadoEn: new Date().toISOString(),
  });
}