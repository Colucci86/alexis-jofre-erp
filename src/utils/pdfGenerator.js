/**
 * Genera y descarga un PDF profesional del presupuesto a partir de un elemento HTML contenedor.
 * Si no se proporciona contenedor, crea una vista temporal estructurada.
 */

function buildFileName(presupuesto) {
  const clientClean = (presupuesto?.clienteNombre || 'Cliente')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_');
  return `Presupuesto_${presupuesto?.numero || 'AJ'}_${clientClean}.pdf`;
}

/** Descarga un blob como archivo en el dispositivo. */
export function descargarBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // se revoca luego para no cancelar la descarga en curso
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

/** Renderiza el presupuesto y devuelve el PDF como Blob (sin descargarlo). */
export async function buildPresupuestoPdf(presupuesto, elementId = 'printable-presupuesto') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('No se pudo ubicar la vista del presupuesto para exportar a PDF.');
  }

  // Librerías pesadas cargadas bajo demanda (chunks separados en el build)
  const [{ jsPDF }, html2canvasLib] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const JsPDFCtor = typeof jsPDF === 'function' ? jsPDF : (jsPDF || {}).default;
  const html2canvas = typeof html2canvasLib === 'function' ? html2canvasLib : html2canvasLib.default;

  // Las imágenes (logo) deben estar cargadas o el PDF sale sin logo.
  await Promise.all(
    Array.from(element.images || []).map(img =>
      img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
    )
  );

  // Configuración de html2canvas con alta resolución (scale 2)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new JsPDFCtor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  const pageHeight = pdf.internal.pageSize.getHeight();
  let heightLeft = pdfHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  // tolerancia para no generar una página final virtually vacía por redondeo
  while (heightLeft > 1) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }

  return { blob: pdf.output('blob'), fileName: buildFileName(presupuesto) };
}

export async function generatePresupuestoPDF(presupuesto, elementId = 'printable-presupuesto') {
  try {
    const { blob, fileName } = await buildPresupuestoPdf(presupuesto, elementId);
    descargarBlob(blob, fileName);
    return true;
  } catch (err) {
    console.error('Error generando PDF:', err);
    alert('Ocurrió un error al generar el PDF del presupuesto.');
    return false;
  }
}
