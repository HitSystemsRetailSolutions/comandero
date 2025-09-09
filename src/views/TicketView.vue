<template>
  <!-- Modal de edición de producto mejorado -->
  <MDBModal
    id="openEditProductModal"
    tabindex="-1"
    labelledby="openEditProductModal"
    v-model="openEditProductModal"
    :staticBackdrop="true"
    size="lg"
    class="edit-product-modal"
  >
    <MDBModalHeader class="modal-header-custom">
      <div class="modal-title-custom">
        <MDBIcon icon="edit" />
        <span>{{ selectedTable.lista[EditProductModalInfo]?.nombre }}</span>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-custom">
      <div class="product-edit-container">
        <!-- Sección de unidades -->
        <div class="units-section">
          <div class="section-header">
            <MDBIcon icon="calculator" />
            <span class="section-title">Unidades</span>
          </div>

          <div class="units-display">
            <div class="current-units">
              <span class="units-number">{{
                selectedTable.lista[EditProductModalInfo]?.unidades
              }}</span>
              <span class="units-label">uds.</span>
            </div>

            <div class="units-controls">
              <div
                class="control-btn add-btn"
                @click="
                  addProduct(
                    selectedTable.lista[EditProductModalInfo],
                    null,
                    false
                  )
                "
              >
                <MDBIcon icon="plus" />
              </div>
              <div
                class="control-btn remove-btn"
                @click="
                  removeProduct(selectedTable.lista[EditProductModalInfo]);
                  openEditProductModal = false;
                "
              >
                <MDBIcon icon="trash-alt" />
              </div>
              <div
                class="control-btn minus-btn"
                @click="
                  restProduct(
                    selectedTable.lista[EditProductModalInfo],
                    null,
                    false
                  )
                "
                :class="{
                  disabled:
                    selectedTable.lista[EditProductModalInfo]?.unidades == 1,
                }"
              >
                <MDBIcon icon="minus" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de suplementos -->
        <div
          v-if="selectedTable.lista[EditProductModalInfo]?.arraySuplementos"
          class="supplements-section"
        >
          <div class="section-header">
            <MDBIcon icon="plus-circle" />
            <span class="section-title">Suplementos</span>
          </div>

          <div class="supplements-list">
            <div
              v-for="(x, i) in selectedTable.lista[EditProductModalInfo]
                .arraySuplementos"
              :key="i"
              class="supplement-item"
            >
              <div class="supplement-info">
                <MDBIcon icon="arrow-right" class="supplement-icon" />
                <span class="supplement-name">{{ x.nombre }}</span>
              </div>
              <div class="supplement-remove" @click="removeSuplement(i)">
                <MDBIcon icon="trash-alt" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-custom">
      <MDBBtn
        color="secondary"
        @click="openEditProductModal = false"
        class="close-btn"
      >
        <MDBIcon icon="times" />
        Cerrar
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <!-- Modal de método de pago -->
  <MDBModal
    id="paymentModal"
    tabindex="-1"
    labelledby="paymentModal"
    v-model="paymentModal"
    :staticBackdrop="true"
    size="md"
    class="payment-modal"
  >
    <MDBModalHeader class="payment-modal-header">
      <div class="payment-modal-title">
        <MDBIcon icon="credit-card" />
        <span>Seleccionar método de pago</span>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="payment-modal-body">
      <div class="payment-total">
        <div class="total-label">Total a cobrar:</div>
        <div class="total-amount">
          {{
            (
              selectedTable.detalleIva.importe1 +
              selectedTable.detalleIva.importe2 +
              selectedTable.detalleIva.importe3 +
              selectedTable.detalleIva.importe4 +
              selectedTable.detalleIva.importe5
            ).toFixed(2)
          }}€
        </div>
      </div>

      <div class="payment-methods">
        <div class="payment-option" @click="cobrar('EFECTIVO')">
          <div class="payment-icon cash">
            <MDBIcon icon="euro-sign" />
          </div>
          <div class="payment-info">
            <div class="payment-name">Efectivo</div>
            <div class="payment-desc">Pago en metálico</div>
          </div>
          <MDBIcon icon="chevron-right" class="arrow-icon" />
        </div>

        <div class="payment-option" @click="cobrar('DATAFONO_3G')">
          <div class="payment-icon card">
            <MDBIcon icon="credit-card" />
          </div>
          <div class="payment-info">
            <div class="payment-name">Tarjeta</div>
            <div class="payment-desc">Pago con tarjeta</div>
          </div>
          <MDBIcon icon="chevron-right" class="arrow-icon" />
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="payment-modal-footer">
      <MDBBtn
        color="secondary"
        @click="paymentModal = false"
        class="cancel-payment-btn"
      >
        <MDBIcon icon="times" />
        Cancelar
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
    size="md"
    class="transfer-modal"
  >
    <MDBModalHeader class="transfer-modal-header">
      <div class="transfer-modal-title">
        <MDBIcon icon="exchange-alt" />
        <span>Traspasar productos a otra mesa</span>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="transfer-modal-body">
      <div class="transfer-info">
        <div class="current-table-info">
          <div class="info-label">Mesa actual:</div>
          <div class="info-value">
            {{ selectedTable.nombre || `Mesa ${selectedTable.indexMesa + 1}` }}
          </div>
        </div>
        <div class="products-count">
          <div class="count-label">Productos a traspasar:</div>
          <div class="count-value">
            {{ selectedTable.lista.length }} productos
          </div>
        </div>
      </div>

      <div class="tables-selection">
        <div class="selection-title">
          <MDBIcon icon="table" />
          <span>Seleccionar mesa destino:</span>
        </div>

        <div class="tables-grid">
          <div
            v-for="table in availableTables"
            :key="table._id"
            class="table-option"
            @click="selectTargetTable(table)"
            :class="{ selected: selectedTargetTable?._id === table._id }"
          >
            <div class="table-icon">
              <MDBIcon
                :icon="
                  table.lista && table.lista.length > 0 ? 'utensils' : 'table'
                "
              />
            </div>
            <div class="table-info">
              <div class="table-name">
                {{ table.nombre || `Mesa ${table.indexMesa + 1}` }}
              </div>
              <div
                class="table-status"
                :class="{ occupied: table.lista && table.lista.length > 0 }"
              >
                {{
                  table.lista && table.lista.length > 0
                    ? `${table.lista.length} productos`
                    : "Libre"
                }}
              </div>
            </div>
            <div
              v-if="table.lista && table.lista.length > 0"
              class="warning-icon"
            >
              <MDBIcon icon="exclamation-triangle" />
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="transfer-modal-footer">
      <MDBBtn
        color="secondary"
        @click="
          transferModal = false;
          selectedTargetTable = null;
        "
        class="cancel-transfer-btn"
      >
        <MDBIcon icon="times" />
        Cancelar
      </MDBBtn>
      <MDBBtn
        color="warning"
        @click="confirmTransfer"
        :disabled="!selectedTargetTable"
        class="confirm-transfer-btn"
      >
        <MDBIcon icon="check" />
        Confirmar traspaso
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <!-- Contenido principal -->
  <div class="ticket-view">
    <!-- Header con información de la mesa -->
    <div class="table-header">
      <MDBListGroup class="header-list">
        <MDBListGroupItem @click="selectOtherTable" class="header-item">
          <div class="header-content">
            <MDBIcon icon="shopping-basket" class="header-icon" />
            <span class="header-text"
              >Mesa {{ selectedTable.indexMesa + 1 }}</span
            >
          </div>
        </MDBListGroupItem>
        <MDBListGroupItem @click="changeClients" class="header-item">
          <div class="header-content">
            <MDBIcon icon="user-tie" class="header-icon" />
            <span class="header-text"
              >{{ selectedTable.comensales }} comensales</span
            >
          </div>
        </MDBListGroupItem>
        <MDBListGroupItem
          class="header-item prepare-item"
          @click="sendToPrepare"
          :class="{ disabled: selectedTable.lista.length == 0 }"
        >
          <div class="header-content">
            <MDBIcon icon="print" class="header-icon" />
            <span class="header-text">Preparar</span>
          </div>
        </MDBListGroupItem>
      </MDBListGroup>
    </div>

    <div class="section-divider"></div>

    <!-- Lista de productos -->
    <div class="products-container">
      <!-- Estado vacío -->
      <div v-if="selectedTable.lista.length == 0" class="empty-state">
        <div class="empty-icon">
          <MDBIcon icon="shopping-basket" />
        </div>
        <div class="empty-text">No hay productos en esta cesta</div>
        <div class="empty-subtext">Añade productos desde el menú</div>
      </div>

      <!-- Tabla de productos responsive -->
      <div
        v-if="selectedTable.lista.length > 0"
        class="products-table-container"
      >
        <div class="table-header-row">
          <div class="col-units">Uds.</div>
          <div class="col-product">Producto</div>
          <div class="col-price">Precio</div>
        </div>

        <div class="table-body">
          <div
            v-for="(x, i) in selectedTable.lista"
            :key="i"
            class="product-row"
            @click="selectProduct(i)"
            :class="{ selected: actProd == i }"
          >
            <div class="col-units">
              <span class="units-badge">x{{ x.unidades }}</span>
            </div>

            <div class="col-product">
              <div class="product-main">
                <MDBIcon
                  v-if="x.impresora"
                  icon="print"
                  class="print-icon"
                  :class="{ printed: x?.printed == x.unidades }"
                />
                <span class="product-name">{{ x.nombre }} </span>
              </div>

              <div v-if="x.promocion" class="supplements">
                <div
                  v-for="(z, y) in x.promocion.grupos"
                  :key="y"
                  class="supplement-row"
                >
                  <div v-for="(v, h) in z" :key="y" class="supplement-row">
                    <span class="supplement-text">→ {{ v.nombre }}</span>
                    <div
                      v-for="(p, q) in v.suplementosPorArticulo"
                      :key="y"
                      class="supplement-row"
                    >
                      <div
                        v-for="(a, b) in p.suplementos"
                        :key="y"
                        class="subsupplement-row"
                      >
                        <span class="supplement-text">➥ {{ a.nombre }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="x.arraySuplementos" class="supplements">
                <div
                  v-for="(z, y) in x.arraySuplementos"
                  :key="y"
                  class="supplement-row"
                >
                  <span class="supplement-text">→ {{ z.nombre }}</span>
                </div>
              </div>

              <div v-if="x.articulosMenu" class="supplements">
                <div
                  v-for="(z, y) in x.articulosMenu"
                  :key="y"
                  class="supplement-row"
                >
                  <span class="supplement-text">{{ z.nombre }}</span>

                  <!-- Subniveles -->
                  <div
                    v-if="z.arraySuplementos"
                    class="supplements"
                    style="margin-left: 20px"
                  >
                    <div
                      v-for="(a, b) in z.arraySuplementos"
                      :key="b"
                      class="supplement-row"
                    >
                      <span class="supplement-text">→ {{ a.nombre }}</span>

                      <!-- Sub-subniveles -->
                      <div
                        v-if="a.arraySuplementos"
                        class="supplements"
                        style="margin-left: 20px"
                      >
                        <div
                          v-for="(c, d) in a.arraySuplementos"
                          :key="d"
                          class="supplement-row"
                        >
                          <span class="supplement-text">→ {{ c.nombre }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-price">
              <div class="main-price">{{ x.subtotal.toFixed(2) }}€</div>
              <div v-if="x.arraySuplementos" class="supplement-prices">
                <div
                  v-for="(z, y) in x.arraySuplementos"
                  :key="y"
                  class="supplement-price"
                >
                  {{ z.precioConIva.toFixed(2) }}€
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer con total y botón de cobrar -->
    <div class="footer-container">
      <div class="total-section">
        <div class="total-info">
          <MDBIcon icon="hand-holding-usd" class="total-icon" />
          <span class="total-label">Total:</span>
          <span class="total-amount">
            {{
              (
                selectedTable.detalleIva.importe1 +
                selectedTable.detalleIva.importe2 +
                selectedTable.detalleIva.importe3 +
                selectedTable.detalleIva.importe4 +
                selectedTable.detalleIva.importe5
              ).toFixed(2)
            }}€
          </span>
        </div>
      </div>

      <div class="payment-section">
        <MDBBtn
          color="success"
          size="lg"
          class="payment-btn"
          @click="paymentModal = true"
          :disabled="selectedTable.lista.length == 0"
        >
          <MDBIcon icon="cash-register" />
          Cobrar pedido
        </MDBBtn>

        <MDBBtn
          color="warning"
          size="lg"
          class="transfer-btn"
          @click="transferModal = true"
          :disabled="selectedTable.lista.length == 0"
        >
          <MDBIcon icon="exchange-alt" />
          Traspasar mesa
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
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const hideInfo = ref(false);
    const tables = computed(() => store.state.Tables.arrayTables);
    let selectedTable = computed(() => store.state.Tables.selectedTable);
    const actualPage = computed(() => route.currentRoute.value.path);
    const openEditProductModal = ref(false);
    const paymentModal = ref(false);
    const transferModal = ref(false);
    const EditProductModalInfo = ref(-1);
    const actProd = ref(null);
    const selectedTargetTable = ref(null);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    // Computed para mesas disponibles (excluyendo la mesa actual)
    const availableTables = computed(() => {
      return tables.value.filter(
        (table) => table._id !== selectedTable.value._id
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
            JSON.stringify(x.arraySuplementos)
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
            JSON.stringify(x.arraySuplementos)
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

    const selectProduct = async (x) => {
      if (actProd.value == x) {
        selectedTable.value.lista[x].id = x;
        EditProductModalInfo.value = x;
        openEditProductModal.value = true;
      }

      actProd.value = x;
    };

    const removeSuplement = async (sup) => {
      openEditProductModal.value = false;
      let x = selectedTable.value.lista[EditProductModalInfo.value];

      removeProduct(selectedTable.value.lista[EditProductModalInfo.value]);
      x.arraySuplementos.splice(sup, 1);
      if (x.arraySuplementos.length <= 0) x.arraySuplementos = null;
      setTimeout(async () => {
        await axios
          .post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticulo,
            gramos: x.gramos ?? 0,
            idCesta: selectedTable.value._id,
            unidades: 1,
            arraySuplementos: x.arraySuplementos ?? null,
            nombre: x.nombre,
            menu: "",
          })
          .then((x) => {
            if (x.data.error) throw Error(x.data.error);
            setTimeout(() => {
              EditProductModalInfo.value = selectedTable.value.lista.length - 1;
              openEditProductModal.value = true;
            }, 10);
          });
      }, 100);
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
          const res = await axios
            .post("/cestas/setClients", {
              clients: 0,
              cesta: selectedTable.value._id,
            })
            .then((res) => {
              if (res) router.push("/categoryselection");
            });
          Swal.fire({
            icon: "success",
            title: "Venta registrada correctamente",
            showConfirmButton: false,
            timer: 1000,
          });
          router.push("/tableselection");
        }
      } catch (err) {
        Swal.fire("Oops...", err.message, "error");
      }
    }

    const sendToPrepare = async () => {
      let ticketsWithPrinter = [];
      for (let i = 0; i < selectedTable.value.lista.length; i++) {
        if (
          selectedTable.value.lista[i].impresora &&
          selectedTable.value.lista[i].printed !=
            selectedTable.value.lista[i].unidades
        ) {
          ticketsWithPrinter.push(selectedTable.value.lista[i]);
        }
      }
      if (ticketsWithPrinter.length > 0) {
        try {
          const res2 = await axios.post("impresora/imprimirTicketComandero", {
            products: ticketsWithPrinter,
            table: selectedTable.value.indexMesa + 1,
            worker: SelectEmployer.value.nombre,
            clients: selectedTable.value.comensales,
          });
          const res = await axios.post("cestas/setArticuloImprimido", {
            idCesta: selectedTable.value._id,
            articulos: ticketsWithPrinter.map((item) => item.idArticulo),
            printed: ticketsWithPrinter.map((item) => item.idArticulo).unidades,
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
      sendToPrepare,
      selectProduct,
      openEditProductModal,
      paymentModal,
      transferModal,
      selectOtherTable,
      removeProduct,
      tables,
      removeSuplement,
      changeClients,
      SelectEmployer,
      actProd,
      restProduct,
      addProduct,
      EditProductModalInfo,
      selectedTargetTable,
      availableTables,
      selectTargetTable,
      confirmTransfer,
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

  &:hover {
    background-color: #ffffff80;
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

.empty-subtext {
  font-size: 1rem;
  opacity: 0.7;
}

// Responsive table
.products-table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-header-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 15px;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 10px;
  border-bottom: 2px solid #dee2e6;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.product-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 15px;
  padding: 15px;
  background-color: #ffffff69;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    background-color: #ffffff80;
    border-color: #dee2e6;
    transform: translateY(-1px);
  }

  &.selected {
    background-color: #f6ebdf;
    border-color: #ffc107;
  }
}

.col-units {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.units-badge {
  background-color: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.col-product {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-icon {
  font-size: 0.8rem;
  color: #774040;

  &.printed {
    color: #28a745;
  }
}

.product-name {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  word-break: break-word;
}

.supplements {
  margin-left: 20px;
}

.supplement-row {
  margin-bottom: 4px;
}
.subsupplement-row {
  margin-bottom: 4px;
  margin-left: 15px;
}

.supplement-text {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
}

.col-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.main-price {
  font-size: 1rem;
  font-weight: bold;
  color: #28a745;
}

.supplement-prices {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.supplement-price {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

// Footer
.footer-container {
  background-color: #f8f9fa;
  border-top: 2px solid #dee2e6;
  padding: 20px 15px;
}

.total-section {
  margin-bottom: 15px;
}

.total-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 10px;
  border: 2px solid #e9ecef;
}

.total-icon {
  font-size: 1.3rem;
  color: #28a745;
}

.total-label {
  font-size: 1.6rem;
  font-weight: 500;
  color: #495057;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

.payment-section {
  display: flex;
  justify-content: center;
}

.payment-btn {
  width: 100%;
  max-width: 300px;
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Modal styles
.edit-product-modal,
.payment-modal,
.transfer-modal {
  .modal-header-custom,
  .payment-modal-header,
  .transfer-modal-header {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
    padding: 20px;
  }

  .modal-title-custom,
  .payment-modal-title,
  .transfer-modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.3rem;
    font-weight: 600;
    color: #495057;
  }

  .modal-body-custom,
  .payment-modal-body,
  .transfer-modal-body {
    background-color: #fff9f2;
    padding: 25px;
  }

  .modal-footer-custom,
  .payment-modal-footer,
  .transfer-modal-footer {
    background-color: #f8f9fa;
    border-top: 2px solid #e9ecef;
    padding: 15px 20px;
  }
}

// Transfer modal specific styles
.transfer-info {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
}

.current-table-info,
.products-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label,
.count-label {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value,
.count-value {
  font-size: 1.1rem;
  color: #495057;
  font-weight: 600;
}

.tables-selection {
  .selection-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #495057;
  }
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
}

.table-option {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #ffffff;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #ffc107;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
  }

  &.selected {
    border-color: #ffc107;
    background-color: #fff9e6;
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  }
}

.table-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 1.2rem;
  color: #6c757d;
  transition: all 0.3s ease;

  .table-option:hover & {
    background-color: #ffc107;
    color: #212529;
  }

  .table-option.selected & {
    background-color: #ffc107;
    color: #212529;
  }
}

.table-info {
  flex: 1;
}

.table-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.table-status {
  font-size: 0.85rem;
  color: #6c757d;

  &.occupied {
    color: #dc3545;
    font-weight: 500;
  }
}

.warning-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background-color: #ffc107;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #212529;
}

.cancel-transfer-btn,
.confirm-transfer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.confirm-transfer-btn {
  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  }
}

// Product edit modal
.product-edit-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e9ecef;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
}

.units-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.units-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.current-units {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.units-number {
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
}

.units-label {
  font-size: 1.2rem;
  color: #6c757d;
}

.units-controls {
  display: flex;
  gap: 15px;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.5rem;

  &.add-btn {
    background-color: #28a745;
    color: white;

    &:hover {
      background-color: #218838;
      transform: scale(1.1);
    }
  }

  &.remove-btn {
    background-color: #dc3545;
    color: white;

    &:hover {
      background-color: #c82333;
      transform: scale(1.1);
    }
  }

  &.minus-btn {
    background-color: #ffc107;
    color: #212529;

    &:hover:not(.disabled) {
      background-color: #e0a800;
      transform: scale(1.1);
    }

    &.disabled {
      background-color: #6c757d;
      color: #ffffff;
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.supplements-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.supplements-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.supplement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.supplement-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.supplement-icon {
  font-size: 0.9rem;
  color: #6c757d;
}

.supplement-name {
  font-size: 0.95rem;
  color: #495057;
  font-style: italic;
}

.supplement-remove {
  padding: 8px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #c82333;
    transform: scale(1.1);
  }
}

// Payment modal
.payment-total {
  text-align: center;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 2px solid #e9ecef;
}

.total-label {
  font-size: 1.1rem;
  color: #6c757d;
}

.total-amount {
  font-size: 2rem;
  font-weight: bold;
  color: #28a745;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  }
}

.payment-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 20px;

  &.cash {
    background-color: #ffc107;
    color: #212529;
  }

  &.card {
    background-color: #007bff;
    color: white;
  }
}

.payment-info {
  flex: 1;
}

.payment-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.payment-desc {
  font-size: 0.9rem;
  color: #6c757d;
}

.arrow-icon {
  font-size: 1.2rem;
  color: #6c757d;
}

.close-btn,
.cancel-payment-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
}

// Responsive design
@media (max-width: 768px) {
  .header-list {
    flex-direction: column;
  }

  .header-item {
    min-width: auto;
  }

  .table-header-row,
  .product-row {
    grid-template-columns: 60px 1fr 80px;
    gap: 10px;
    padding: 12px 10px;
  }

  .units-number {
    font-size: 2.5rem;
  }

  .units-controls {
    gap: 10px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 1.3rem;
  }

  .payment-option {
    padding: 15px;
  }

  .payment-icon {
    width: 50px;
    height: 50px;
    font-size: 1.3rem;
    margin-right: 15px;
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

  // Transfer modal responsive
  .tables-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .table-option {
    padding: 12px;
  }

  .table-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .transfer-info {
    padding: 15px;
  }

  .cancel-transfer-btn,
  .confirm-transfer-btn {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
}
</style>
