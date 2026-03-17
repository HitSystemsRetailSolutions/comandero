<template>
  <div class="unified-layout">
    <!-- Header: Trabajador | Mesa -->
    <div class="top-header">
      <div class="header-item" @click="selectOtherEmployer">
        <MDBIcon icon="user-tag" class="header-icon" />
        <span class="header-text">{{ SelectEmployer.nombre }}</span>
      </div>
      <div class="header-item" @click="selectOtherTable">
        <MDBIcon icon="shopping-basket" class="header-icon" />
        <span class="header-text">
          <span class="room-pill">{{ currentSalaName }}</span>
          <span class="separator">|</span>
          <span class="table-text">
            {{
              selectTable?.nombre
                ? selectTable.nombre
                : "Mesa " + (selectTable.indexMesa + 1)
            }}
          </span>
          <span class="separator">|</span>
          <span class="diners-text">
            {{ selectTable.comensales }}
            <MDBIcon icon="user" class="ms-1" />
          </span>
        </span>
      </div>
    </div>

    <!-- Ticket Section -->
    <div class="unified-ticket-section">
      <div class="ticket-lines-container">
        <div
          v-if="!selectTable.lista || selectTable.lista.length === 0"
          class="empty-ticket"
        >
          No hay productos en esta cesta
        </div>
        <div v-else class="ticket-scroll">
          <div
            v-for="(x, i) in selectTable.lista"
            :key="i"
            class="ticket-line"
            :class="{ 'confirm-mode': pendingDelete === i }"
            @click="handleTicketClick(i)"
          >
            <template v-if="pendingDelete !== i">
              <div class="ticket-line-content">
                <span class="ticket-qty">{{ x.unidades }}</span>
                <MDBIcon
                  v-if="x.arraySuplementos && x.arraySuplementos.length > 0"
                  icon="puzzle-piece"
                  class="supplement-indicator-icon me-2"
                  color="primary"
                />
                <span class="ticket-name">{{ x.nombre }}</span>
                <span class="ticket-price">{{ x.subtotal?.toFixed(2) }}€</span>
              </div>
              <button
                class="delete-line-btn"
                @click.stop="handleTicketDelete(x, i)"
              >
                <MDBIcon :icon="x.unidades > 1 ? 'minus' : 'trash-alt'" />
              </button>
            </template>
            <template v-else>
              <span class="confirm-text"
                >¿Eliminar <strong>{{ x.nombre }}</strong
                >?</span
              >
              <div class="confirm-actions">
                <button
                  class="confirm-cancel-btn"
                  @click.stop="pendingDelete = null"
                >
                  No
                </button>
                <button
                  class="confirm-delete-btn"
                  @click.stop="
                    removeFromTicket(x, i);
                    pendingDelete = null;
                  "
                >
                  Eliminar
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="ticket-actions-container">
        <!-- <div class="ticket-total-display">
          <span>Total:</span>
          <span class="ticket-total-amount">
            {{
              selectTable.detalleIva
                ? (
                    selectTable.detalleIva.importe1 +
                    selectTable.detalleIva.importe2 +
                    selectTable.detalleIva.importe3 +
                    selectTable.detalleIva.importe4 +
                    selectTable.detalleIva.importe5
                  ).toFixed(2)
                : "0.00"
            }}€
          </span>
        </div>-->
        <MDBBtn
          color="success"
          class="action-btn"
          @click="router.push('/ticketview')"
        >
          <MDBIcon icon="cash-register" class="me-2" />Cobrar
        </MDBBtn>
        <MDBBtn color="danger" class="action-btn" @click="deleteAll()">
          <MDBIcon icon="trash-alt" class="me-2" />Vacíar cesta
        </MDBBtn>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb-container" @click="selectOtherCategory">
      <MDBIcon icon="arrow-left" class="back-icon" />
      <span class="breadcrumb-text">{{ products.nombre }}</span>
      <span class="products-count-badge">
        {{ products.arrayTeclas.filter((prods) => prods.esSumable).length }}
        prods.
      </span>
    </div>

    <!-- Grid de Productos -->
    <div class="products-grid-container">
      <div
        v-for="(x, i) in products.arrayTeclas.filter(
          (prods) => prods.esSumable,
        )"
        :key="i"
        class="product-grid-item"
        @click="
          x?.suplementos?.length > 0 ? selectSuplements(x, i) : addProduct(x, i)
        "
      >
        <div class="product-grid-header">
          <span class="product-grid-name">{{ x.nombreArticulo }}</span>
          <span class="product-grid-price">{{ x.precioConIva }}€</span>
        </div>

        <div class="product-grid-actions-simple">
          <div
            class="grid-qty-display-badge"
            v-if="
              selectTable.lista.filter((p) => p.idArticulo == x.idArticle)
                .length > 0 ||
              selectTable.lista.filter((p) => p.idArticulo == x.idArticle)[0]
                ?.unidades > 0
            "
          >
            {{
              (selectTable.lista.filter((p) => p.idArticulo == x.idArticle)[0]
                ?.arraySuplementos?.length > 0
                ? selectTable.lista.filter((p) => p.idArticulo == x.idArticle)
                    .length
                : selectTable.lista.filter(
                    (p) => p.idArticulo == x.idArticle,
                  )[0]?.unidades) || 0
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modales de suplementos y menú -->
    <SuplementosModal
      v-model="suplModal"
      :suplArticle="suplArticle"
      @confirmarSuplementos="confirmarSuplementos"
    />
    <MDBModal
      id="menuModal"
      v-model="menuModal"
      :staticBackdrop="true"
      labelledby="menuModal"
      size="lg"
      class="menu-modal-premium"
    >
      <MenuModal
        v-model="menuModal"
        :menuSelected="menuSelected"
        :suplByFamily="suplByFamily"
        @confirmarMenu="onConfirmarMenu"
      />
    </MDBModal>

    <!-- Edit Product Modal -->
    <EditProductModal v-model="showEditModal" :index="editProductIndex" />
  </div>
</template>
<script>
import {
  MDBCheckbox,
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
  MDBBtn,
} from "mdb-vue-ui-kit";
import SuplementosModal from "@/components/SuplementosModal.vue";
import MenuModal from "@/components/MenuModal.vue";
import EditProductModal from "@/components/EditProductModal.vue";

import { useStore } from "vuex";
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import router from "@/router";
import Swal from "sweetalert2";
export default {
  name: "MenuPrincipalView",

  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBBtn,
    MDBListGroupItem,
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBCheckbox,
    MDBModalFooter,
    SuplementosModal,
    MenuModal,
    EditProductModal,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const totalTable = ref(0);
    const hideInfo = ref(false);
    const pendingDelete = ref(null);
    const suplModal = ref(false);
    const showEditModal = ref(false);
    const editProductIndex = ref(null);
    const lastClickTime = ref(0);
    const categories = computed(() => store.state.Categories.arrayCategories);
    const suplArticle = ref(null);
    const arraySuplementosSelected = ref(null);
    const suplSelected = ref(null);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer,
    );
    let selectTable = computed(() => store.state.Tables.selectedTable);
    let products = computed(() => store.state.Categories.selectedCategory);
    const actualPage = computed(() => route.currentRoute.value.path);

    const teclaSelected = ref(null);
    // Modal para articulo menu
    const menuModal = ref(false);
    const menuArticles = ref(null);
    const menuSelected = ref(null);
    const seleccionadoPorFamilia = ref(null);
    // Control de apertura/cierre de familias
    const familiasAbiertas = ref({});
    function toggleFamilia(familia) {
      familiasAbiertas.value = {
        ...familiasAbiertas.value,
        [familia]: !familiasAbiertas.value[familia],
      };
    }

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
    const selectOtherTable = () => {
      router.push("/tableselection");
    };
    const selectOtherCategory = () => {
      router.push("/categoryselection");
    };

    const selectSuplements = async (x, i) => {
      console.log(x);
      if (!x?.suplementos?.length) return;
      const sup = x.suplementos;
      const res = await axios.post("articulos/getSuplementos", {
        arrayIdSuplementos: sup,
      });
      if (x?.esMenu) {
        menuSelected.value = x;
        menuArticles.value = res.data;
        menuModal.value = true;
        teclaSelected.value = x;
      } else {
        // Abrir modal de suplementos
        teclaSelected.value = x;
        suplSelected.value = x;
        suplArticle.value = res.data;
        suplModal.value = true;
      }
    };

    const familiaEnUso = ref("");
    async function setSeleccionFamilia(familia, producto) {
      const tieneSuplementos =
        producto.suplementos && producto.suplementos.length > 0;
      familia = familia || familiaEnUso.value;
      const idSel = seleccionadoPorFamilia.value[familia]?.idArticulo;
      const idSup = producto.idArticulo ?? producto._id ?? null;
      if (idSel === idSup) {
        // Si ya está seleccionado, deselecciona
        const copia = { ...seleccionadoPorFamilia.value };
        delete copia[familia];
        seleccionadoPorFamilia.value = copia;
        familiaEnUso.value = "";
        return;
      }
      if (tieneSuplementos) {
        // Defer selection, open modal for supplements
        const res = await axios.post("articulos/getSuplementos", {
          arrayIdSuplementos: producto.suplementos,
        });
        if (res.data) {
          suplModal.value = true;
          suplSelected.value = producto;
          suplArticle.value = res.data;
          // Optionally, fetch supplements if needed here
          return;
        }
      }
      // No supplements, select immediately
      const obj = {
        idArticulo: idSup,
        nombre: producto.nombre ?? null,
        arraySuplementos: producto.arraySuplementos ?? null,
        unidades: producto.unidades ?? 1,
        gramos: producto.gramos ?? null,
      };
      seleccionadoPorFamilia.value = {
        ...seleccionadoPorFamilia.value,
        [familia]: obj,
      };
      familiaEnUso.value = "";
    }

    function confirmarSuplementos(suplementosSeleccionados) {
      arraySuplementosSelected.value = suplementosSeleccionados;
      addProduct(suplSelected.value, 0);
      suplModal.value = false;
      familiaEnUso.value = "";
    }

    function onConfirmarMenu(menu) {
      seleccionadoPorFamilia.value = menu;
      addProduct(teclaSelected.value, 0);
      menuModal.value = false;
      menuArticles.value = null;
      menuSelected.value = null;
    }
    const openEditModal = (index) => {
      editProductIndex.value = index;
      showEditModal.value = true;
    };

    const handleTicketClick = (index) => {
      const now = Date.now();
      const DOUBLE_CLICK_THRESHOLD = 300; // ms

      if (
        now - lastClickTime.value < DOUBLE_CLICK_THRESHOLD &&
        editProductIndex.value === index
      ) {
        openEditModal(index);
        lastClickTime.value = 0; // Reset
      } else {
        lastClickTime.value = now;
        editProductIndex.value = index;
      }
    };

    const deleteAll = async () => {
      Swal.fire({
        title: "¿Estás seguro de que quieres vaciar la cesta?",
        icon: "warning",
        backdrop: "rgba(255,0,0,0.4)",
        confirmButtonColor: "red",
        cancelButtonColor: "green",
        iconColor: "red",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "No",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios
            .post("cestas/borrarCesta", {
              idCesta: selectTable.value._id,
              quitarCliente: true,
            })
            .then((x) => {
              if (x.data) {
                Swal.fire({
                  title: "Cesta vaciada",
                  icon: "success",
                  timer: 1000,
                  showConfirmButton: false,
                });
              }
            });
        }
      });
    };

    const addProduct = async (x, i) => {
      await axios.post(
        "teclado/clickTeclaArticulo",
        {
          idArticulo: x.idArticle,
          gramos: 0,
          idCesta: selectTable.value._id,
          unidades: 1,
          arraySuplementos: arraySuplementosSelected.value,
          nombre: x.nombreArticulo,
          menu: products.value.nombre,
          articulosMenu: seleccionadoPorFamilia.value
            ? Object.values(seleccionadoPorFamilia.value)
            : null,
        },
        {
          headers: {
            "X-Source-Program": "COMANDERO",
            article: encodeURIComponent(x.nombreArticulo),
            worker: encodeURIComponent(SelectEmployer.value.nombre),
          },
        },
      );
      arraySuplementosSelected.value = null;
      suplArticle.value = null;
      seleccionadoPorFamilia.value = null;
    };
    const removeProduct = async (x, i) => {
      let z = selectTable.value.lista.filter(
        (products) => products.idArticulo == x.idArticle,
      );
      if (z.length > 0) {
        if (z[0].unidades > 1) {
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticle,
            gramos: 0,
            idCesta: selectTable.value._id,
            unidades: -1,
            arraySuplementos: null,
            nombre: x.nombreArticulo,
            menu: products.value.nombre,
          });
        } else if (z[0].unidades == 1) {
          totalTable.value -= x.precioConIva;
          store.dispatch(
            "Tables/removeProduct",
            selectTable.value.lista.indexOf(z[0]),
          );
        }
      }
    };

    // Manejo del botón X del ticket: si hay >1 unidades, decrementa; si queda 1, muestra confirmación
    const handleTicketDelete = async (item, index) => {
      if (item.unidades > 1) {
        await axios.post("teclado/clickTeclaArticulo", {
          idArticulo: item.idArticulo,
          gramos: 0,
          idCesta: selectTable.value._id,
          unidades: -1,
          arraySuplementos: item.arraySuplementos || null,
          nombre: item.nombre,
        });
      } else {
        pendingDelete.value = index;
      }
    };

    // Borra por índice del ticket (usado desde la confirmación)
    const removeFromTicket = (item, index) => {
      store.dispatch("Tables/removeProduct", index);
    };

    onMounted(() => {
      totalTable.value = 0;
      if (SelectEmployer.value == null) {
        router.push("/");
      }
      products.value.arrayTeclas.sort((a, b) =>
        a.nombreArticulo.localeCompare(b.nombreArticulo, undefined, {
          sensitivity: "base",
        }),
      );
    });

    return {
      actualPage,
      selectOtherEmployer,
      router,
      selectOtherTable,
      selectOtherCategory,
      removeProduct,
      hideInfo,
      pendingDelete,
      removeFromTicket,
      handleTicketDelete,
      categories,
      selectTable,
      suplSelected,
      addProduct,
      totalTable,
      suplModal,
      SelectEmployer,
      suplArticle,
      selectSuplements,
      products,
      menuModal,
      menuArticles,
      menuSelected,
      deleteAll,
      openEditModal,
      handleTicketClick,
      showEditModal,
      editProductIndex,
      seleccionadoPorFamilia,
      setSeleccionFamilia,
      suplByFamily,
      familiasAbiertas,
      toggleFamilia,
      confirmarSuplementos,
      onConfirmarMenu,
      currentSalaName: computed(() => {
        const id = store.state.Tables.salaId;
        const list = store.state.Tables.salas;
        const found = list.find((s) => s.id === id);
        return found ? found.name : id === "MESAS" ? "Principal" : id;
      }),
    };
  },
};
</script>

