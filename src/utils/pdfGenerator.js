import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

    // Configuración de html2canvas con alta resolución (scale 2)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const fileName = `Presupuesto_${presupuesto.numero || 'AJ'}_${(presupuesto.clienteNombre || 'Cliente').replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Error generando PDF:', err);
    alert('Ocurrió un error al generar el PDF del presupuesto.');
    return false;
  }
}
