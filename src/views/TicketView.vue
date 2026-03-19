<template>
  <EditProductModal
    v-model="openEditProductModal"
    :index="EditProductModalInfo"
  />

  <!-- Modal de método de pago -->
  <MDBModal
    id="paymentModal"
    tabindex="-1"
    labelledby="paymentModal"
    v-model="paymentModal"
    :staticBackdrop="true"
    size="lg"
    class="premium-modal payment-modal"
  >
    <MDBModalHeader class="modal-header-premium">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="credit-card" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="modal-main-title">Finalizar Venta</span>
          <span class="modal-subtitle">Selecciona el método de pago</span>
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium">
      <div class="payment-glass-container">
        <!-- Resumen del Total -->
        <div class="payment-summary-card">
          <div class="summary-label">TOTAL A COBRAR</div>
          <div class="summary-value">
            {{
              selectedTable.detalleIva
                ? (
                    selectedTable.detalleIva.importe1 +
                    selectedTable.detalleIva.importe2 +
                    selectedTable.detalleIva.importe3 +
                    selectedTable.detalleIva.importe4 +
                    selectedTable.detalleIva.importe5
                  ).toFixed(2)
                : "0.00"
            }}€
          </div>
        </div>

        <!-- Métodos de Pago Grid -->
        <div class="methods-grid">
          <div class="method-card cash" @click="cobrar('EFECTIVO')">
            <div class="method-icon-box">
              <MDBIcon icon="money-bill-wave" />
            </div>
            <div class="method-info">
              <span class="method-name">Efectivo</span>
              <span class="method-hint">Pago rápido en metálico</span>
            </div>
            <MDBIcon icon="chevron-right" class="method-arrow" />
          </div>

          <div class="method-card credit-card" @click="cobrar('DATAFONO_3G')">
            <div class="method-icon-box">
              <MDBIcon icon="credit-card" />
            </div>
            <div class="method-info">
              <span class="method-name">Tarjeta / Datafono</span>
              <span class="method-hint">Pago electrónico seguro</span>
            </div>
            <MDBIcon icon="chevron-right" class="method-arrow" />
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-premium">
      <MDBBtn
        outline="primary"
        @click="paymentModal = false"
        class="premium-cancel-btn"
      >
        <MDBIcon icon="times" class="me-2" /> Cancelar
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <!-- Modal de imprimir ticket -->
  <MDBModal
    id="printTicketModal"
    tabindex="-1"
    labelledby="printTicketModal"
    v-model="printTicketModal"
    :staticBackdrop="true"
    class="premium-modal print-ticket-modal"
  >
    <MDBModalHeader class="modal-header-premium">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="receipt" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="modal-main-title">Ticket de Venta</span>
          <span class="modal-subtitle">Confirmación de impresión</span>
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium">
      <div class="print-glass-container text-center py-4">
        <div class="print-big-icon-wrapper mb-4">
          <MDBIcon icon="print" class="print-big-icon" />
        </div>
        <h4 class="print-question-title">¿Deseas imprimir el ticket?</h4>
        <p class="print-question-desc">
          Se generará el recibo físico para el cliente
        </p>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-premium justify-content-center">
      <MDBBtn
        outline="danger"
        @click="handleSkipPrint"
        class="premium-skip-btn me-3"
      >
        <MDBIcon icon="times" class="me-2" /> No, gracias
      </MDBBtn>
      <MDBBtn
        color="success"
        @click="handlePrintTicket"
        class="premium-print-btn"
      >
        <MDBIcon icon="print" class="me-2" /> Sí, imprimir
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <!-- Modal de traspasar mesa -->
  <MDBModal
    id="transferModal"
    tabindex="-1"
    labelledby="transferModal"
    v-model="transferModal"
    :staticBackdrop="true"
    size="xl"
    class="premium-modal transfer-modal"
  >
    <MDBModalHeader class="modal-header-premium">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="exchange-alt" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="modal-main-title">Traspasar Ticket</span>
          <span class="modal-subtitle">Cambiar productos a otra mesa</span>
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium">
      <div class="transfer-glass-container">
        <!-- Info de Origen -->
        <div class="transfer-source-card mb-4">
          <div class="source-item">
            <span class="source-label">Mesa Actual</span>
            <span class="source-value">{{
              selectedTable.nombre || `Mesa ${selectedTable.indexMesa + 1}`
            }}</span>
          </div>
          <div class="source-separator">
            <MDBIcon icon="arrow-right" />
          </div>
          <div class="source-item">
            <span class="source-label">Elementos</span>
            <span class="source-value"
              >{{ selectedTable.lista.length }} artículos</span
            >
          </div>
        </div>

        <div class="selection-section-title mb-3">
          <MDBIcon icon="th" class="me-2" />
          Selecciona la mesa de destino
        </div>

        <!-- Grid de Mesas Destino -->
        <div class="transfer-tables-grid">
          <div
            v-for="table in availableTables"
            :key="table._id"
            class="transfer-table-card"
            :class="{
              selected: selectedTargetTable?._id === table._id,
              'has-items': table.lista && table.lista.length > 0,
            }"
            @click="selectTargetTable(table)"
          >
            <div class="table-card-icon">
              <MDBIcon
                :icon="
                  table.lista && table.lista.length > 0 ? 'utensils' : 'table'
                "
              />
            </div>
            <div class="table-card-info">
              <span class="table-card-name">{{
                table.nombre || `Mesa ${table.indexMesa + 1}`
              }}</span>
              <span class="table-card-status">
                {{
                  table.lista && table.lista.length > 0
                    ? `${table.lista.length} uds`
                    : "Libre"
                }}
              </span>
            </div>
            <div
              v-if="selectedTargetTable?._id === table._id"
              class="selection-check"
            >
              <MDBIcon icon="check-circle" />
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-premium">
      <MDBBtn
        outline="primary"
        @click="
          transferModal = false;
          selectedTargetTable = null;
        "
        class="premium-cancel-btn me-3"
      >
        <MDBIcon icon="times" class="me-2" /> Cancelar
      </MDBBtn>
      <MDBBtn
        color="warning"
        @click="confirmTransfer"
        :disabled="!selectedTargetTable"
        class="premium-confirm-btn"
      >
        <MDBIcon icon="check" class="me-2" /> Confirmar Traspaso
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <!-- Contenido principal -->
  <!-- Contenido principal -->
  <div class="unified-layout">
    <!-- Header: Trabajador | Mesa | Comensales -->
    <div class="top-header">
      <div class="header-item" @click="selectOtherEmployer">
        <MDBIcon icon="user-tag" class="header-icon" />
        <span class="header-text">{{ SelectEmployer.nombre }}</span>
      </div>
      <div class="header-item" @click="selectOtherTable">
        <MDBIcon icon="table" class="header-icon" />
        <span class="header-text">
          <span class="room-pill">{{ currentSalaName }}</span>
          <br />
          <span class="table-text">
            {{
              selectedTable.nombre
                ? selectedTable.nombre
                : "Mesa " + (selectedTable.indexMesa + 1)
            }}
          </span>
        </span>
      </div>
      <div class="header-item" @click="changeClients">
        <MDBIcon icon="users" class="header-icon" />
        <span class="header-text"
          >{{ selectedTable.comensales }} comensales</span
        >
      </div>
    </div>

    <!-- Breadcrumb: Volver | Título | Acción rápida -->
    <div class="breadcrumb-container">
      <div class="breadcrumb-left" @click="router.back()">
        <MDBIcon icon="arrow-left" class="back-icon" />
        <span class="breadcrumb-text">Resumen de Ticket</span>
      </div>
      <MDBBtn
        size="sm"
        color="primary"
        class="ms-auto prepare-btn-badge"
        @click="handleSendToPrepare"
        :disabled="selectedTable.lista.length == 0"
      >
        <MDBIcon icon="print" class="me-1" />
        Preparar
      </MDBBtn>
    </div>

    <!-- Lista de productos (Grid de tarjetas) -->
    <div class="products-grid-container ticket-grid-layout">
      <!-- Estado vacío -->
      <div v-if="selectedTable.lista.length == 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <MDBIcon icon="shopping-basket" />
        </div>
        <div class="empty-text">El ticket está vacío</div>
        <div class="empty-subtext">
          Vuelve a productos para añadir artículos
        </div>
      </div>

      <!-- Tarjetas de productos -->
      <div
        v-for="(x, i) in selectedTable.lista"
        :key="i"
        class="product-grid-item ticket-card-item"
        :class="{ selected: actProd == i }"
        @click="selectProduct(i)"
        @dblclick="openEditProduct(i)"
      >
        <div class="ticket-item-main">
          <div class="item-top-row">
            <div class="item-qty-container">
              <span class="item-quantity">x{{ x.unidades }}</span>
              <MDBIcon
                v-if="
                  x.impresora ||
                  (x.promocion &&
                    x.promocion.grupos.flat().some((a) => a.impresora))
                "
                icon="print"
                class="status-icon-inline"
                :class="{
                  'printed-success': x.promocion
                    ? x.promocion.grupos
                        .flat()
                        .every((a) => a.printed >= a.unidades)
                    : x?.printed == x.unidades,
                }"
              />
            </div>
            <span class="item-name-text">{{ x.nombre }}</span>
            <span class="item-price-text">{{ x.subtotal.toFixed(2) }}€</span>
          </div>
          <div v-if="x.comentario" class="item-comment-text">
            {{ x.comentario }}
          </div>

          <!-- Detalles (Suplementos, promos, menús) -->
          <div
            class="item-secondary-details"
            v-if="x.arraySuplementos?.length || x.promocion || x.articulosMenu"
          >
            <!-- Suplementos normales -->
            <div v-if="x.arraySuplementos" class="nested-details">
              <div
                v-for="(z, y) in x.arraySuplementos"
                :key="y"
                class="detail-row"
              >
                <MDBIcon icon="level-up-alt" class="detail-icon" />
                <span>{{ z.nombre }}</span>
              </div>
            </div>

            <!-- Menús -->
            <div v-if="x.articulosMenu" class="nested-details">
              <div
                v-for="(z, y) in x.articulosMenu"
                :key="y"
                class="detail-row"
              >
                <MDBIcon icon="utensils" class="detail-icon menu-icon" />
                <span>{{ z.nombre }}</span>
                <div v-if="z.comentario" class="menu-item-comment-text">
                  {{ z.comentario }}
                </div>
                <MDBIcon
                  v-if="z.impresora"
                  icon="print"
                  class="status-icon-inline"
                  :class="{
                    'printed-success': z.instancias
                      ? z.instancias.every((inst) => inst.printed)
                      : z.printed >= z.unidades,
                  }"
                />
              </div>
            </div>

            <!-- Promociones: articulos de la promo -->
            <div v-if="x.promocion" class="nested-details promo-details">
              <template v-for="(grupo, gi) in x.promocion.grupos" :key="gi">
                <div
                  v-for="(art, ai) in grupo"
                  :key="ai"
                  class="detail-row promo-article-row"
                >
                  <MDBIcon icon="tag" class="detail-icon promo-icon" />
                  <span>{{ art.unidades }}x {{ art.nombre }}</span>
                  <MDBIcon
                    v-if="art.impresora"
                    icon="print"
                    class="status-icon-inline"
                    :class="{ 'printed-success': art.printed >= art.unidades }"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Total | Acciones -->
    <div class="unified-footer">
      <div class="total-summary-card">
        <div class="total-info-group">
          <span class="total-shoutout">Total a Cobrar</span>
          <span class="total-value-big">
            {{
              selectedTable.detalleIva
                ? (
                    selectedTable.detalleIva.importe1 +
                    selectedTable.detalleIva.importe2 +
                    selectedTable.detalleIva.importe3 +
                    selectedTable.detalleIva.importe4 +
                    selectedTable.detalleIva.importe5
                  ).toFixed(2)
                : "0.00"
            }}€
          </span>
        </div>
      </div>

      <div class="action-buttons-group">
        <MDBBtn
          color="warning"
          class="footer-action-btn transfer-btn"
          @click="transferModal = true"
          :disabled="selectedTable.lista.length == 0"
        >
          <MDBIcon icon="exchange-alt" class="me-1" />
          Traspasar
        </MDBBtn>
        <MDBBtn
          color="success"
          class="footer-action-btn checkout-btn"
          @click="paymentModal = true"
          :disabled="selectedTable.lista.length == 0"
        >
          <MDBIcon icon="cash-register" class="me-2" />
          COBRAR TICKET
        </MDBBtn>
      </div>
    </div>
  </div>
