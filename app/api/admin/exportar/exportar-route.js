import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { query } from '@/lib/db';
import { obtenerSesion } from '@/lib/session';

function fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

export async function GET(request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') === 'json' ? 'json' : 'xlsx';
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';

  // ---- Filtro de fechas reutilizable ----
  const filtroFecha = (columna) => {
    const cláusulas = [];
    const params = [];
    if (desde) { params.push(desde); cláusulas.push(`${columna} >= $${params.length}::date`); }
    if (hasta) { params.push(hasta); cláusulas.push(`${columna} < ($${params.length}::date + interval '1 day')`); }
    return { cláusulas, params };
  };

  // ---- 1. Compras (con nombre de usuario) ----
  const fCompras = filtroFecha('c.fecha');
  const sqlCompras = `
    SELECT c.id, c.fecha, u.nombre AS usuario, u.username, c.producto, c.precio, c.descripcion,
           c.tiene_factura, c.tipo_pago, c.devuelto
    FROM compras c
    JOIN usuarios u ON u.id = c.user_id
    ${fCompras.cláusulas.length ? 'WHERE ' + fCompras.cláusulas.join(' AND ') : ''}
    ORDER BY c.fecha DESC`;
  const compras = await query(sqlCompras, fCompras.params);

  // ---- 2. Devoluciones (con datos de la compra original) ----
  const fDev = filtroFecha('d.fecha');
  const sqlDevoluciones = `
    SELECT d.id, d.fecha, u.nombre AS usuario, c.producto, c.precio, d.motivo, d.tipo_pago
    FROM devoluciones d
    JOIN compras c ON c.id = d.compra_id
    JOIN usuarios u ON u.id = c.user_id
    ${fDev.cláusulas.length ? 'WHERE ' + fDev.cláusulas.join(' AND ') : ''}
    ORDER BY d.fecha DESC`;
  const devoluciones = await query(sqlDevoluciones, fDev.params);

  // ---- 3. Gastos de chofer (con usuario que registró y chofer) ----
  const fGastos = filtroFecha('g.fecha');
  const sqlGastos = `
    SELECT g.id, g.fecha, u.nombre AS usuario, ch.nombre AS chofer, ch.placa, g.nombre AS gasto,
           g.monto, g.descripcion, g.tiene_factura, g.pagado, g.tipo_pago
    FROM gastos_chofer g
    JOIN choferes ch ON ch.id = g.chofer_id
    JOIN usuarios u ON u.id = g.user_id
    ${fGastos.cláusulas.length ? 'WHERE ' + fGastos.cláusulas.join(' AND ') : ''}
    ORDER BY g.fecha DESC`;
  const gastosChofer = await query(sqlGastos, fGastos.params);

  // ---- 4. Resumen por usuario ----
  const resumenMap = new Map();
  function usuarioResumen(nombre) {
    if (!resumenMap.has(nombre)) {
      resumenMap.set(nombre, {
        usuario: nombre, compras: 0, totalCompras: 0,
        devoluciones: 0, totalDevuelto: 0,
        gastosChofer: 0, totalGastosChofer: 0,
      });
    }
    return resumenMap.get(nombre);
  }
  for (const c of compras) {
    const r = usuarioResumen(c.usuario);
    r.compras += 1;
    if (!c.devuelto) r.totalCompras += Number(c.precio);
  }
  for (const d of devoluciones) {
    const r = usuarioResumen(d.usuario);
    r.devoluciones += 1;
    r.totalDevuelto += Number(d.precio);
  }
  for (const g of gastosChofer) {
    const r = usuarioResumen(g.usuario);
    r.gastosChofer += 1;
    r.totalGastosChofer += Number(g.monto);
  }
  const resumen = Array.from(resumenMap.values());

  const nombreArchivo = `gestorcompras_respaldo_${new Date().toISOString().slice(0, 10)}`;

  // ============================================================
  // JSON
  // ============================================================
  if (formato === 'json') {
    const cuerpo = {
      generadoEn: new Date().toISOString(),
      rangoFechas: { desde: desde || null, hasta: hasta || null },
      resumenPorUsuario: resumen,
      compras,
      devoluciones,
      gastosChofer,
    };
    return new NextResponse(JSON.stringify(cuerpo, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${nombreArchivo}.json"`,
      },
    });
  }

  // ============================================================
  // EXCEL (.xlsx)
  // ============================================================
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GestorCompras';
  wb.created = new Date();

  const estiloEncabezado = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } } };

  // Hoja 1: Resumen por usuario
  const hojaResumen = wb.addWorksheet('Resumen por usuario');
  hojaResumen.columns = [
    { header: 'Usuario', key: 'usuario', width: 24 },
    { header: 'N° Compras', key: 'compras', width: 12 },
    { header: 'Total gastado (compras)', key: 'totalCompras', width: 22 },
    { header: 'N° Devoluciones', key: 'devoluciones', width: 16 },
    { header: 'Total devuelto', key: 'totalDevuelto', width: 18 },
    { header: 'N° Gastos de chofer', key: 'gastosChofer', width: 18 },
    { header: 'Total gastos de chofer', key: 'totalGastosChofer', width: 20 },
  ];
  hojaResumen.getRow(1).eachCell(c => Object.assign(c, estiloEncabezado));
  resumen.forEach(r => hojaResumen.addRow(r));

  // Hoja 2: Compras
  const hojaCompras = wb.addWorksheet('Compras');
  hojaCompras.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Producto', key: 'producto', width: 28 },
    { header: 'Precio (Bs.)', key: 'precio', width: 14 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
    { header: 'Con factura', key: 'tiene_factura', width: 12 },
    { header: 'Tipo de pago', key: 'tipo_pago', width: 14 },
    { header: 'Devuelto', key: 'devuelto', width: 12 },
  ];
  hojaCompras.getRow(1).eachCell(c => Object.assign(c, estiloEncabezado));
  compras.forEach(c => hojaCompras.addRow({
    ...c,
    fecha: fmtFecha(c.fecha),
    precio: Number(c.precio),
    tiene_factura: c.tiene_factura ? 'Sí' : 'No',
    tipo_pago: c.tipo_pago === 'qr' ? 'QR' : 'Físico',
    devuelto: c.devuelto ? 'Sí' : 'No',
  }));

  // Hoja 3: Devoluciones
  const hojaDev = wb.addWorksheet('Devoluciones');
  hojaDev.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Producto devuelto', key: 'producto', width: 28 },
    { header: 'Precio (Bs.)', key: 'precio', width: 14 },
    { header: 'Motivo', key: 'motivo', width: 30 },
    { header: 'Tipo de reembolso', key: 'tipo_pago', width: 18 },
  ];
  hojaDev.getRow(1).eachCell(c => Object.assign(c, estiloEncabezado));
  devoluciones.forEach(d => hojaDev.addRow({
    ...d,
    fecha: fmtFecha(d.fecha),
    precio: Number(d.precio),
    tipo_pago: d.tipo_pago === 'transferencia' ? 'Transferencia bancaria' : 'Cobro físico',
  }));

  // Hoja 4: Gastos de chofer
  const hojaGastos = wb.addWorksheet('Gastos de chofer');
  hojaGastos.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Registrado por', key: 'usuario', width: 20 },
    { header: 'Chofer', key: 'chofer', width: 20 },
    { header: 'Placa', key: 'placa', width: 12 },
    { header: 'Gasto', key: 'gasto', width: 22 },
    { header: 'Monto (Bs.)', key: 'monto', width: 14 },
    { header: 'Descripción', key: 'descripcion', width: 28 },
    { header: 'Con factura', key: 'tiene_factura', width: 12 },
    { header: 'Pagado', key: 'pagado', width: 10 },
    { header: 'Tipo de pago', key: 'tipo_pago', width: 14 },
  ];
  hojaGastos.getRow(1).eachCell(c => Object.assign(c, estiloEncabezado));
  gastosChofer.forEach(g => hojaGastos.addRow({
    ...g,
    fecha: fmtFecha(g.fecha),
    monto: Number(g.monto),
    tiene_factura: g.tiene_factura ? 'Sí' : 'No',
    pagado: g.pagado ? 'Sí' : 'No',
    tipo_pago: g.tipo_pago === 'qr' ? 'QR' : g.tipo_pago === 'fisico' ? 'Físico' : '—',
  }));

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}.xlsx"`,
    },
  });
}