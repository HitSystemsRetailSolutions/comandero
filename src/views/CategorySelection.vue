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
              selectTable.nombre
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
                <MDBIcon :icon="x.unidades > 1 && !x.promocion ? 'minus' : 'trash-alt'" />
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
                    removeProduct(x, i);
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


        <button class="action-btn cobrar-btn" @click="router.push('/ticketview')">
          <span class="btn-icon-wrap"><MDBIcon icon="cash-register" /></span>
          <span class="btn-label">Cobrar</span>
          <span class="btn-arrow">→</span>
        </button>

        <button class="action-btn nota-btn" @click="imprimirNota()">
          <span class="btn-icon-wrap"><MDBIcon icon="sticky-note" /></span>
          <span class="btn-label">Nota</span>
        </button>
      </div>
    </div>

    <!-- Seccion Toolbar y Visualizacion de Categorias -->
    <div class="category-toolbar">
      <div class="toolbar-title-section">
        <template v-if="viewMode === 'carpetas' && activeFolderIndex !== null">
          <button class="back-folder-btn" @click="activeFolderIndex = null">
            <MDBIcon icon="arrow-left" class="me-2" />
            <span>Volver</span>
          </button>
          <span class="folder-separator">/</span>
          <span class="current-folder-name">
            <MDBIcon icon="folder-open" class="me-2 text-warning" />
            {{ categories[activeFolderIndex]?.nombre }}
          </span>
        </template>
        <template v-else>
          <span class="toolbar-title">
            <MDBIcon icon="layer-group" class="me-2 text-primary" />
            Menús y Categorías
          </span>
        </template>
      </div>

      <div class="view-mode-selector">
        <button
          type="button"
          class="view-mode-btn"
          :class="{ active: viewMode === 'carpetas' }"
          @click="setViewMode('carpetas')"
          title="Modo Carpetas"
        >
          <MDBIcon icon="folder" />
          <span class="view-mode-label">Carpetas</span>
        </button>
        <button
          type="button"
          class="view-mode-btn"
          :class="{ active: viewMode === 'actual' }"
          @click="setViewMode('actual')"
          title="Modo Actual (Grid)"
        >
          <MDBIcon icon="th-large" />
          <span class="view-mode-label">Cuadrícula</span>
        </button>
        <button
          type="button"
          class="view-mode-btn"
          :class="{ active: viewMode === 'lista' }"
          @click="setViewMode('lista')"
          title="Modo Lista"
        >
          <MDBIcon icon="list" />
          <span class="view-mode-label">Lista</span>
        </button>
      </div>
    </div>

    <!-- MODO ACTUAL (Grid con acordeón inline) -->
    <div v-if="viewMode === 'actual'" class="categories-grid-container">
      <div
        v-for="(x, i) in categories"
        :key="i"
        class="category-grid-item"
        @click="selectCategoryActual(i)"
        :class="{ 'category-expanded': subMenus && selectedSubcategory == i }"
      >
        <div class="category-grid-content">
          <MDBIcon icon="folder" class="category-grid-icon" />
          <span class="category-grid-name">{{ x.nombre }}</span>

          <MDBIcon
            v-if="subMenus && x.arraySubmenus?.length"
            :icon="selectedSubcategory == i ? 'chevron-up' : 'chevron-down'"
            class="expand-icon"
          />
        </div>

        <!-- Subcategorías (si hay) -->
        <div
          v-if="subMenus && selectedSubcategory == i"
          class="subcategories-grid"
          @click.stop
        >
          <div
            v-for="(z, n) in x.arraySubmenus"
            :key="n"
            class="subcategory-grid-item"
            @click.stop="selectCategory(i, n)"
          >
            <MDBIcon icon="layer-group" class="subcategory-icon me-2" />
            <span class="subcategory-name">{{ z.nombre }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODO CARPETAS (Navegación por carpetas / Drill-down) -->
    <div v-else-if="viewMode === 'carpetas'" class="categories-folder-container">
      <!-- Nivel Raíz: Carpetas Principales -->
      <div v-if="activeFolderIndex === null" class="categories-grid-container">
        <div
          v-for="(x, i) in categories"
          :key="i"
          class="category-folder-card"
          @click="openFolderOrSelect(i)"
        >
          <div class="folder-card-top">
            <div class="folder-icon-wrapper">
              <MDBIcon icon="folder" class="folder-main-icon" />
            </div>
            <span v-if="subMenus && x.arraySubmenus?.length" class="submenus-badge">
              {{ x.arraySubmenus.length }} submenús
            </span>
          </div>
          <div class="folder-card-body">
            <span class="folder-card-title">{{ x.nombre }}</span>
          </div>
        </div>
      </div>

      <!-- Dentro de una Carpeta: Subcategorías -->
      <div v-else class="folder-contents-view">
        <div class="subcategories-folder-grid">
          <div
            v-for="(z, n) in categories[activeFolderIndex]?.arraySubmenus"
            :key="n"
            class="subcategory-folder-card"
            @click="selectCategory(activeFolderIndex, n)"
          >
            <div class="subcategory-icon-wrapper">
              <MDBIcon icon="layer-group" class="subfolder-icon" />
            </div>
            <span class="subcategory-folder-name">{{ z.nombre }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODO LISTA (Vista en Lista Vertical) -->
    <div v-else-if="viewMode === 'lista'" class="categories-list-container">
      <div
        v-for="(x, i) in categories"
        :key="i"
        class="category-list-wrapper"
      >
        <div
          class="category-list-header"
          :class="{ 'is-expanded': expandedListCategories[i] }"
          @click="handleCategoryListClick(i)"
        >
          <div class="category-list-info">
            <MDBIcon
              :icon="expandedListCategories[i] ? 'folder-open' : 'folder'"
              class="category-list-icon me-3"
            />
            <span class="category-list-name">{{ x.nombre }}</span>
          </div>

          <div class="category-list-right">
            <span
              v-if="subMenus && x.arraySubmenus?.length"
              class="category-list-badge me-2"
            >
              {{ x.arraySubmenus.length }} submenús
            </span>
            <MDBIcon
              v-if="subMenus && x.arraySubmenus?.length"
              :icon="expandedListCategories[i] ? 'chevron-up' : 'chevron-down'"
              class="list-expand-icon"
            />
            <MDBIcon v-else icon="chevron-right" class="list-navigate-icon" />
          </div>
        </div>

        <!-- Subcategorías en Lista -->
        <div
          v-if="subMenus && x.arraySubmenus?.length && expandedListCategories[i]"
          class="subcategory-list-body"
        >
          <div
            v-for="(z, n) in x.arraySubmenus"
            :key="n"
            class="subcategory-list-item"
            @click="selectCategory(i, n)"
          >
            <div class="subcategory-list-prefix">
              <MDBIcon icon="angle-right" class="sub-item-arrow me-2" />
              <MDBIcon icon="layer-group" class="sub-item-icon me-2" />
            </div>
            <span class="subcategory-list-name">{{ z.nombre }}</span>
            <MDBIcon icon="chevron-right" class="sub-navigate-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Product Modal -->
    <EditProductModal v-model="showEditModal" :index="editProductIndex" />
  </div>
</template>

<script>
import {
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";
import axios from "axios";
import Swal from "sweetalert2";
import EditProductModal from "@/components/EditProductModal.vue";

export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBListGroupItem,
    MDBBtn,
    EditProductModal,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const totalTable = ref(0);
    const pendingDelete = ref(null);
    const showEditModal = ref(false);
    const editProductIndex = ref(null);
    const lastClickTime = ref(0);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer,
    );
    const selectTable = computed(() => store.state.Tables.selectedTable);
    const categories = computed(() => store.state.Categories.arrayCategories);
    const subMenus = ref(null);
    const actualPage = computed(() => route.currentRoute.value.path);
    const selectedSubcategory = ref(-1);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const imprimirNota = () => {
      if (!selectTable.value._id)
        return Swal.fire("Oops...", "Mesa inactiva. No se puede imprimir", "error");
      axios
        .post("cestas/imprimirNotaMesa", {
          idCesta: selectTable.value._id,
          idTrabajador: SelectEmployer.value._id,
        })
        .then((res) => {
          if (!res.data) throw Error("No se ha podido imprimir la cesta");
          Swal.fire({
            toast: true, position: "top-end", icon: "success",
            title: "Se ha enviado la mesa a imprimir",
            showConfirmButton: false, timer: 1500,
          });
        })
        .catch((err) => {
          Swal.fire({
            toast: true, position: "top-end", icon: "error",
            title: err.message, showConfirmButton: false, timer: 1500,
          });
        });
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

    const viewMode = ref(localStorage.getItem("categoryViewMode") || "actual");
    const activeFolderIndex = ref(null);
    const expandedListCategories = ref({});

    const setViewMode = (mode) => {
      viewMode.value = mode;
      localStorage.setItem("categoryViewMode", mode);
      activeFolderIndex.value = null;
    };

    const openFolderOrSelect = (i) => {
      const cat = categories.value[i];
      if (subMenus.value && cat?.arraySubmenus?.length > 0) {
        activeFolderIndex.value = i;
      } else {
        selectCategory(i, null);
      }
    };

    const selectCategoryActual = (i) => {
      const cat = categories.value[i];
      if (subMenus.value && cat?.arraySubmenus?.length > 0) {
        selectedSubcategory.value = selectedSubcategory.value === i ? -1 : i;
      } else {
        selectCategory(i, null);
      }
    };

    const handleCategoryListClick = (i) => {
      const cat = categories.value[i];
      if (subMenus.value && cat?.arraySubmenus?.length > 0) {
        expandedListCategories.value[i] = !expandedListCategories.value[i];
      } else {
        selectCategory(i, null);
      }
    };

    const selectCategory = (i, x) => {
      let cat =
        subMenus.value && x !== null && x !== undefined
          ? categories.value[i].arraySubmenus[x]
          : categories.value[i];

      store.dispatch("Categories/setSelectedCategoryMutation", cat);
      router.push("/productselection");
    };

    onMounted(() => {
      if (!SelectEmployer.value) router.push("/");

      if (subMenus.value == null)
        subMenus.value = categories.value[0]?.arrayTeclas?.length == undefined;
    });

    // Si hay más de 1 unidad → decrementa sin confirmar; si queda 1 → muestra confirmación
    const handleTicketDelete = async (item, index) => {
      if (item.unidades > 1 && !item.promocion) {
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

    const removeProduct = (productoSeleccionado, index) => {
      store.dispatch("Tables/removeProduct", index);
    };

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

    return {
      viewMode,
      activeFolderIndex,
      expandedListCategories,
      setViewMode,
      openFolderOrSelect,
      selectCategoryActual,
      handleCategoryListClick,
      actualPage,
      removeProduct,
      handleTicketDelete,
      pendingDelete,
      selectOtherEmployer,
      selectedSubcategory,
      router,
      selectOtherTable,
      selectTable,
      selectCategory,
      deleteAll,
      subMenus,
      SelectEmployer,
      totalTable,
      showEditModal,
      editProductIndex,
      openEditModal,
      handleTicketClick,
      imprimirNota,

      categories,
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
  gap: 8px;
}

.total-summary {
  background: white;
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .total-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #adb5bd;
  }

  .total-amount {
    font-size: 1.55rem;
    font-weight: 800;
    color: #2d8a5e;
    letter-spacing: -0.03em;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  height: 52px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

  &:active {
    transform: scale(0.97);
  }

  .btn-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.85rem;
  }

  .btn-label {
    flex: 1;
    text-align: left;
  }
}

.cobrar-btn {
  background: #e6f7ef;
  color: #1a7a4a;
  border: 1.5px solid #b8e6d0;
  height: 64px;
  font-size: 1.1rem;

  .btn-icon-wrap {
    background: #c8f0dc;
    color: #1a7a4a;
  }

  .btn-arrow {
    font-size: 1.1rem;
    opacity: 0.5;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  &:hover {
    background: #d4f0e2;
    border-color: #8fd4b4;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26, 122, 74, 0.12);

    .btn-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }
}

.nota-btn {
  background: #edf2ff;
  color: #3b6bdb;
  border: 1.5px solid #c5d4f7;

  .btn-icon-wrap {
    background: #d6e2fc;
    color: #3b6bdb;
  }

  &:hover {
    background: #dce6fc;
    border-color: #9db8f0;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 107, 219, 0.1);
  }
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

/* Categories Grid */
.categories-grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: min-content;
  margin-top: 10px;
  padding: 5px;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;
  min-height: 0;
}

.category-grid-item {
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: #ffffff80;
    border-color: #007bff;
  }

  &.category-expanded {
    grid-column: 1 / -1;
    background-color: #ffffff80;
    border-color: #007bff;
  }
}

.category-grid-content {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-grid-icon {
  font-size: 1.5rem;
  color: #007bff;
}

.category-grid-name {
  flex: 1;
  font-size: 1.1rem;
  font-weight: bold;
  color: #343a40;
}

.category-grid-count {
  background-color: #007bff;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.3);
  border-top: 1px solid #e9ecef;
}

.subcategory-grid-item {
  background-color: transparent;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: none;
  border: 1px solid #e9ecef;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.02);
  }
}

.subcategory-icon {
  color: #6c757d;
}

.subcategory-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.95rem;
}

.subcategory-count {
  background-color: #6c757d;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

/* Category Toolbar & View Mode Selector */
.category-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff69;
  padding: 10px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  margin-top: 5px;
}

.toolbar-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #343a40;
  display: flex;
  align-items: center;
}

.back-folder-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;

  &:hover {
    background: #0056b3;
  }
}

.folder-separator {
  color: #adb5bd;
  font-weight: bold;
}

.current-folder-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #212529;
}

