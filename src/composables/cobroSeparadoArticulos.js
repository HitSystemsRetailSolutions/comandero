// Ordena los suplementos para comparar configuraciones aunque se eligieran en distinto orden.
function claveSuplementos(suplementos) {
  return (suplementos || []).map((suplemento) =>
    JSON.stringify([suplemento._id ?? suplemento.idArticulo ?? suplemento.nombre, suplemento.unidades ?? 1]),
  ).sort();
}

// Distingue variantes del mismo artículo al agrupar el borrador o recuperar una selección.
export function claveConfiguracion(item) {
  return JSON.stringify([
    item.idArticulo,
    item.nombre,
    item.gramos || 0,
    item.precioUnitario ?? item.precioTecla ?? null,
    item.comentario || "",
    Boolean(item.regalo),
    claveSuplementos(item.arraySuplementos),
    (item.articulosMenu || []).map((opcion) =>
      JSON.stringify([claveConfiguracion(opcion), opcion.unidades]),
    ).sort(),
    item.promocion?.idPromocion,
    item.promocion?.grupos?.map((grupo) => grupo.map((opcion) => [
      claveConfiguracion(opcion),
      opcion.unidades,
      (opcion.suplementosPorArticulo || []).map((bloque) => [
        bloque.unidades, claveSuplementos(bloque.suplementos),
      ]),
    ])),
  ]);
}

// Separa las cantidades de una línea para cobrar unidades sueltas. Un artículo a peso se cobra entero.
export function unidadesCesta(cesta) {
  return cesta.lista.flatMap((item, parentIndex) => {
    if (item.pagado || item.unidades <= 0) return [];
    const cantidad = item.gramos > 0 ? 1 : (item.unidades || 1);
    return Array.from({ length: cantidad }, (_, unitIndex) => {
      const instancia = item.instancias?.[unitIndex];
      const instanceId = instancia?.instanceId
        ?? (cantidad === 1 ? item.instanceId : undefined);
      const printed = instancia?.printed ?? (unitIndex < Number(item.printed || 0));
      return {
        ...item,
        instancias: [{ instanceId, printed }],
        unidades: item.gramos > 0 ? item.unidades : 1,
        subtotal: item.subtotal / cantidad,
        parentIndex,
        unitIndex,
        instanceId,
        printed,
        pID: `${parentIndex}_${unitIndex}`,
        originalParent: item,
      };
    });
  });
}

// Recupera una unidad tras recargar la cesta, aunque su línea haya cambiado de posición.
export function encontrarUnidad(anterior, anteriores, disponibles) {
  const clave = claveConfiguracion(anterior.originalParent);
  const mismaConfiguracion = (unidad) => claveConfiguracion(unidad.originalParent) === clave;
  const candidatas = disponibles.filter(mismaConfiguracion);
  if (anterior.instanceId) {
    const mismasInstancias = candidatas.filter((unidad) => unidad.instanceId === anterior.instanceId);
    return mismasInstancias.length === 1 ? mismasInstancias[0] : null;
  }
  // Una cesta antigua puede carecer de identificadores. Solo se restaura un cruce inequívoco.
  if (anteriores.filter(mismaConfiguracion).length !== 1 || candidatas.length !== 1) return null;
  return candidatas[0];
}

// Resume el peso, los suplementos y las opciones para distinguir variantes en pantalla.
export function detalleArticulo(item) {
  const detalle = [];
  if (item.gramos > 0) detalle.push(`${item.gramos} g`);
  detalle.push(...(item.arraySuplementos || []).map((suplemento) => suplemento.nombre).filter(Boolean));
  for (const opcion of item.articulosMenu || []) {
    const extras = detalleArticulo(opcion);
    const nombre = opcion.unidades > 1 && !opcion.gramos ? `${opcion.unidades} × ${opcion.nombre}` : opcion.nombre;
    detalle.push(extras ? `${nombre} (${extras})` : nombre);
  }
  return detalle.join(" · ");
}

// Limita el catálogo de altas a teclas válidas de artículos por unidad.
export function articulosPorUnidad(teclas = []) {
  return teclas.filter((tecla) => tecla?.idArticle != null && typeof tecla.nombreArticulo === "string"
    && (tecla.esSumable === true || tecla.esSumable === "true"));
}

// Detecta cambios que afectan a la selección o al importe antes de cobrar.
export function firmaCesta(cesta) {
  return JSON.stringify([
    cesta.idCliente,
    cesta.lista.map((item) => [
      claveConfiguracion(item), item.unidades, item.subtotal, item.pagado, item.instanceId, item.printed,
      item.instancias?.map(({ instanceId, printed }) => [instanceId, printed]),
    ]),
  ]);
}

// Busca una unidad guardada tanto en líneas sueltas como dentro de promociones.
export function contieneInstancia(cesta, id) {
  const tieneId = (item) => item.instanceId === id || item.instancias?.some((instancia) => instancia.instanceId === id);
  return cesta.lista.some((item) => tieneId(item)
    || item.promocion?.grupos?.some((grupo) => grupo.some(tieneId)));
}
