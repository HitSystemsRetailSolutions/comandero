<template>
  <MDBModal
    id="splitPaymentModal"
    tabindex="-1"
    labelledby="splitPaymentModal"
    v-model="modalOpen"
    :staticBackdrop="isProcessing"
    size="xl"
    class="split-payment-modal"
  >
    <MDBModalHeader class="split-modal-header">
      <div class="split-title">
        <div class="split-title-icon">
          <MDBIcon icon="divide" />
        </div>
        <div>
          <span class="split-title-main">Pago separado</span>
          <span class="split-title-sub">{{ currentTableName }}</span>
        </div>
      </div>
    </MDBModalHeader>

    <MDBModalBody class="split-modal-body">
      <div v-if="!isProcessing" class="split-workspace">
        <section class="split-panel">
          <div class="split-panel-header available">
            <div>
              <span class="split-panel-kicker">Mesa</span>
              <strong>Disponibles</strong>
            </div>
            <span class="split-count">{{ availableItems.length }}</span>
          </div>

          <div class="split-items-grid">
            <div
              v-for="(item, index) in availableItems"
              :key="item.pID"
              role="button"
              tabindex="0"
              class="split-item"
              :class="{
                promo: item.promocion,
                menu: item.articulosMenu,
                subitem: item.isSubItem,
              }"
              @click="addItem(item, index)"
              @keyup.enter="addItem(item, index)"
            >
              <span class="split-item-name">{{ item.nombre }}</span>
              <span class="split-item-price">{{ money(item.subtotal) }}</span>
              <span v-if="item.promocion" class="split-badge promo">Promo</span>
              <span v-else-if="item.articulosMenu" class="split-badge menu">
                Menú
              </span>
              <span v-else-if="item.isSubItem" class="split-badge part">
                Parte
              </span>
              <button
                v-if="item.promocion && !item.isSubItem"
                type="button"
                class="split-divide-btn"
                @click.stop="divideItem(item, index)"
              >
                <MDBIcon icon="columns" />
                Dividir
              </button>
            </div>
          </div>

          <div v-if="availableItems.length === 0" class="split-empty">
            <MDBIcon icon="check-double" />
            <span>Todo está seleccionado</span>
          </div>
        </section>

        <section class="split-panel ticket">
          <div class="split-panel-header selected">
            <div>
              <span class="split-panel-kicker">Cobro</span>
              <strong>Ticket actual</strong>
            </div>
            <MDBBtn
              v-if="selectedItems.length > 0"
              outline="danger"
              size="sm"
              class="split-clear-btn"
              @click="removeAll"
            >
              Limpiar
            </MDBBtn>
          </div>

          <div class="split-receipt">
            <div
              v-for="(item, index) in selectedItems"
              :key="`${item.pID}_selected_${index}`"
              class="split-receipt-row"
            >
              <button
                type="button"
                class="split-remove-btn"
                @click="removeItem(index)"
              >
                <MDBIcon icon="minus-circle" />
              </button>
              <span class="split-receipt-name">{{ item.nombre }}</span>
              <strong>{{ money(item.subtotal) }}</strong>
            </div>

            <div v-if="selectedItems.length === 0" class="split-empty receipt">
              <MDBIcon icon="shopping-basket" />
              <span>Selecciona artículos para este pago</span>
            </div>
          </div>

          <div class="split-total-box">
            <span>Total</span>
            <strong>{{ money(totalPrice) }}</strong>
          </div>
        </section>
      </div>

      <div v-else class="split-processing">
        <div class="split-spinner spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <span class="split-process-label">Procesando pago</span>
        <strong :class="paytefStatusClass">{{ procesoDatafono }}</strong>
      </div>
    </MDBModalBody>

    <MDBModalFooter class="split-modal-footer">
      <MDBBtn
        outline="dark"
        class="split-footer-btn"
        :disabled="isProcessing"
        @click="closeModal"
      >
        <MDBIcon icon="times" class="me-2" />
        Cerrar
      </MDBBtn>

      <div class="split-pay-actions">
        <MDBBtn
          color="success"
          class="split-footer-btn"
          :disabled="selectedItems.length === 0 || isProcessing"
          @click="checkout('EFECTIVO')"
        >
          <MDBIcon icon="money-bill-wave" class="me-2" />
          Efectivo
        </MDBBtn>
        <MDBBtn
          color="primary"
          class="split-footer-btn"
          :disabled="selectedItems.length === 0 || isProcessing"
          @click="checkout('DATAFONO_3G')"
        >
          <MDBIcon icon="credit-card" class="me-2" />
          Tarjeta
        </MDBBtn>
      </div>
    </MDBModalFooter>
  </MDBModal>