.view-mode-selector {
  display: flex;
  background: #e9ecef;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.view-mode-btn {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: #212529;
    background: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: #ffffff;
    color: #007bff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

/* Modo Carpetas Styles */
.categories-folder-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.category-folder-card {
  background-color: #ffffff69;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 123, 255, 0.12);
    border-color: #007bff;
    background-color: #ffffff90;
  }
}

.folder-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.folder-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-main-icon {
  font-size: 1.4rem;
  color: #0288d1;
}

.submenus-badge {
  background-color: #e9ecef;
  color: #495057;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
}

.folder-card-body {
  margin-top: 4px;
}

.folder-card-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #212529;
}

.folder-contents-view {
  flex: 1;
  overflow-y: auto;
  padding: 10px 5px;
}

.subcategories-folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.subcategory-folder-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    background-color: #f8f9fa;
  }
}

.subcategory-icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #f1f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007bff;
}

.subfolder-icon {
  font-size: 1.1rem;
}

.subcategory-folder-name {
  font-weight: 600;
  font-size: 1rem;
  color: #343a40;
}

/* Modo Lista Styles */
.categories-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 10px 5px;
  min-height: 0;
}

.category-list-wrapper {
  background-color: #ffffff69;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  overflow: visible;
  flex-shrink: 0;
}

