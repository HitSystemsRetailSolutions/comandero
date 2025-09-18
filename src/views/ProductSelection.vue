<template>
  <div>
    <!-- Header colapsible -->
    <MDBListGroup class="employerList">
      <MDBListGroupItem class="info-toggle" @click="hideInfo = !hideInfo">
        <div class="toggle-content">
          <MDBIcon :icon="hideInfo ? 'eye' : 'eye-slash'" class="toggle-icon" />
          <span class="toggle-text"
            >{{ hideInfo ? "Mostrar" : "Ocultar" }} información</span
          >
          <MDBIcon
            :icon="hideInfo ? 'chevron-down' : 'chevron-up'"
            class="chevron-icon"
          />
        </div>
      </MDBListGroupItem>

      <div v-if="!hideInfo" class="info-panel">
        <MDBListGroupItem @click="selectOtherEmployer" class="info-item">
          <div class="info-content">
            <MDBIcon icon="user-tag" class="info-icon" />
            <span class="info-text">{{ SelectEmployer.nombre }}</span>
          </div>
        </MDBListGroupItem>
        <MDBListGroupItem @click="selectOtherTable" class="info-item">
          <div class="info-content">
            <MDBIcon icon="shopping-basket" class="info-icon" />
            <span class="info-text"
              >{{
                selectTable?.nombre
                  ? selectTable.nombre
                  : "Mesa " + (selectTable.indexMesa + 1)
              }}
              | {{ selectTable.comensales }} comensales</span
            >
          </div>
        </MDBListGroupItem>
        <MDBListGroupItem
          class="info-item ticket-info"
          @click="router.push('/ticketview')"
        >
          <div class="ticketBtn">
            <div class="ticket-amount">
              <MDBIcon icon="hand-holding-usd" class="info-icon" />
              <span class="amount-text">
                {{
                  (
                    selectTable.detalleIva.importe1 +
                    selectTable.detalleIva.importe2 +
                    selectTable.detalleIva.importe3 +
                    selectTable.detalleIva.importe4 +
                    selectTable.detalleIva.importe5
                  ).toFixed(2)
                }}€
              </span>
            </div>
            <span class="ticket-label">Ver ticket</span>
          </div>
        </MDBListGroupItem>
      </div>
    </MDBListGroup>

    <div class="section-divider"></div>

    <!-- Navegación de categoría -->
    <div class="category-nav">
      <MDBListGroupItem @click="selectOtherCategory" class="category-header">
        <div class="category-nav-content">
          <MDBIcon icon="arrow-left" class="back-icon" />
          <div class="category-info">
            <MDBIcon icon="folder-open" class="category-icon" />
            <span class="category-name">{{ products.nombre }}</span>
          </div>
        </div>
      </MDBListGroupItem>
    </div>

    <!-- Lista de productos mejorada -->
    <div class="products-section">
      <div class="products-header">
        <MDBIcon icon="utensils" />
        <span>Productos disponibles</span>
        <span class="products-count">
          {{ products.arrayTeclas.filter((prods) => prods.esSumable).length }}
        </span>
      </div>

      <MDBListGroup class="products-list">
        <MDBListGroupItem
          v-for="(x, i) in products.arrayTeclas.filter(
            (prods) => prods.esSumable
          )"
          :key="i"
          class="product-item"
        >
          <div class="product-card">
            <!-- Botón quitar -->
            <div
              class="quantity-control remove-btn"
              @click="removeProduct(x, i)"
            >
              <MDBIcon icon="minus" class="control-icon" />
            </div>

            <!-- Información del producto -->
            <div class="product-info">
              <div class="product-header">
                <MDBIcon icon="utensils" class="product-icon" />
                <span class="product-name">{{ x.nombreArticulo }}</span>
              </div>
              <div class="product-details">
                <span class="product-price">{{ x.precioConIva }}€</span>
                <div class="quantity-display">
                  <span class="quantity-label">Cantidad:</span>
                  <span class="quantity-value">
                    {{
                      (selectTable.lista.filter(
                        (products) => products.idArticulo == x.idArticle
                      )[0]?.arraySuplementos?.length > 0
                        ? selectTable.lista.filter(
                            (products) => products.idArticulo == x.idArticle
                          ).length
                        : selectTable.lista.filter(
                            (products) => products.idArticulo == x.idArticle
                          )[0]?.unidades) || 0
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botón añadir -->
            <div
              class="quantity-control add-btn"
              @click="
                x?.suplementos?.length > 0
                  ? selectSuplements(x, i)
                  : addProduct(x, i)
              "
            >
              <MDBIcon
                :icon="x?.suplementos?.length > 0 ? 'plus-circle' : 'plus'"
                class="control-icon"
              />
            </div>
          </div>
        </MDBListGroupItem>
      </MDBListGroup>
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
      class="menu-modal"
    >
      <MenuModal
        v-model="menuModal"
        :menuSelected="menuSelected"
        :suplByFamily="suplByFamily"
        @confirmarMenu="onConfirmarMenu"
      />
    </MDBModal>
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
  MDBPopconfirm,
} from "mdb-vue-ui-kit";
import SuplementosModal from "@/components/SuplementosModal.vue";
import MenuModal from "@/components/MenuModal.vue";

import { useStore } from "vuex";
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";

export default {
  name: "MenuPrincipalView",

  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBPopconfirm,
    MDBBtn,
    MDBListGroupItem,
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBCheckbox,
    MDBModalFooter,
    SuplementosModal,
    MenuModal,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const totalTable = ref(0);
    const hideInfo = ref(false);
    const suplModal = ref(false);
    const categories = computed(() => store.state.Categories.arrayCategories);
    const suplArticle = ref(null);
    const arraySuplementosSelected = ref(null);
    const suplSelected = ref(null);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
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
        a.localeCompare(b)
      );
      const resultado = {};
      familiasOrdenadas.forEach((fam) => {
        resultado[fam] = grupos[fam].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
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

    const addProduct = async (x, i) => {
      console.log("addProduct-SelPorFam", seleccionadoPorFamilia.value);
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
        }
      );
      suplArticle.value = null;
      seleccionadoPorFamilia.value = null;
    };
    const removeProduct = async (x, i) => {
      let z = selectTable.value.lista.filter(
        (products) => products.idArticulo == x.idArticle
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
            selectTable.value.lista.indexOf(z[0])
          );
        }
      }
    };

    onMounted(() => {
      totalTable.value = 0;
      if (SelectEmployer.value == null) {
        router.push("/");
      }
      products.value.arrayTeclas.sort((a, b) => {
        if (a.nombreArticulo < b.nombreArticulo) return -1;
        if (a.nombreArticulo > b.nombreArticulo) return 1;
        return 0;
      });
    });

    return {
      actualPage,
      selectOtherEmployer,
      router,
      selectOtherTable,
      selectOtherCategory,
      removeProduct,
      hideInfo,
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
      seleccionadoPorFamilia,
      setSeleccionFamilia,
      suplByFamily,
      familiasAbiertas,
      toggleFamilia,
      confirmarSuplementos,
      onConfirmarMenu,
    };
  },
};
</script>