<style lang="scss" scoped>
.unified-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 15px;
  gap: 15px;
  background-color: #f8f9fa;
  overflow: hidden;
}

.top-header {
  display: flex;
  gap: 15px;
}

.header-item {
  flex: 1;
  background-color: #ffffff69;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    background-color: #ffffff80;
    border-color: #dee2e6;
  }
}

.header-icon {
  font-size: 1.2rem;
  color: #007bff;
}

.header-text {
  font-weight: 500;
  font-size: 1.05rem;
}

.room-pill {
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
}

.separator {
  margin: 0 8px;
  color: #adb5bd;
}

/* Ticket Section */
.unified-ticket-section {
  display: flex;
  gap: 15px;
  height: 35vh;
  min-height: 200px;
}

.ticket-lines-container {
  flex: 1;
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e9ecef;
  min-height: 0;
}

.ticket-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-ticket {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #adb5bd;
  font-weight: 500;
  font-size: 1.1rem;
}

.ticket-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f3f5;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  user-select: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
}

.ticket-line-content {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 15px;
}

.ticket-qty {
  font-weight: 700;
  color: #495057;
  background-color: #f8f9fa;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.95rem;
  padding: 0 6px;
  border: 1px solid #e9ecef;
}

.ticket-name {
  flex: 1;
  font-weight: 600;
  color: #212529;
  font-size: 1rem;
  line-height: 1.3;
}