</template>

<script>
import {
  MDBBtn,
  MDBIcon,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
} from "mdb-vue-ui-kit";
import { computed, ref } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "CobroSeparadoMesas",
  components: {
    MDBBtn,
    MDBIcon,
    MDBModal,
    MDBModalBody,
    MDBModalFooter,
    MDBModalHeader,
  },
  emits: ["paid"],
  setup(_props, { emit, expose }) {
    const store = useStore();
    const modalOpen = ref(false);
    const isProcessing = ref(false);
    const currentTable = ref(null);
    const selectedItems = ref([]);
    const availableItems = ref([]);
    const createdTicketId = ref(null);

    const selectedEmployer = computed(
      () => store.state.Employers.selectedEmployer,
    );
    const estadoDatafono = computed(() => store.state.Datafono.estado);
    const procesoDatafono = computed(() => store.state.Datafono.procesoActual);
    const paytefStatusClass = computed(() => {
      if (estadoDatafono.value === "APROBADA") return "status-approved";
      if (estadoDatafono.value === "DENEGADA") return "status-denied";
      if (estadoDatafono.value === "PERDIDA") return "status-lost";
      return "status-pending";
    });
    const totalPrice = computed(() =>
      roundMoney(selectedItems.value.reduce((sum, item) => sum + item.subtotal, 0)),
    );
    const currentTableName = computed(() => {
      if (!currentTable.value) return "";
      return (
        currentTable.value.nombre ||
        `Mesa ${(currentTable.value.indexMesa ?? 0) + 1}`
      );
    });

    function roundMoney(value) {
      return Math.round((Number(value) || 0) * 100) / 100;
    }

    function money(value) {
      return `${roundMoney(value).toFixed(2)}€`;
    }

    function initItems(table) {
      const initial = [];
      table.lista.forEach((item, parentIndex) => {
        if (item.pagado) return;

        const units = item.unidades || 1;
        for (let unitIndex = 0; unitIndex < units; unitIndex++) {
          const instance = item.instancias?.[unitIndex] || {};
          initial.push({
            ...item,
            instancias: [
              {
                instanceId: instance.instanceId,
                printed: instance.printed,
              },
            ],
            unidades: 1,
            unitIndex,
            subtotal: roundMoney((item.subtotal || 0) / units),
            parentIndex,
            instanceId: instance.instanceId,
            printed: instance.printed,
            pID: `${parentIndex}_${unitIndex}`,
            originalParent: JSON.parse(JSON.stringify(item)),
          });
        }
      });
      availableItems.value = initial;
    }

    function openModal(table) {
      currentTable.value = table;
      selectedItems.value = [];
      availableItems.value = [];
      createdTicketId.value = null;
      initItems(table);
      modalOpen.value = true;
    }

    function closeModal() {
      if (isProcessing.value) return;
      modalOpen.value = false;
    }

    function addItem(item, index) {
      availableItems.value.splice(index, 1);
      selectedItems.value.push(item);
    }

    function removeItem(index) {
      const item = selectedItems.value[index];
      selectedItems.value.splice(index, 1);
      availableItems.value.push(item);
    }

    function removeAll() {
      while (selectedItems.value.length > 0) removeItem(0);
    }

    async function getSubItems(item) {
      const subItems = [];
      const parts = item.promocion
        ? item.promocion.grupos.flat()
        : item.articulosMenu || [];

      if (parts.length === 0) return subItems;

      const idsArticulos = parts.map((part) => part.idArticulo);
      const pricesMap = {};

      try {
        const res = await axios.post("articulos/getArticulosByIds", {
          idsArticulos,
        });
        if (Array.isArray(res.data)) {
          res.data.forEach((article) => {
            pricesMap[article._id] = article.precioConIva;
          });
        }
      } catch {
        // El backend principal usa precios de fallback si no puede obtenerlos.
      }

      const totalUnits = parts.reduce((sum, part) => sum + (part.unidades || 1), 0);

      parts.forEach((part) => {
        const fallbackPrice = item.promocion
          ? part.precioPromoPorUnidad || item.subtotal / totalUnits
          : item.subtotal / totalUnits;
        const unitPrice =
          pricesMap[part.idArticulo] !== undefined
            ? pricesMap[part.idArticulo]
            : fallbackPrice;
        const numUnits = part.unidades || 1;

        for (let unit = 0; unit < numUnits; unit++) {
          const parentUnitIndex = item.unitIndex ?? 0;
          const instanceIndex = parentUnitIndex * numUnits + unit;
          const instance = part.instancias?.[instanceIndex] || {};
          let inheritedSupplements = null;

          if (Array.isArray(part.suplementosPorArticulo)) {
            inheritedSupplements =
              part.suplementosPorArticulo[instanceIndex]?.suplementos || null;
          }

          subItems.push({
            ...part,
            instanceId: instance.instanceId || part.instanceId,
            printed: instance.printed || part.printed || false,
            instancias: [
              {
                instanceId: instance.instanceId || part.instanceId,
                printed: instance.printed || part.printed || false,
              },
            ],
            subtotal: roundMoney(unitPrice),
            precioTecla: roundMoney(unitPrice),
            precioManual: true,
            unidades: 1,
            parentIndex: item.parentIndex,
            pID: `${item.pID}_sub_${part.idArticulo}_${unit}`,
            isSubItem: true,
            originalParent: item.originalParent,
            arraySuplementos: inheritedSupplements || part.arraySuplementos || null,
          });
        }
      });

      return subItems;
    }

    async function divideItem(item, index) {
      const subItems = await getSubItems(item);
      if (subItems.length > 0) availableItems.value.splice(index, 1, ...subItems);
    }

    function cleanForBackend(items) {
      return items.map((item) => {
        const { parentIndex, pID, isSubItem, originalParent, ...clean } = item;
        if (isSubItem) {
          clean.precioManual = true;
          clean.precioTecla = item.subtotal;
        }
        return clean;
      });
    }

    async function createSplitBasket() {
      const res = await axios.post("cestas/PagarPorSeparado", {
        articulos: cleanForBackend(selectedItems.value),
      });
      if (!res.data) throw new Error("No se ha podido crear el pago separado");
      await axios.post("cestas/cambiarCestaTrabajador", {
        idCesta: res.data,
        idTrabajador: selectedEmployer.value._id,
      });
      return res.data;
    }

    async function removeSelectedFromOriginal() {
      const originalCestaId = currentTable.value._id;
      const affectedIndices = Array.from(
        new Set(selectedItems.value.map((item) => item.parentIndex)),
      ).sort((a, b) => b - a);

      for (const parentIndex of affectedIndices) {
        await axios.post("cestas/borrarItemCesta", {
          idCesta: originalCestaId,
          index: parentIndex,
          rules: {
            imprimirTicketCancelacion: false,
          },
        });

        const remaining = availableItems.value.filter(
          (item) => item.parentIndex === parentIndex,
        );
        const explodedRemaining = [];

        for (const item of remaining) {
          if (
            (item.promocion || item.articulosMenu?.length > 0) &&
            !item.isSubItem
          ) {
            const subItems = await getSubItems(item);
            explodedRemaining.push(...(subItems.length > 0 ? subItems : [item]));
          } else {
            explodedRemaining.push(item);
          }
        }

        for (const item of explodedRemaining) {
          const isMenu = !!item.articulosMenu;
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: item.idArticulo,
            gramos: item.gramos || 0,
            idCesta: originalCestaId,
            unidades: 1,
            arraySuplementos: !isMenu ? item.arraySuplementos : null,
            articulosMenu: isMenu ? item.articulosMenu : null,
            nombre: item.nombre,
            menu: "COBRO_SEPARADO",
            precioManual: item.precioManual || false,
            precioTecla: item.precioTecla || item.subtotal,
            instancia: {
              printed: item.printed,
              instanceId: item.instanceId,
            },
          });
        }
      }
    }

    async function cobrarEfectivo(idCesta, tipo) {
      const resultado = await axios.post("tickets/crearTicket", {
        tipoTicket: "NORMAL",
        total: totalPrice.value,
        idCesta,
        idTrabajador: selectedEmployer.value._id,
        tipo,
        tkrsData: {
          cantidadTkrs: 0,
          formaPago: "EFECTIVO",
        },
      });

      if (!resultado.data) throw new Error("No se ha podido crear el ticket");
    }

    async function cobrarPaytef(idCesta) {
      store.dispatch("Datafono/setEstado", "PENDIENTE");
      const resultado = await axios.post("tickets/crearTicketPaytef", {
        tipoTicket: "PAYTEF",
        total: totalPrice.value,
        idCesta,
        idTrabajador: selectedEmployer.value._id,
        tipo: "TARJETA",
        tkrsData: {
          cantidadTkrs: 0,
          formaPago: "EFECTIVO",
        },
      });

      if (!resultado.data) throw new Error("Pago con datáfono inválido");
    }

    async function charge(idCesta, method) {
      if (method === "DATAFONO_3G") {
        try {
          const res = await axios.post("parametros/getParametros");
          const params = res.data;
          if (params?.tipoDatafono === "3G" || params?.ipTefpay === "0.0.0.0") {
            await cobrarEfectivo(idCesta, "DATAFONO_3G");
          } else {
            await cobrarPaytef(idCesta);
          }
        } catch (err) {
          if (err.message === "Pago con datáfono inválido") throw err;
          await cobrarEfectivo(idCesta, "DATAFONO_3G");
        }
      } else {
        await cobrarEfectivo(idCesta, method);
      }
    }

    async function loadLastTicket() {
      const res = await axios.post("tickets/getUltimoTicket");
      createdTicketId.value = res.data?.[0]?._id || null;
    }

    async function offerPrintTicket() {
      const result = await Swal.fire({
        title: "¿Imprimir ticket?",
        text: "Se imprimirá el recibo de este pago separado.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, imprimir",
        cancelButtonText: "No",
      });

      if (result.isConfirmed && createdTicketId.value) {
        await axios.post("impresora/imprimirTicket", {
          idTicket: createdTicketId.value,
        });
      }
    }

    async function cleanupSplitBasket(idCesta) {
      if (!idCesta) return;
      try {
        await axios.post("cestas/fulminarCesta", { idCesta });
      } catch {
        // Si el backend ya la ha finalizado, no hay nada que limpiar.
      }
    }

    async function checkout(method) {
      if (selectedItems.value.length === 0 || isProcessing.value) return;

      let splitBasketId = null;
      isProcessing.value = true;

      try {
        splitBasketId = await createSplitBasket();
        await charge(splitBasketId, method);

        await loadLastTicket();
        await removeSelectedFromOriginal();
        modalOpen.value = false;
        await deleteCesta(splitBasketId);

        await offerPrintTicket();
        Swal.fire({
          icon: "success",
          title: "Pago separado registrado",
          showConfirmButton: false,
          timer: 1200,
        });
        emit("paid");
      } catch (err) {
        await cleanupSplitBasket(splitBasketId);
        Swal.fire("Oops...", err.message, "error");
      } finally {
        isProcessing.value = false;
        createdTicketId.value = null;
      }
    }

    async function deleteCesta(idCesta) {
      try {
        await axios.post("cestas/fulminarCesta", {
          idCesta: idCesta,
        });
        await axios.post("cestas/cambiarCestaTrabajador", {
          idCesta: currentTable.value._id,
          idTrabajador: selectedEmployer.value._id,
        });
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Error al eliminar la cesta utilizada.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
    expose({ openModal, abrirModal: openModal });

    return {
      modalOpen,
      isProcessing,
      currentTableName,
      availableItems,
      selectedItems,
      totalPrice,
      procesoDatafono,
      paytefStatusClass,
      money,
      addItem,
      removeItem,
      removeAll,
      divideItem,
      closeModal,
      checkout,
    };
  },
};
</script>

