import React from 'react';

const SERIF = "'Cambria', Georgia, 'Times New Roman', serif";
const SANS = "'Calibri', 'Segoe UI', Arial, sans-serif";
const COLOR_BANDA = '#7D96AC';
const COLOR_REGLA = '#D9D9D9';

const formatMoneda = (valor) => `$${Number(valor || 0).toLocaleString('es-AR')}`;

/** Formatea fechas ISO (YYYY-MM-DD) sin desfase de zona horaria. */
const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(fecha);
};

/** Precio unitario: si no viene cargado, se deduce del total y la cantidad. */
const precioUnitarioDe = (item) => {
  const unitario = Number(item?.precioUnitario || 0);
  if (unitario > 0) return unitario;
  const cantidad = Number(item?.cantidad || 0);
  return cantidad > 0 ? Number(item?.total || 0) / cantidad : 0;
};

/**
 * Documento imprimible del presupuesto (A4). Se usa tanto para la vista en
 * pantalla como para la generación del PDF, de modo que ambos sean idénticos.
 */
export default function PresupuestoDocumento({ presupuesto, cliente, config, className = '' }) {
  const items = presupuesto?.items || [];
  const direccion = (cliente?.direccion || '').trim();

  return (
    <div
      className={`bg-white text-[#1A1A1A] flex flex-col ${className}`}
      style={{ width: '794px', minHeight: '1123px', padding: '49px', fontFamily: SERIF }}
    >
      {/* Encabezado: datos de la empresa a la izquierda, logo a la derecha */}
      <div className="flex justify-between items-start">
        <div style={{ fontFamily: SERIF, fontSize: '14px', lineHeight: '21px' }}>
          {config?.ciudad ? <div className="text-[#333]">{config.ciudad}</div> : null}
          {config?.titular ? <div className="font-semibold text-[#111]">{config.titular}</div> : null}
          {config?.telefono ? <div className="text-[#333]">Teléfono: {config.telefono}</div> : null}
          {config?.email ? <div className="text-[#333]">{config.email}</div> : null}
        </div>
        <img src="/logo.png" alt="AJ" className="object-contain" style={{ width: '92px', height: '92px' }} />
      </div>

      {/* Título del documento y fecha */}
      <div className="flex justify-between items-end" style={{ marginTop: '38px' }}>
        <h1
          className="font-bold text-[#111]"
          style={{ fontFamily: SANS, fontSize: '19px', letterSpacing: '0.03em' }}
        >
          PRESUPUESTO N° {presupuesto?.numero}
        </h1>
        <div className="text-[#111]" style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 700 }}>
          FECHA {formatFecha(presupuesto?.fecha)}
        </div>
      </div>

      {/* Datos del cliente */}
      <div style={{ marginTop: '34px' }}>
        <div
          className="text-[#444] uppercase"
          style={{ fontFamily: SANS, fontSize: '13px', letterSpacing: '0.12em' }}
        >
          Cliente
        </div>
        <div className="text-[#111]" style={{ fontSize: '14px', marginTop: '6px' }}>
          {presupuesto?.clienteNombre || cliente?.nombre || ''}
        </div>
        {direccion ? (
          <div className="text-[#333]" style={{ fontSize: '14px', marginTop: '4px', whiteSpace: 'pre-line' }}>
            {direccion}
          </div>
        ) : null}
      </div>

      {/* Detalle de los trabajos */}
      <table className="w-full border-collapse" style={{ marginTop: '32px' }}>
        <thead>
          <tr style={{ backgroundColor: COLOR_BANDA }}>
            {[
              { texto: 'Cantidad', align: 'left', width: '13%' },
              { texto: 'Descripción', align: 'left', width: '42%' },
              { texto: 'Precio por unidad', align: 'right', width: '25%' },
              { texto: 'Total', align: 'right', width: '20%' },
            ].map(col => (
              <th
                key={col.texto}
                className="text-white font-bold uppercase"
                style={{
                  fontFamily: SANS,
                  fontSize: '12.5px',
                  letterSpacing: '0.08em',
                  padding: '12px 10px',
                  textAlign: col.align,
                  width: col.width,
                }}
              >
                {col.texto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-[#555] italic" style={{ padding: '14px 10px', fontSize: '13.5px' }}>
                Sin ítems cargados.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${COLOR_REGLA}` }}>
                <td style={{ padding: '11px 10px', fontSize: '13.5px', verticalAlign: 'top' }}>
                  {item.cantidad}
                </td>
                <td style={{ padding: '11px 10px', fontSize: '13.5px', lineHeight: '1.35', verticalAlign: 'top' }}>
                  {item.descripcion}
                </td>
                <td
                  className="border-l"
                  style={{ padding: '11px 10px', fontSize: '13.5px', textAlign: 'right', verticalAlign: 'top', borderColor: '#E8E8E8' }}
                >
                  {formatMoneda(precioUnitarioDe(item))}
                </td>
                <td
                  className="border-l font-semibold"
                  style={{ padding: '11px 10px', fontSize: '13.5px', textAlign: 'right', verticalAlign: 'top', borderColor: '#E8E8E8' }}
                >
                  {formatMoneda(item.total)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totales */}
      <div className="flex justify-end" style={{ marginTop: '34px' }}>
        <div style={{ width: '46%' }}>
          <div className="flex justify-between" style={{ fontSize: '16px', padding: '5px 0' }}>
            <span className="font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Subtotal</span>
            <span className="font-bold">{formatMoneda(presupuesto?.subtotal)}</span>
          </div>
          {Number(presupuesto?.desgloseEfectivo) > 0 ? (
            <div className="flex justify-between" style={{ fontSize: '16px', padding: '5px 0' }}>
              <span className="font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Efectivo</span>
              <span className="font-bold">{formatMoneda(presupuesto?.desgloseEfectivo)}</span>
            </div>
          ) : null}
          {Number(presupuesto?.desgloseCanje) > 0 ? (
            <div className="flex justify-between" style={{ fontSize: '16px', padding: '5px 0' }}>
              <span className="font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Canje</span>
              <span className="font-bold">{formatMoneda(presupuesto?.desgloseCanje)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Condiciones (al pie de la página, como en la referencia) */}
      <div className="text-[#333]" style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '13.5px', lineHeight: '1.5' }}>
        {presupuesto?.observaciones ? (
          <p style={{ whiteSpace: 'pre-line' }}>{presupuesto.observaciones}</p>
        ) : null}
        <p style={{ marginTop: '10px' }}>
          Presupuesto de acuerdo a lo descripto, válido por {presupuesto?.validez || 15} días hábiles.
        </p>
      </div>
    </div>
  );
}
