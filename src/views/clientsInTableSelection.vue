<template>
  <div class="unified-layout">
    <!-- Header: Trabajador | Mesa -->
    <div class="top-header">
      <div class="header-item" @click="selectOtherEmployer">
        <div class="header-icon-wrap">
          <MDBIcon icon="user-tag" class="header-icon" />
        </div>
        <div class="header-info">
          <span class="header-text">{{ SelectEmployer.nombre }}</span>
          <span class="header-subtext">Empleado</span>
        </div>
      </div>
      <div class="header-item" @click="selectOtherTable">
        <div class="header-icon-wrap wrap-table">
          <MDBIcon icon="border-all" class="header-icon text-white" />
        </div>
        <div class="header-info">
          <span class="header-text">Mesa {{ selectTable.indexMesa + 1 }}</span>
          <span class="header-subtext">Cambiar mesa</span>
        </div>
      </div>
    </div>

    <!-- Control de Comensales -->
    <div class="content-card">
      <div class="card-header-styled">
        <MDBIcon icon="users" class="card-icon" />
        <h3 class="card-title">Número de comensales</h3>
      </div>

      <div class="quick-controls">
        <button
          class="control-btn control-btn-large"
          @click="
            clientsInTable -= 5;
            clientsManager();
          "
          :disabled="clientsInTable <= 5"
        >
          <MDBIcon icon="angle-double-left" />
          <span>-5</span>
        </button>

        <button
          class="control-btn"
          @click="
            clientsInTable--;
            clientsManager();
          "
          :disabled="clientsInTable <= 1"
        >
          <MDBIcon icon="minus" />
        </button>

        <div class="clients-display">
          <span class="clients-number">{{ clientsInTable }}</span>
          <span class="clients-label">{{ clientsInTable === 1 ? 'comensal' : 'comensales' }}</span>
        </div>

        <button
          class="control-btn"
          @click="
            clientsInTable++;
            clientsManager();
          "
        >
          <MDBIcon icon="plus" />
        </button>

        <button
          class="control-btn control-btn-large"
          @click="
            clientsInTable += 5;
            clientsManager();
          "
        >
          <MDBIcon icon="angle-double-right" />
          <span>+5</span>
        </button>
      </div>
    </div>

    <!-- Avatares de comensales -->
    <div class="avatars-grid-container">
      <div v-for="i in clientsInTable" :key="i" class="avatar-card">
        <div class="avatar-circle">
          <MDBIcon icon="user-tie" class="avatar-icon" />
          <div class="avatar-badge">{{ i }}</div>
        </div>
      </div>
    </div>

    <!-- Footer Confirm Button -->
    <div class="action-footer">
      <button class="primary-action-btn" @click="confirmClients()">
        <MDBIcon icon="check" class="btn-icon" />
        <span>Confirmar</span>
      </button>
    </div>
  </div>
</template>

<script>
import { MDBIcon } from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
  name: "MenuPrincipalView",
  components: {
    MDBIcon,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const tables = computed(() => store.state.Tables.arrayTables);
    const actualPage = computed(() => router.currentRoute.value.path);
    const clientsInTable = ref(1);
    const selectTable = computed(() => store.state.Tables.selectedTable);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const clientsManager = () => {
      if (clientsInTable.value < 1) {
        clientsInTable.value = 1;
      }
    };

    onMounted(() => {
      clientsInTable.value = selectTable.value?.comensales;
      if (clientsInTable.value) router.push("/categoryselection");
      clientsInTable.value = 1;
    });

    const confirmClients = async () => {
      try {
        const res = await axios.post("/cestas/setClients", {
          clients: clientsInTable.value,
          cesta: selectTable.value._id,
        });
        if (res) router.push("/categoryselection");
      } catch (error) {
        console.error(error);
      }
    };

    return {
      selectTable,
      confirmClients,
      actualPage,
      selectOtherEmployer,
      selectOtherTable,
      router,
      tables,
      SelectEmployer,
      clientsManager,
      clientsInTable,
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
  overflow-y: auto;
  padding-bottom: 90px;
}

/* ── Top Header ── */
.top-header {
  display: flex;
  gap: 15px;
}

.header-item {
  flex: 1;
  background-color: #ffffff69;
  padding: 12px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    background-color: #ffffff90;
    border-color: #007bff44;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.12);
  }
}

.header-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff33, #007bff66);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.wrap-table {
    background: linear-gradient(135deg, #28a745, #20c997);
  }
}

.header-icon {
  font-size: 1.1rem;
  color: #007bff;
}

.wrap-table .header-icon {
  color: white !important;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-text {
  font-weight: 700;
  font-size: 1.05rem;
  color: #212529;
  line-height: 1.2;
}

.header-subtext {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

/* ── Content Card ── */
.content-card {
  background-color: #ffffff69;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
}

.card-header-styled {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.card-icon {
  font-size: 1.3rem;
  color: #007bff;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* ── Quick Controls ── */
.quick-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.control-btn {
  background-color: #ffffff80;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #333;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover:not(:disabled) {
    background-color: #fff;
    border-color: #007bff;
    color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: #e9ecef;
  }

  &.control-btn-large {
    width: 65px;
    height: 65px;
    flex-direction: column;
    gap: 3px;
    border-radius: 16px;

    span {
      font-size: 0.8rem;
      font-weight: 700;
    }
  }
}

.clients-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 25px;
  background-color: #fff;
  border-radius: 16px;
  min-width: 110px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf2f7;
}

.clients-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #007bff;
  line-height: 1;
  margin-bottom: 2px;
}

.clients-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Avatars Grid ── */
.avatars-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 15px;
  padding: 10px 5px;
}

.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.avatar-circle {
  position: relative;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  border: 2px solid #fff;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.12);
  }
}

.avatar-icon {
  font-size: 1.8rem;
  color: #adb5bd;
}

.avatar-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background-color: #007bff;
  color: white;
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  border: 2px solid white;
  padding: 0 4px;
}

/* ── Action Footer ── */
.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  background: linear-gradient(to top, #f8f9fa 80%, rgba(248, 249, 250, 0));
  display: flex;
  justify-content: center;
  z-index: 100;
}

.primary-action-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 16px 35px;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    background: linear-gradient(135deg, #218838, #1e7e34);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(40, 167, 69, 0.3);
  }

  .btn-icon {
    font-size: 1.2rem;
  }
}

/* ── Responsive ── */
@media (max-width: 576px) {
  .top-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .quick-controls {
    gap: 10px;
  }

  .control-btn {
    width: 45px;
    height: 45px;

    &.control-btn-large {
      width: 55px;
      height: 55px;
    }
  }

  .clients-number {
    font-size: 1.8rem;
  }
  
  .clients-display {
    min-width: 90px;
    padding: 10px 15px;
  }
}
</style>