<style lang="scss" scoped>
.split-payment-modal {
  :deep(.modal-dialog) {
    max-width: min(1180px, calc(100vw - 24px));
    max-height: calc(100dvh - 24px);
  }

  :deep(.modal-content) {
    max-height: calc(100dvh - 24px);
    display: flex;
    flex-direction: column;
    border: 0;
    border-radius: 18px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  }
}

.split-modal-header,
.split-modal-footer {
  flex: 0 0 auto;
  background: white;
  border-color: #e2e8f0;
  padding: 16px 20px;
}

.split-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.split-title-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff7ed;
  color: #f97316;
  font-size: 1.25rem;
}

.split-title-main,
.split-title-sub {
  display: block;
}

.split-title-main {
  font-weight: 900;
  color: #172033;
  font-size: 1.25rem;
}

.split-title-sub {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
}

.split-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
}

.split-workspace {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
  gap: 14px;
  height: min(68dvh, 650px);
  overflow: hidden;
}

.split-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.split-panel-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;

  &.available {
    background: #eff6ff;
    color: #1d4ed8;
  }

  &.selected {
    background: #ecfdf5;
    color: #047857;
  }
}

.split-panel-kicker {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.split-count {
  min-width: 34px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: white;
  font-weight: 900;
}

.split-items-grid {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  grid-auto-rows: 92px;
  gap: 8px;
}

.split-item {
  position: relative;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #3b82f6;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
  }

  &.promo {
    border-left: 5px solid #f59e0b;
  }

  &.menu {
    border-left: 5px solid #3b82f6;
  }

  &.subitem {
    background: #f8fafc;
    border-style: dashed;
  }
}