.ticket-price {
  font-weight: 700;
  color: #212529;
  font-size: 1.05rem;
}

.delete-line-btn {
  background: none;
  color: #adb5bd;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s ease;
  font-size: 1.1rem;
  margin-left: 12px;
  flex-shrink: 0;

  &:hover {
    color: #fa5252;
  }
}

.confirm-mode {
  background-color: #fff5f5 !important;
  border-color: #ffc9c9 !important;
}

.confirm-text {
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.3;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  margin-left: 10px;
  flex-shrink: 0;
}

.confirm-cancel-btn {
  background: #f1f3f5;
  color: #868e96;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e9ecef;
  }
}

.confirm-delete-btn {
  background: #fa5252;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e03131;
  }
}

.ticket-actions-container {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ticket-total-display {
  background-color: #ffffff69;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  border: 2px solid #28a745;
}

.ticket-total-amount {
  color: #28a745;
}

.action-btn {
  flex: 1;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 10px;
}

/* Breadcrumb */
.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background-color: #ffffff80;
    border-color: #dee2e6;
  }
}

.back-icon {
  color: #007bff;
  font-size: 1.2rem;
}

.breadcrumb-text {
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
}

.products-count-badge {
  background-color: #28a745;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  margin-left: auto;
}

/* Products Grid */
.products-grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: min-content;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;
  min-height: 0;
}