.category-list-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.2s ease, border-left 0.2s ease;

  &:hover {
    background-color: #ffffff80;
  }

  &.is-expanded {
    background-color: #e8f0fe;
    border-left: 4px solid #007bff;
  }
}

.category-list-info {
  display: flex;
  align-items: center;
}

.category-list-icon {
  font-size: 1.3rem;
  color: #007bff;
}

.category-list-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #212529;
}

.category-list-right {
  display: flex;
  align-items: center;
}

.category-list-badge {
  background-color: #e9ecef;
  color: #495057;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.list-expand-icon,
.list-navigate-icon {
  color: #adb5bd;
  font-size: 0.95rem;
}

.subcategory-list-body {
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 8px 14px 12px 28px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 0 0 10px 10px;
}

.subcategory-list-item {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #e3f2fd;
    border-color: #90caf9;
    transform: translateX(4px);
  }
}

.subcategory-list-prefix {
  display: flex;
  align-items: center;
}

.sub-item-arrow {
  color: #adb5bd;
}

.sub-item-icon {
  color: #007bff;
  font-size: 0.9rem;
}

.subcategory-list-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
  color: #343a40;
}

.sub-navigate-icon {
  color: #ced4da;
  font-size: 0.85rem;
}

/* Media Queries para Responsive (Móvil y Tablet) */
@media (max-width: 768px) {
  .category-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .view-mode-selector {
    justify-content: center;
  }

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
    gap: 8px;
  }

  .total-summary {
    width: 100%;
    padding: 10px 14px;

    .total-amount {
      font-size: 1.25rem;
    }
  }

  .cobrar-btn {
    flex: 2;
    height: 52px;
    font-size: 1rem;
  }

  .nota-btn {
    flex: 1;
    height: 52px;
    font-size: 0.95rem;
  }

  .categories-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  .category-grid-content {
    padding: 15px 10px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .category-grid-name {
    font-size: 1rem;
  }

  .category-grid-icon {
    font-size: 1.8rem;
  }

  .subcategories-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }

  .subcategory-grid-item {
    padding: 10px;
    flex-direction: column;
    text-align: center;
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
