<template>
  <div class="unified-layout">
    <!-- Header: Trabajador | Información General -->
    <div class="top-header">
      <div class="header-item" @click="selectOtherEmployer">
        <MDBIcon icon="user-tag" class="header-icon" />
        <span class="header-text">{{ SelectEmployer.nombre }}</span>
      </div>
    </div>

    <!-- Room Selector (Salas) - Grid Style -->
    <div class="categories-grid-container rooms-section">
      <div
        v-for="sala in salas"
        :key="sala.id"
        class="category-grid-item room-item"
        :class="{ 'category-expanded': selectedSala === sala.id }"
        @click="selectSala(sala.id)"
      >
        <div class="category-grid-content">
          <MDBIcon
            :icon="sala.icon || 'door-open'"
            class="category-grid-icon"
          />
          <span class="category-grid-name">{{ sala.name }}</span>
        </div>
      </div>
    </div>

    <!-- Section Title -->
    <div class="breadcrumb-container">
      <MDBIcon icon="th" class="back-icon" />
      <span class="breadcrumb-text">Mesas en {{ selectedSalaName }}</span>
    </div>

    <!-- Grid de Mesas -->
    <div class="products-grid-container">
      <div
        v-for="(x, i) in filteredTables"
        :key="i"
        class="product-grid-item table-item"
        :class="{ 'in-use-card': x.lista?.length > 0 }"
        @click="selectTable(x)"
      >
        <div class="product-grid-header">
          <span class="product-grid-name">{{
            x.nombre ? x.nombre : "Mesa " + (x.indexMesa + 1)
          }}</span>
          <span class="product-grid-price" v-if="x.lista?.length > 0">
            {{ calculateTotal(x) }}€
          </span>
          <span class="product-grid-price available-text" v-else>Libre</span>
        </div>

        <div class="product-grid-actions-simple">
          <div class="grid-qty-display-badge" v-if="x.lista?.length > 0">
            {{ x.lista.length }}
          </div>
          <MDBIcon
            :icon="x.lista?.length > 0 ? 'chair' : 'border-all'"
            class="table-grid-status-icon"
            :class="{ 'text-danger': x.lista?.length > 0 }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { MDBIcon } from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "TableSelectionView",
  components: {
    MDBIcon,
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const salas = computed(() => store.state.Tables.salas);
    const tables = computed(() => store.state.Tables.arrayTables);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer,
    );

    const selectedSala = ref("MESAS");

    onMounted(async () => {
      if (!SelectEmployer.value) {
        router.push("/employer");
        return;
      }
      await store.dispatch("Tables/fetchSalas");
      await store.dispatch("Tables/fetchMesas", "MESAS");
    });

    const selectSala = async (id) => {
      selectedSala.value = id;
      await store.dispatch("Tables/fetchMesas", id);
    };

    const filteredTables = computed(() => {
      return tables.value;
    });

    const selectedSalaName = computed(() => {
      const found = salas.value.find((s) => s.id === selectedSala.value);
      return found
        ? found.name
        : selectedSala.value === "MESAS"
        ? "Principal"
        : selectedSala.value;
    });

    const selectTable = async (x) => {
      await store.dispatch("Tables/setSelectedTable", x);
      router.push("/clientsInTableSelection");
    };

    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    const calculateTotal = (table) => {
      if (!table.detalleIva) return "0.00";
      const { importe1, importe2, importe3, importe4, importe5 } =
        table.detalleIva;
      return (
        (importe1 || 0) +
        (importe2 || 0) +
        (importe3 || 0) +
        (importe4 || 0) +
        (importe5 || 0)
      ).toFixed(2);
    };

    return {
      selectTable,
      selectOtherEmployer,
      salas,
      filteredTables,
      selectedSala,
      selectSala,
      SelectEmployer,
      selectedSalaName,
      calculateTotal,
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

.rooms-section {
  flex: 0 0 auto !important;
  max-height: 120px;
  padding-bottom: 5px !important;
  overflow: scroll;
}

.room-item {
  .category-grid-content {
    padding: 12px 15px;
  }
  .category-grid-icon {
    font-size: 1.2rem;
  }
  .category-grid-name {
    font-size: 0.95rem;
  }

  &.category-expanded {
    background-color: #e7f3ff;
    border-color: #007bff;
  }
}

/* Breadcrumb / Section ID */
.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
}

.back-icon {
  color: #007bff;
  font-size: 1.1rem;
}

.breadcrumb-text {
  font-weight: bold;
  font-size: 1rem;
  color: #333;
}

/* Mesas Grid */
.products-grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  grid-auto-rows: min-content;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;
  min-height: 0;
}

.product-grid-item {
  background-color: #ffffff69;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 15px;
}

.product-grid-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #ffffff80;
  border-color: #007bff;
}

.in-use-card {
  border-left: 4px solid #dc3545;
  background-color: #fff5f5;
}

.product-grid-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.product-grid-name {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.product-grid-price {
  color: #28a745;
  font-weight: 700;
  font-size: 1rem;
}

.available-text {
  color: #adb5bd;
  font-weight: 500;
  font-style: italic;
  font-size: 0.9rem;
}

.product-grid-actions-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.grid-qty-display-badge {
  background-color: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
}

.table-grid-status-icon {
  font-size: 1.2rem;
  color: #dee2e6;
}

/* Mobile Adjustments */
@media (max-width: 576px) {
  .products-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
}

/* Shared styles from ProductSelection */
.categories-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.category-grid-item {
  background-color: #ffffff69;
  border-radius: 10px;
  border: 1px solid transparent;
}

.category-grid-content {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-grid-icon {
  color: #007bff;
}

.category-grid-name {
  font-weight: bold;
  color: black;
}
</style>