.product-grid-item {
  position: relative;
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    background-color: #ffffff80;
    border-color: #dee2e6;
  }
}

.product-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.product-grid-name {
  font-weight: bold;
  font-size: 1.05rem;
  color: #343a40;
  line-height: 1.2;
}

.product-grid-price {
  font-weight: bold;
  color: #28a745;
  font-size: 1.1rem;
  white-space: nowrap;
}

.product-grid-actions-simple {
  display: none;
}

.grid-qty-display-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
  border: 2px solid white;
}

.grid-btn {
  display: none;
}

.grid-qty-display {
  display: none;
}

// Los estilos de modales se han movido a sus respectivos componentes para mayor limpieza.

.room-pill {
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
}

.separator {
  margin: 0 8px;
  color: #adb5bd;
  font-weight: 300;
}

.table-text {
  font-weight: 500;
  color: #343a40;
}

.diners-text {
  font-weight: 500;
  color: #495057;
  display: inline-flex;
  align-items: center;
}

.supplement-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
}

.supplement-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-icon {
  font-size: 1.3rem;
  color: #dee2e6;
  transition: color 0.3s ease;

  &.selected {
    color: #007bff;
  }
}

.btn-suple-familia {
  .suple-btn-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    justify-content: flex-start;
  }
  .selection-icon-by-family {
    font-size: 1rem;
    color: #dee2e6;
    transition: color 0.3s ease;
    &.selected {
      color: #007bff;
    }
  }
  .suple-btn-nombre {
    flex: 1 1 auto;
    text-align: left;
    white-space: normal;
    word-break: break-word;
  }
}

