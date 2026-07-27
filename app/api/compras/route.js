import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { obtenerSesion } from '@/lib/session';

export async function GET(request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') || 'todo';
  const userId = searchParams.get('userId') || '';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  let sql = 'SELECT * FROM compras WHERE 1=1';
  const params = [];

  if (sesion.role !== 'admin') {
    params.push(sesion.id);
    sql += ` AND user_id = $${params.length}`;
  } else if (userId) {
    params.push(userId);
    sql += ` AND user_id = $${params.length}`;
  }

  if (desde || hasta) {
    if (desde) { params.push(desde); sql += ` AND fecha >= $${params.length}::date`; }
    if (hasta) { params.push(hasta); sql += ` AND fecha < ($${params.length}::date + interval '1 day')`; }
  } else {
    if (periodo === 'dia') sql += " AND fecha >= date_trunc('day', now())";
    if (periodo === 'semana') sql += " AND fecha >= date_trunc('week', now())";
    if (periodo === 'mes') sql += " AND fecha >= date_trunc('month', now())";
  }

  sql += ' ORDER BY fecha DESC';

  const compras = await query(sql, params);
  return NextResponse.json({ compras });
}

export async function POST(request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { producto, precio, descripcion, tieneFactura, fotoFactura, tipoPago, fotoQr } = await request.json();

  if (!producto || !precio || precio <= 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  if (tipoPago === 'qr' && !fotoQr) {
    return NextResponse.json({ error: 'Debes subir el comprobante QR' }, { status: 400 });
  }

  const rows = await query(
    `INSERT INTO compras (user_id, producto, precio, descripcion, tiene_factura, foto_factura, tipo_pago, foto_qr)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [sesion.id, producto, precio, descripcion || null, !!tieneFactura, fotoFactura || null, tipoPago, fotoQr || null]
  );

  return NextResponse.json({ compra: rows[0] }, { status: 201 });
}