<style lang="scss" scoped>
.employerList {
  width: 100%;
  margin-top: 2%;
}

.info-toggle {
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e9ecef;
    border-color: #dee2e6;
  }
}

.toggle-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-icon {
  font-size: 1.2rem;
  color: #007bff;
}

.toggle-text {
  font-weight: 500;
  color: #495057;
}

.chevron-icon {
  font-size: 1rem;
  color: #6c757d;
  transition: transform 0.3s ease;
}

.info-panel {
  margin-top: 10px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.info-item {
  background-color: #ffffff69;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #ffffff80;
  }

  &:last-child {
    border-bottom: none;
  }
}

.info-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 1.1rem;
  color: #666;
  min-width: 20px;
}

.info-text {
  font-size: 0.95rem;
}

.ticket-info {
  background-color: #f8f9fa !important;
}

.ticketBtn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.ticket-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #28a745;
}

.ticket-label {
  font-size: 0.85rem;
  font-style: italic;
  color: #666;
}

.section-divider {
  height: 3px;
  background: linear-gradient(90deg, #e9ecef 0%, #dee2e6 50%, #e9ecef 100%);
  margin: 20px 0;
  border-radius: 2px;
}

.category-nav {
  margin-bottom: 20px;
}

.category-header {
  background-color: #ffffff69;
  padding: 15px 20px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ffffff80;
    border-color: #007bff;
    transform: translateY(-1px);
  }
}

.category-nav-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-icon {
  font-size: 1.2rem;
  color: #007bff;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  font-size: 1.1rem;
  color: #6c757d;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.products-section {
  margin-top: 20px;
}

.products-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: 600;
  color: #495057;
  border-left: 4px solid #28a745;
}

.products-count {
  background-color: #28a745;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-left: auto;
}

.products-list {
  width: 100%;
}

.product-item {
  background-color: #ffffff69;
  margin-bottom: 10px;
  border-radius: 12px;
  padding: 0;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ffffff80;
    border-color: #dee2e6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.product-card {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &.remove-btn {
    background-color: #dc3545;
    color: white;

    &:hover {
      background-color: #c82333;
      transform: scale(1.1);
    }
  }

  &.add-btn {
    background-color: #28a745;
    color: white;

    &:hover {
      background-color: #218838;
      transform: scale(1.1);
    }
  }
}

.control-icon {
  font-size: 1.5rem;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-icon {
  font-size: 1.2rem;
  color: #007bff;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.product-details {
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-price {
  font-size: 1rem;
  font-weight: bold;
  color: #28a745;
}

.quantity-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-label {
  font-size: 0.9rem;
  color: #6c757d;
}

.quantity-value {
  background-color: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

// Modal styles
.supplements-modal {
  .modal-header-custom {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
  }

  .modal-title-custom {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2rem;
    font-weight: 600;
    color: #495057;
  }

  .modal-body-custom {
    background-color: #fff9f2;
    padding: 20px;
  }

  .modal-footer-custom {
    background-color: #f8f9fa;
    border-top: 2px solid #e9ecef;
    gap: 10px;
  }
}

.supplements-list {
  background-color: transparent;
}

.supplement-item {
  background-color: #ffffff;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #007bff;
    transform: translateY(-1px);
  }

  &.supplement-selected {
    background-color: #e7f3ff;
    border-color: #007bff;
  }
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
</style>
