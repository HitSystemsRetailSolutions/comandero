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

    <!-- Grid de Categorías -->
    <div class="categories-grid-container">
      <div
        v-for="(x, i) in categories"
        :key="i"
        class="category-grid-item"
        @click="selectCategory(i, null)"
        :class="{ 'category-expanded': subMenus && selectedSubcategory == i }"
      >
        <div class="category-grid-content">
          <MDBIcon icon="folder" class="category-grid-icon" />
          <span class="category-grid-name">{{ x.nombre }}</span>

          <MDBIcon
            v-if="subMenus"
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
            <MDBIcon icon="folder-open" class="subcategory-icon" />
            <span class="subcategory-name">{{ z.nombre }}</span>
            <span class="subcategory-count">{{
              z.arrayTeclas?.length || 0
            }}</span>
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

    const selectCategory = (i, x) => {
      if (subMenus.value && x == null) return (selectedSubcategory.value = i);
      let cat = subMenus.value
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

/* Categories Grid */
.categories-grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: min-content;
  margin-top: 5%;
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