.supplement-name {
  font-size: 1rem;
  color: #333;
}

.supplement-price {
  font-size: 1rem;
  font-weight: bold;
  color: #28a745;
}

.cancel-btn,
.confirm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
}
#suplModal {
  z-index: 1200 !important;
}
#menuModal {
  z-index: 1100 !important;
}

/* Media Queries para Responsive (Móvil y Tablet) */
@media (max-width: 768px) {
  .top-header {
    flex-direction: column;
    gap: 10px;
  }

  .header-item {
    padding: 10px;
  }

  .unified-ticket-section {
    flex-direction: column;
    height: auto;
    min-height: unset;
    gap: 10px;
  }

  .ticket-lines-container {
    max-height: 200px;
  }

  .ticket-actions-container {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .ticket-total-display {
    width: 100%;
    padding: 10px;
  }

  .action-btn {
    flex: 1;
    font-size: 1rem;
    padding: 10px;
  }

  .breadcrumb-container {
    padding: 10px;
    flex-wrap: wrap;
  }

  .products-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .product-grid-item {
    padding: 10px;
    gap: 10px;
  }

  .product-grid-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .product-grid-name {
    font-size: 0.95rem;
  }

  .product-grid-price {
    font-size: 1rem;
  }

  .grid-btn {
    width: 32px;
    height: 32px;
  }

  .grid-qty-display {
    font-size: 1rem;
  }
}

.supplement-indicator-icon {
  font-size: 0.9rem;
  transition: all 0.3s ease;
  color: #007bff;
}

.ticket-line:hover .supplement-indicator-icon {
  transform: scale(1.2);
}
</style>
