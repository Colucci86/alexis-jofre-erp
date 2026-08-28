export function validateMaterialConsumption({ producto, cantidad }) {
  const cantNum = Number(cantidad);

  if (!producto) {
    return { error: 'Seleccioná un producto.' };
  }
  if (Number.isNaN(cantNum) || cantNum <= 0) {
    return { error: 'La cantidad debe ser un número mayor a cero.' };
  }

  const stockDisponible = Number(producto.stockActual || 0);
  if (cantNum > stockDisponible) {
    return {
      error: `Stock insuficiente de "${producto.nombre}". Disponible: ${stockDisponible} ${producto.unidadMedida || 'unidades'}. Solicitado: ${cantNum}.`,
    };
  }

  return { success: true, cantidad: cantNum, stockRestante: stockDisponible - cantNum };
}
