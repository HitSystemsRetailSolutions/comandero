import { ref } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

export const getPromoArtPrintedCount = (sameIdItems) => {
  const allInstances = sameIdItems.flatMap((item) => item.instancias || []);
  const uniqueInstances = [];
  const seenIds = new Set();
  for (const inst of allInstances) {
    if (inst && inst.instanceId && !seenIds.has(inst.instanceId)) {
      seenIds.add(inst.instanceId);
      uniqueInstances.push(inst);
    }
  }
  if (uniqueInstances.length > 0) {
    return uniqueInstances.filter((inst) => inst.printed).length;
  }

  const printedValues = sameIdItems.map((item) => item.printed || 0);
  const allEqual = printedValues.every((val) => val === printedValues[0]);
  if (allEqual) {
    return printedValues[0] || 0;
  } else {
    return printedValues.reduce((sum, val) => sum + val, 0);
  }
};

export function usePreparation(store, selectedTable, SelectEmployer) {
  const isPreparing = ref(false);
  const isRefreshingPreparation = ref(false);
  let preparationRefresh = null;

  const refreshPreparation = () => {
    if (preparationRefresh) return preparationRefresh;
    const idCesta = selectedTable.value._id;
    if (!idCesta) return Promise.resolve();
    isRefreshingPreparation.value = true;
    preparationRefresh = store.dispatch("Tables/refreshSelectedTable", idCesta).finally(() => {
      preparationRefresh = null;
      isRefreshingPreparation.value = false;
    });
    return preparationRefresh;
  };

  const refreshOnResume = () => {
    if (document.visibilityState === "visible") {
      refreshPreparation().catch((error) => console.error("Error al actualizar la mesa:", error));
    }
  };

  const handleSendToPrepare = async () => {
    if (isPreparing.value || isRefreshingPreparation.value) return;
    isPreparing.value = true;
    try {
      await refreshPreparation();
      const ticketsWithPrinter = buildTicketsWithPrinter();
      await sendToPrepare(ticketsWithPrinter);
    } catch (error) {
      console.error("Error al actualizar la mesa:", error);
      Swal.fire("Oops...", "No se ha podido actualizar la mesa. Inténtalo de nuevo", "error");
    } finally {
      isPreparing.value = false;
    }
  };

  const buildTicketsWithPrinter = () => {
    let ticketsWithPrinter = [];
    for (let i = 0; i < selectedTable.value.lista.length; i++) {
      if (
        selectedTable.value.lista[i].impresora &&
        !selectedTable.value.lista[i].promocion &&
        !selectedTable.value.lista[i].articulosMenu &&
        selectedTable.value.lista[i].printed != selectedTable.value.lista[i].unidades
      ) {
        ticketsWithPrinter.push(selectedTable.value.lista[i]);
      }
      if (selectedTable.value.lista[i].promocion) {
        const promoItems = selectedTable.value.lista[i].promocion.grupos.flat();
        const uniqueArtIds = Array.from(new Set(promoItems.map((item) => item.idArticulo)));
        for (const artId of uniqueArtIds) {
          const sameIdItems = promoItems.filter((item) => item.idArticulo === artId);
          const totalUnitsRequiredPerPromo = sameIdItems.reduce((sum, item) => sum + (item.unidades || 0), 0);
          const totalRequired = totalUnitsRequiredPerPromo * selectedTable.value.lista[i].unidades;
          const printed = getPromoArtPrintedCount(sameIdItems);

          if (sameIdItems[0]?.impresora && printed < totalRequired) {
            const unprintedCount = totalRequired - printed;
            ticketsWithPrinter.push({
              ...sameIdItems[0],
              unidades: unprintedCount,
              printed: 0,
            });
          }
        }
      }
      if (
        selectedTable.value.lista[i].articulosMenu &&
        selectedTable.value.lista[i].articulosMenu.some((a) => a.impresora)
      ) {
        const menuPrinters = new Set();
        const itemsToProcess = [];

        for (let j = 0; j < selectedTable.value.lista[i].articulosMenu.length; j++) {
          let artMenu = selectedTable.value.lista[i].articulosMenu[j];
          if (artMenu.impresora) {
            let unprintedCount = 0;
            let instancesToPrint = null;

            if (artMenu.instancias && artMenu.instancias.length > 0) {
              instancesToPrint = artMenu.instancias.filter((inst) => !inst.printed);
              unprintedCount = instancesToPrint.length;
            } else if ((artMenu.printed || 0) < artMenu.unidades) {
              unprintedCount = artMenu.unidades - (artMenu.printed || 0);
            }

            if (unprintedCount > 0) {
              menuPrinters.add(artMenu.impresora);
              itemsToProcess.push({
                ...artMenu,
                unidades: unprintedCount,
                instancias: instancesToPrint,
                printed: 0,
              });
            }
          }
        }

        if (itemsToProcess.length > 0) {
          // Add a header for each printer
          menuPrinters.forEach((p) => {
            ticketsWithPrinter.push({
              nombre: `--- ${selectedTable.value.lista[i].nombre} ---`,
              unidades: 1,
              printed: 0,
              idArticulo: -1,
              impresora: p,
            });
          });
          // Add the items
          ticketsWithPrinter.push(...itemsToProcess);
        }
      }
    }
    return ticketsWithPrinter;
  };

  const sendToPrepare = async (ticketsWithPrinter) => {
    if (ticketsWithPrinter.length > 0) {
      try {
        // Imprimir y marcar como impreso van en una sola petición al backend
        const res = await axios.post("cestas/imprimirYMarcarComandero", {
          idCesta: selectedTable.value._id,
          products: ticketsWithPrinter,
          table: selectedTable.value.nombre || "TAULA: " + (selectedTable.value.indexMesa + 1),
          worker: SelectEmployer.value.nombreCorto,
          clients: selectedTable.value.comensales,
          articulos: ticketsWithPrinter.filter((item) => item.idArticulo !== -1).map((item) => item.idArticulo),
        });

        if (res.data) {
          try {
            await refreshPreparation();
          } catch (error) {
            console.error("Error al actualizar la mesa después de preparar:", error);
            Swal.fire("Comanda enviada", "No se ha podido actualizar la mesa. Actualízala antes de volver a preparar", "warning");
            return;
          }
          Swal.fire({
            icon: "success",
            title: "Se ha enviado el ticket a imprimir",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          throw new Error("Error al enviar a imprimir");
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire("Oops...", "No se ha podido enviar a imprimir", "error");
      }
    } else {
      Swal.fire({
        icon: "info",
        title: "No hay productos para enviar a imprimir",
        showConfirmButton: false,
        timer: 600,
      });
    }
  };

  return { handleSendToPrepare, isPreparing, isRefreshingPreparation, refreshOnResume };
}
