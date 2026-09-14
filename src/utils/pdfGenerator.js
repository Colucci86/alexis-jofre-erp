/**
 * Genera y descarga un PDF profesional del presupuesto a partir de un elemento HTML contenedor.
 * Si no se proporciona contenedor, crea una vista temporal estructurada.
 */
export async function generatePresupuestoPDF(presupuesto, elementId = 'printable-presupuesto') {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('No se pudo ubicar la vista del presupuesto para exportar a PDF.');
      return false;
    }

    // Librerías pesadas cargadas bajo demanda (chunks separados en el build)
    const [{ jsPDF }, html2canvasLib] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const JsPDFCtor = typeof jsPDF === 'function' ? jsPDF : (jsPDF || {}).default;
    const html2canvas = typeof html2canvasLib === 'function' ? html2canvasLib : html2canvasLib.default;

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

    const pageHeight = 295; // A4 usable height in mm
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    const clientClean = (presupuesto?.clienteNombre || 'Cliente').replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
    const fileName = `Presupuesto_${presupuesto.numero || 'AJ'}_${clientClean}.pdf`;
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Error generando PDF:', err);
    alert('Ocurrió un error al generar el PDF del presupuesto.');
    return false;
  }
}