.split-item-name {
  color: #1e293b;
  font-weight: 800;
  font-size: 0.86rem;
  line-height: 1.15;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.split-item-price {
  color: #059669;
  font-weight: 900;
  font-size: 0.95rem;
}

.split-badge {
  position: absolute;
  right: 8px;
  top: 7px;
  border-radius: 6px;
  padding: 1px 5px;
  font-size: 0.56rem;
  font-weight: 900;

  &.promo {
    background: #fef3c7;
    color: #92400e;
  }

  &.menu {
    background: #dbeafe;
    color: #1e40af;
  }

  &.part {
    background: #e2e8f0;
    color: #475569;
  }
}

.split-divide-btn {
  position: absolute;
  left: 6px;
  top: 6px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  padding: 0 7px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f59e0b;
  color: white;
  font-weight: 800;
  font-size: 0.68rem;
}

.split-receipt {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 10px 12px;
  background: linear-gradient(#fff, #fff) padding-box,
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 26px,
      rgba(148, 163, 184, 0.18) 27px
    );
}

.split-receipt-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dotted #cbd5e1;
  font-weight: 700;
}

.split-remove-btn {
  border: 0;
  background: transparent;
  color: #dc2626;
  padding: 0;
  font-size: 1rem;
}

.split-receipt-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #334155;
}