</template>

<script>
import {
  MDBBtn,
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
  MDBTable,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";
import Swal from "sweetalert2";
import axios from "axios";
import EditProductModal from "@/components/EditProductModal.vue";
import MenuModal from "@/components/MenuModal.vue";
export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBTable,
    MDBListGroup,
    MDBListGroupItem,
    MDBBtn,
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
    MenuModal,
    EditProductModal,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer,
    );
    const hideInfo = ref(false);
    const tables = computed(() => store.state.Tables.arrayTables);
    let selectedTable = computed(() => store.state.Tables.selectedTable);
    const actualPage = computed(() => route.currentRoute.value.path);
    const openEditProductModal = ref(false);
    const paymentModal = ref(false);
    const printTicketModal = ref(false);
    const lastCreatedTicketId = ref(null);
    const transferModal = ref(false);
    const EditProductModalInfo = ref(-1);
    const actProd = ref(null);
    const lastClickTime = ref(0);
    const selectedTargetTable = ref(null);
    const currentSalaName = computed(() => {
      const id = store.state.Tables.salaId;
      const list = store.state.Tables.salas;
      const found = list.find((s) => s.id === id);
      return found ? found.name : id === "MESAS" ? "Principal" : id;
    });

    // menu
    const menuArticles = ref(null);

    const suplByFamily = computed(() => {
      const grupos = {};
      if (!menuArticles.value) return grupos;
      menuArticles.value.forEach((sup) => {
        const familia = sup.familia || "Sin familia";
        if (!grupos[familia]) grupos[familia] = [];
        grupos[familia].push(sup);
      });
      // Ordenar familias alfabéticamente y los suplementos dentro de cada familia
      const familiasOrdenadas = Object.keys(grupos).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      const resultado = {};
      familiasOrdenadas.forEach((fam) => {
        resultado[fam] = grupos[fam].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, undefined, { sensitivity: "base" }),
        );
      });
      return resultado;
    });

    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    // Computed para mesas disponibles (excluyendo la mesa actual)
    const availableTables = computed(() => {
      return tables.value.filter(
        (table) => table._id !== selectedTable.value._id,
      );
    });

    // Función para seleccionar mesa destino
    const selectTargetTable = (table) => {
      selectedTargetTable.value = table;
    };

    // Función para confirmar el traspaso
    const confirmTransfer = async () => {
      if (!selectedTargetTable.value) return;

      // Si la mesa destino tiene productos, mostrar advertencia
      if (
        selectedTargetTable.value.lista &&
        selectedTargetTable.value.lista.length > 0
      ) {
        const result = await Swal.fire({
          title: "¡Atención!",
          text: `La mesa "${
            selectedTargetTable.value.nombre ||
            `Mesa ${selectedTargetTable.value.indexMesa + 1}`
          }" ya tiene productos. Debes vaciarla primero antes de traspasar.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Entendido",
          cancelButtonText: "Cancelar",
        });
        return;
      }

      try {
        // Confirmar el traspaso
        const result = await Swal.fire({
          title: "¿Confirmar traspaso?",
          text: `¿Estás seguro de traspasar todos los productos a "${
            selectedTargetTable.value.nombre ||
            `Mesa ${selectedTargetTable.value.indexMesa + 1}`
          }"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, traspasar",
          cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
          // Realizar el traspaso
          await axios.post("cestas/traspasarProductos", {
            idCestaOrigen: selectedTable.value._id,
            idCestaDestino: selectedTargetTable.value._id,
            idTrabajador: SelectEmployer.value._id,
          });

          // Cerrar modal y limpiar selección
          transferModal.value = false;
          selectedTargetTable.value = null;

          // Mostrar mensaje de éxito
          Swal.fire({
            icon: "success",
            title: "Traspaso realizado",
            text: "Los productos se han traspasado correctamente",
            showConfirmButton: false,
            timer: 1500,
          });

          // Redirigir a selección de mesa
          router.push("/tableselection");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "No se pudo realizar el traspaso",
        });
      }
    };

    const addProduct = async (x, i, printedStatus) => {
      await axios.post("teclado/clickTeclaArticulo", {
        idArticulo: x.idArticulo,
        gramos: x.gramos ?? 0,
        idCesta: selectedTable.value._id,
        unidades: 1,
        arraySuplementos: x.arraySuplementos ?? null,
        nombre: x.nombre,
        menu: "",
      });
      return true;
    };

    const restProduct = async (x, i, printedStatus) => {
      let z = selectedTable.value.lista.filter(
        (products) =>
          products.idArticulo == x.idArticulo &&
          JSON.stringify(products.arraySuplementos) ==
            JSON.stringify(x.arraySuplementos),
      );
      if (z.length > 0) {
        if (z[0].unidades > 1) {
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticulo,
            gramos: x.gramos ?? 0,
            idCesta: selectedTable.value._id,
            unidades: -1,
            arraySuplementos: x.arraySuplementos ?? null,
            nombre: x.nombre,
            menu: "",
          });
        }
      }
    };

    const changeClients = async () => {
      let res = await axios
        .post("/cestas/setClients", {
          clients: 0,
          cesta: selectedTable.value._id,
        })
        .then((res) => {
          setTimeout(() => {
            router.push("/clientsInTableSelection");
          }, 10);
        });
    };

    const removeProduct = async (x, i) => {
      actProd.value = null;
      let z = selectedTable.value.lista.filter(
        (products) =>
          products.idArticulo == x.idArticulo &&
          JSON.stringify(products.arraySuplementos) ==
            JSON.stringify(x.arraySuplementos),
      );
      await store.dispatch("Tables/removeProduct", EditProductModalInfo.value);
      return x;
    };

    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const getTotal = () => {
      return (
        selectedTable.value.detalleIva.importe1 +
        selectedTable.value.detalleIva.importe2 +
        selectedTable.value.detalleIva.importe3 +
        selectedTable.value.detalleIva.importe4 +
        selectedTable.value.detalleIva.importe5
      );
    };

    const selectProduct = async (x, forceOpen = false) => {
      const now = Date.now();
      const DOUBLE_CLICK_THRESHOLD = 300;
      const alreadySelected = actProd.value === x;
      const isDoubleClick =
        now - lastClickTime.value < DOUBLE_CLICK_THRESHOLD && alreadySelected;

      actProd.value = x;
      lastClickTime.value = now;

      if (forceOpen || isDoubleClick) {
        selectedTable.value.lista[x].id = x;
        EditProductModalInfo.value = x;
        openEditProductModal.value = true;
        lastClickTime.value = 0;
      }
    };

    const openEditProduct = async (i) => {
      console.log("Double click detected for product index:", i);
      await selectProduct(i, true);
    };

    async function cobrar(fm) {
      paymentModal.value = false;
      try {
        const resultado = await axios.post("tickets/crearTicket", {
          total: getTotal(),
          idCesta: selectedTable.value._id,
          idTrabajador: SelectEmployer.value._id,
          tipo: fm,
          tkrsData: {
            cantidadTkrs: 0,
            formaPago: "EFECTIVO",
          },
        });

        if (!resultado.data) {
          throw Error("No se ha podido crear el ticket");
        } else {
          // Guardar el ID del ticket creado para poder imprimirlo
          await axios.post("tickets/getUltimoTicket").then(async (res) => {
            lastCreatedTicketId.value = res.data[0]?._id;
          });

          await axios.post("/cestas/setClients", {
            clients: 0,
            cesta: selectedTable.value._id,
          });

          // Mostrar modal de imprimir ticket en vez de navegar directamente
          printTicketModal.value = true;
        }
      } catch (err) {
        Swal.fire("Oops...", err.message, "error");
      }
    }

    async function handlePrintTicket() {
      printTicketModal.value = false;
      console.log(lastCreatedTicketId.value);
      try {
        if (lastCreatedTicketId.value) {
          await axios.post("impresora/imprimirTicket", {
            idTicket: lastCreatedTicketId.value,
          });
        }
        Swal.fire({
          icon: "success",
          title: "Ticket impreso correctamente",
          showConfirmButton: false,
          timer: 1000,
        });
      } catch (err) {
        console.error("Error al imprimir ticket:", err);
        Swal.fire("Oops...", "No se ha podido imprimir el ticket", "error");
      } finally {
        lastCreatedTicketId.value = null;
        router.push("/tableselection");
      }
    }

    function handleSkipPrint() {
      printTicketModal.value = false;
      lastCreatedTicketId.value = null;
      Swal.fire({
        icon: "success",
        title: "Venta registrada correctamente",
        showConfirmButton: false,
        timer: 1000,
      });
      router.push("/tableselection");
    }

    const isPreparing = ref(false);

    const handleSendToPrepare = async () => {
      if (isPreparing.value) return;
      isPreparing.value = true;
      await sendToPrepare().finally(() => {
        isPreparing.value = false;
      });
    };

    const sendToPrepare = async () => {
      let ticketsWithPrinter = [];
      for (let i = 0; i < selectedTable.value.lista.length; i++) {
        if (
          selectedTable.value.lista[i].impresora &&
          !selectedTable.value.lista[i].promocion &&
          selectedTable.value.lista[i].printed !=
            selectedTable.value.lista[i].unidades &&
          (!selectedTable.value.lista[i].articulosMenu ||
            selectedTable.value.lista[i].articulosMenu.every(
              (a) => a.printed == 0,
            ))
        ) {
          ticketsWithPrinter.push(selectedTable.value.lista[i]);
        }
        if (selectedTable.value.lista[i].promocion) {
          for (
            let j = 0;
            j < selectedTable.value.lista[i].promocion.grupos.length;
            j++
          ) {
            for (
              let k = 0;
              k < selectedTable.value.lista[i].promocion.grupos[j].length;
              k++
            ) {
              if (
                selectedTable.value.lista[i].promocion.grupos[j][k].impresora &&
                selectedTable.value.lista[i].promocion.grupos[j][k].printed !=
                  selectedTable.value.lista[i].promocion.grupos[j][k].unidades
              ) {
                ticketsWithPrinter.push(
                  selectedTable.value.lista[i].promocion.grupos[j][k],
                );
              }
            }
          }
        }
        if (
          selectedTable.value.lista[i].articulosMenu &&
          selectedTable.value.lista[i].articulosMenu.some((a) => a.impresora)
        ) {
          const menuPrinters = new Set();
          const itemsToProcess = [];

          for (
            let j = 0;
            j < selectedTable.value.lista[i].articulosMenu.length;
            j++
          ) {
            let artMenu = selectedTable.value.lista[i].articulosMenu[j];
            if (artMenu.impresora) {
              let unprintedCount = 0;
              let instancesToPrint = null;

              if (artMenu.instancias && artMenu.instancias.length > 0) {
                instancesToPrint = artMenu.instancias.filter(
                  (inst) => !inst.printed,
                );
                unprintedCount = instancesToPrint.length;
              } else if (artMenu.printed < artMenu.unidades) {
                unprintedCount = artMenu.unidades - artMenu.printed;
              }

              if (unprintedCount > 0) {
                menuPrinters.add(artMenu.impresora);
                itemsToProcess.push({
                  ...artMenu,
                  unidades: unprintedCount,
                  instancias: instancesToPrint,
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
      if (ticketsWithPrinter.length > 0) {
        try {
          const res2 = await axios.post("impresora/imprimirTicketComandero", {
            products: ticketsWithPrinter,
            table:
              selectedTable.value.nombre ||
              "TAULA: " + (selectedTable.value.indexMesa + 1),
            worker: SelectEmployer.value.nombre,
            clients: selectedTable.value.comensales,
          });
          const res = await axios.post("cestas/setArticuloImprimido", {
            idCesta: selectedTable.value._id,
            articulos: ticketsWithPrinter
              .filter((item) => item.idArticulo !== -1)
              .map((item) => item.idArticulo),
          });

          if (res.data && res2.data) {
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

    onMounted(() => {
      if (tables.value.length == 0) {
        router.push("/");
      }
      if (selectedTable.value.lista.length == 0) {
        router.push("/tableselection");
      }
    });

    return {
      selectedTable,
      actualPage,
      selectOtherEmployer,
      cobrar,
      router,
      hideInfo,
      handleSendToPrepare,
      sendToPrepare,
      selectProduct,
      openEditProductModal,
      paymentModal,
      printTicketModal,
      handlePrintTicket,
      handleSkipPrint,
      transferModal,
      selectOtherTable,
      removeProduct,
      tables,

      changeClients,
      SelectEmployer,
      actProd,
      restProduct,
      addProduct,
      EditProductModalInfo,
      suplByFamily,

      currentSalaName,
      menuArticles,

      selectedTargetTable,
      availableTables,
      selectTargetTable,
      confirmTransfer,
      openEditProduct,
    };
  },
};
</script>

<style lang="scss" scoped>
.ticket-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0;
  overflow: hidden;
}

// Header styles
.table-header {
  padding: 15px;
}

.header-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.header-item {
  background-color: #ffffff69;
  border-radius: 10px;
  flex: 1;
  min-width: 120px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background-color: #ffffff80;
    border-color: #dee2e6;
    transform: translateY(-1px);
  }

  &.prepare-item {
    background-color: #e8f5e8;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        background-color: #e8f5e8;
      }
    }
  }

  &.back-item {
    background-color: #f8f9fa;
    flex: 0 0 auto;

    .header-icon {
      color: #007bff;
    }
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
}

.header-icon {
  font-size: 1.1rem;
  color: #666;
  min-width: 20px;
}

.header-text {
  font-size: 0.95rem;
  font-weight: 500;
}

.section-divider {
  height: 2px;
  background: linear-gradient(90deg, #e9ecef 0%, #dee2e6 50%, #e9ecef 100%);
  margin: 0 15px;
}

// Products container
.products-container {
  flex: 1;
  padding: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.unified-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 15px;
  gap: 15px;
  background-color: #f8f9fa;
  overflow: hidden;
}

/* Header: Trabajador | Mesa | Comensales */
.top-header {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-item {
  flex: 1;
  background-color: #ffffffd0;
  padding: 8px 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  min-width: 140px;

  &:hover {
    transform: translateY(-2px);
    background-color: #ffffff;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
}

.header-icon {
  font-size: 1.1rem;
  color: #3b82f6;
}

.header-text {
  font-weight: 600;
  font-size: 0.95rem;
  color: #334155;
}

.room-pill {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.separator {
  margin: 0 6px;
  color: #cbd5e1;
}

/* Breadcrumb */
.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.breadcrumb-left {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.back-icon {
  color: #3b82f6;
  font-size: 1rem;
  padding: 8px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.breadcrumb-text {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

.prepare-btn-badge {
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 16px;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}

/* Products Layout (Ticket Grid) */
.ticket-grid-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 5px;
  min-height: 0;
  mask-image: linear-gradient(to bottom, black 95%, transparent 100%);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
}

.ticket-card-item {
  background-color: #ffffffd0;
  border-radius: 16px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: #ffffff;
    transform: translateX(4px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
    border-color: #3b82f6;
  }

  &.selected {
    border-left: 6px solid #3b82f6;
    background-color: #eff6ff;
    box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.15);
  }
}

.ticket-item-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-top-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.item-qty-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-quantity {
  background-color: #3b82f6;
  color: white;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 3px 8px;
  border-radius: 8px;
  min-width: 38px;
  text-align: center;
}

.status-icon-inline {
  font-size: 0.85rem;
  color: #cbd5e1;
  &.printed-success {
    color: #10b981;
  }
}

.item-name-text {
  font-weight: 700;
  font-size: 1.05rem;
  color: #1e293b;
}

.item-price-text {
  font-weight: 800;
  color: #10b981;
  font-size: 1.1rem;
}

.item-comment-text {
  font-size: 0.85rem;
  font-style: italic;
  color: #64748b;
  margin-left: 38px;
  margin-top: -4px;
}

.menu-item-comment-text {
  font-size: 0.75rem;
  font-style: italic;
  color: #94a3b8;
  display: block;
}

/* Secondary details (Supplements, etc) */
.item-secondary-details {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  padding: 4px 10px;
  margin-left: 38px;
}

.nested-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.detail-icon {
  font-size: 0.75rem;
  color: #94a3b8;
}

.menu-icon {
  color: #f59e0b;
}
.promo-icon {
  color: #ef4444;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
  text-align: center;
}

.empty-icon-wrapper {
  width: 100px;
  height: 100px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 20px;
  border: 4px dashed #cbd5e1;
}

.empty-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.empty-subtext {
  color: #64748b;
  font-size: 1rem;
}

/* Footer Premium */
.unified-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 5px 0;
}

.total-summary-card {
  background: white;
  border-radius: 20px;
  padding: 12px 18px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.total-info-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-shoutout {
  font-size: 1.2rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-value-big {
  font-size: 2rem;
  font-weight: 900;
  color: #10b981;
}

.action-buttons-group {
  display: flex;
  gap: 12px;
  justify-content: space-evenly;
  padding-top: 3px;
}

.footer-action-btn {
  padding: 12px !important;
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 1rem !important;
  letter-spacing: 0.02em;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
}

.checkout-btn {
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

/* Modals Premium Overrides (Global for TicketView) */
.premium-modal {
  :deep(.modal-content) {
    border-radius: 28px;
    border: none;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    background: #f8fafc;
  }
}

.modal-header-premium {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

.title-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  .title-icon {
    font-size: 1.4rem;
    color: #3b82f6;
  }
}

.modal-main-title {
  display: block;
  font-weight: 800;
  font-size: 1.25rem;
  color: #1e293b;
  line-height: 1.2;
}

.modal-subtitle {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.modal-body-premium {
  padding: 24px;
  background: #f8fafc;
}

.modal-footer-premium {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 18px 24px;
}

/* Payment Modal Specifics */
.payment-glass-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.payment-summary-card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 3rem;
  font-weight: 900;
  color: #10b981;

  @media (max-width: 576px) {
    font-size: 2.2rem;
  }
}

.methods-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.method-card {
  background: white;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  &.cash .method-icon-box {
    background: #ecfdf5;
    color: #10b981;
  }
  &.credit-card .method-icon-box {
    background: #eff6ff;
    color: #3b82f6;
  }
}

.method-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.method-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

.method-hint {
  font-size: 0.85rem;
  color: #64748b;
}

.method-arrow {
  color: #cbd5e1;
  font-size: 0.9rem;
}

/* Print Modal Specifics */
.print-big-icon-wrapper {
  width: 120px;
  height: 120px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 4px solid white;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1);
}

.print-big-icon {
  font-size: 3.5rem;
  color: #10b981;
}

.print-question-title {
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
}

.print-question-desc {
  color: #64748b;
  font-size: 1.1rem;
}

/* Transfer Modal Specifics */
.transfer-source-card {
  background: #f1f5f9;
  padding: 20px 30px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 576px) {
    padding: 15px;
    flex-direction: column;
    gap: 10px;
  }
}

.source-item {
  display: flex;
  flex-direction: column;
}

.source-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.source-value {
  font-weight: 800;
  font-size: 1.25rem;
  color: #1e293b;
}

.source-separator {
  color: #94a3b8;
  font-size: 1.2rem;
}

.selection-section-title {
  font-weight: 700;
  color: #475569;
  font-size: 1rem;
}

.transfer-tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
}

.transfer-table-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: scale(1.02);
    border-color: #e2e8f0;
  }

  &.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.has-items {
    background: #fffbeb;
    .table-card-icon {
      background: #fef3c7;
      color: #d97706;
    }
  }
}

.table-card-icon {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #64748b;
}

.table-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-card-name {
  font-weight: 700;
  color: #1e293b;
}

.table-card-status {
  font-size: 0.8rem;
  color: #64748b;
}

.selection-check {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #3b82f6;
  font-size: 1.5rem;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.premium-cancel-btn,
.premium-skip-btn {
  font-weight: 700 !important;
  border-radius: 12px !important;
  text-transform: none !important;
}

.premium-confirm-btn,
.premium-print-btn {
  font-weight: 800 !important;
  border-radius: 12px !important;
  text-transform: none !important;
  padding: 10px 24px !important;
}

/* Mobile Adjustments */
@media (max-width: 576px) {
  .total-value-big {
    font-size: 1.8rem;
  }
  .item-name-text {
    font-size: 0.95rem;
  }
  .action-buttons-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .ticket-view {
    padding: 0;
  }

  .table-header,
  .products-container,
  .footer-container {
    padding: 10px;
  }

  .table-header-row,
  .product-row {
    grid-template-columns: 50px 1fr 70px;
    gap: 8px;
    padding: 10px 8px;
  }

  .product-name {
    font-size: 0.9rem;
  }

  .supplement-text {
    font-size: 0.8rem;
  }

  .total-info {
    padding: 12px;
  }

  .total-amount {
    font-size: 1.3rem;
  }

  .payment-btn {
    padding: 12px 20px;
    font-size: 1rem;
  }
}

.menu-section {
  background-color: #f8f9fa;
}
// --- MODAL DE EDICIÓN DE PRODUCTO ---
.custom-edit-modal {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}
.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: #fff;
}
.scrollable-modal-body {
  overflow-y: auto;
  max-height: calc(100vh - 120px); /* Ajusta según altura header+footer */
  padding-bottom: 16px;
}

.table-name-pill {
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-right: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.diners-pill {
  background-color: #f1f3f4;
  color: #5f6368;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
}
</style>