.split-total-box {
  flex: 0 0 auto;
  margin: 10px;
  padding: 11px 14px;
  border-radius: 12px;
  background: #f0fdf4;
  border: 2px dashed rgba(5, 150, 105, 0.28);
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    color: #475569;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    color: #059669;
    font-size: 1.45rem;
    font-weight: 900;
  }
}

.split-empty {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-weight: 800;
  text-align: center;

  .fa,
  svg,
  i {
    font-size: 2rem;
  }

  &.receipt {
    height: 100%;
  }
}

.split-modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.split-pay-actions {
  display: flex;
  gap: 10px;
}

.split-footer-btn {
  border-radius: 12px !important;
  font-weight: 900 !important;
  text-transform: none !important;
}

.split-processing {
  height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
}

.split-spinner {
  width: 58px;
  height: 58px;
  border-width: 4px;
}

.split-process-label {
  color: #64748b;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.status-approved {
  color: #059669;
}

.status-denied {
  color: #dc2626;
}

.status-lost,
.status-pending {
  color: #f97316;
}

@media (max-width: 900px) {
  .split-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
    height: 72vh;
  }

  .split-panel {
    min-height: 0;
  }

  .split-panel.ticket {
    min-height: 210px;
  }
}

@media (max-width: 576px) {
  .split-payment-modal {
    :deep(.modal-dialog) {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
      overflow: hidden;
    }

    :deep(.modal-content) {
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
      background: #f8fafc;
      box-shadow: none;
    }

    :deep(.modal-body) {
      overflow: hidden;
    }
  }

  .split-modal-header,
  .split-modal-footer {
    padding: 8px 10px;
  }

  .split-modal-body {
    min-height: 0;
    flex: 1;
    padding: 6px;
  }

  .split-title {
    gap: 8px;
  }

  .split-title-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    font-size: 0.95rem;
  }

  .split-title-main {
    font-size: 1rem;
    line-height: 1.1;
  }

  .split-title-sub {
    font-size: 0.78rem;
  }

  .split-workspace {
    grid-template-rows: minmax(0, 1fr) minmax(132px, 27vh);
    gap: 6px;
    height: 100%;
  }

  .split-panel {
    border: 0;
    border-radius: 8px;
    box-shadow: none;
  }

  .split-panel-header {
    padding: 7px 9px;
    border-bottom: 1px solid #e5e7eb;

    &.available,
    &.selected {
      background: #ffffff;
    }

    strong {
      font-size: 0.9rem;
    }
  }

  .split-panel-kicker {
    font-size: 0.62rem;
  }

  .split-count {
    min-width: 28px;
    height: 24px;
    font-size: 0.82rem;
    background: #eff6ff;
  }

  .split-items-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 72px;
    gap: 5px;
    padding: 6px;
  }

  .split-item {
    border: 0;
    border-radius: 8px;
    padding: 7px 5px 5px;
    gap: 2px;
    box-shadow: inset 0 0 0 1px #e5e7eb;

    &:hover {
      transform: none;
      box-shadow: inset 0 0 0 1px #3b82f6;
    }

    &.promo,
    &.menu {
      border-left: 0;
    }
  }

  .split-item-name {
    font-size: 0.72rem;
    line-height: 1.08;
  }

  .split-item-price {
    font-size: 0.78rem;
  }

  .split-badge {
    right: 4px;
    top: 4px;
    padding: 0 4px;
    font-size: 0.48rem;
  }

  .split-divide-btn {
    left: 4px;
    top: 4px;
    height: 20px;
    padding: 0 5px;
    font-size: 0.55rem;
    gap: 3px;
  }

  .split-receipt {
    padding: 5px 8px;
    background: white;
  }

  .split-receipt-row {
    gap: 6px;
    padding: 5px 0;
    font-size: 0.78rem;
  }

  .split-remove-btn {
    font-size: 0.9rem;
  }

  .split-total-box {
    margin: 6px;
    padding: 7px 9px;
    border: 0;
    border-radius: 8px;

    span {
      font-size: 0.72rem;
    }

    strong {
      font-size: 1.05rem;
    }
  }

  .split-clear-btn {
    padding: 3px 8px !important;
    font-size: 0.7rem !important;
    border-radius: 8px !important;
  }

  .split-empty {
    min-height: 80px;
    gap: 5px;
    font-size: 0.78rem;

    .fa,
    svg,
    i {
      font-size: 1.2rem;
    }
  }

  .split-modal-footer,
  .split-pay-actions {
    width: auto;
    flex-direction: row;
  }

  .split-modal-footer {
    align-items: stretch;
    gap: 6px;
  }

  .split-pay-actions {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .split-footer-btn {
    width: 100%;
    min-height: 38px;
    padding: 6px 8px !important;
    border-radius: 9px !important;
    font-size: 0.82rem !important;
  }
}
</style>
