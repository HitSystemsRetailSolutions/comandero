<template>
  <div>
    <!-- Encabezado del empleado mejorado -->
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherEmployer" class="employer">
        <div class="employer-content">
          <MDBIcon icon="user-tag" class="employer-icon" />
          <div class="employer-info">
            <span class="employer-label">Empleado actual:</span>
            <span class="employer-name">{{ SelectEmployer.nombre }}</span>
          </div>
          <MDBIcon icon="chevron-right" class="nav-icon" />
        </div>
      </MDBListGroupItem>
    </MDBListGroup>

    <hr class="section-divider" />

    <!-- Título de sección -->
    <div class="section-header">
      <MDBIcon icon="table" class="section-icon" />
      <h3 class="section-title">Seleccionar Mesa</h3>
    </div>

    <!-- Lista de mesas mejorada -->
    <div class="listDiv">
      <MDBListGroup class="tableList">
        <MDBListGroupItem
          v-for="(x, i) in tables"
          :key="i"
          class="tablebtn"
          :class="{ 'table-in-use': x.lista.length > 0 }"
          @click="selectTable(x)"
        >
          <div class="table-content">
            <div class="table-main-info">
              <MDBIcon
                :icon="x.lista.length > 0 ? 'shopping-basket' : 'table'"
                class="table-icon"
                :class="{ 'icon-in-use': x.lista.length > 0 }"
              />
              <div class="table-infos">
                <span class="table-number">{{
                  x.nombre ? x.nombre : "Mesa " + (x.indexMesa + 1)
                }}</span>
                <span v-if="x.lista.length > 0" class="table-status"
                  >{{ x.lista.length }} producto(s)</span
                >
              </div>
            </div>

            <!-- Indicador de estado mejorado -->
            <div class="table-status-indicator">
              <div v-if="x.lista.length > 0" class="status-badge in-use">
                <MDBIcon icon="clock" class="status-icon" />
                <span class="status-text">En uso</span>
              </div>
              <div v-else class="status-badge available">
                <MDBIcon icon="check-circle" class="status-icon" />
                <span class="status-text">Libre</span>
              </div>
              <MDBIcon icon="chevron-right" class="nav-arrow" />
            </div>
          </div>
        </MDBListGroupItem>
      </MDBListGroup>
    </div>
  </div>
</template>

<script>
import {
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";

export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBListGroupItem,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const tables = computed(() => store.state.Tables.arrayTables);
    const actualPage = computed(() => route.currentRoute.value.path);

    const selectTable = async (x) => {
      await store.dispatch("Tables/setSelectedTable", x);
      router.push("/clientsInTableSelection");
    };
    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    return {
      selectTable,
      actualPage,
      selectOtherEmployer,
      router,
      tables,
      SelectEmployer,
    };
  },
};
</script>

<style lang="scss" scoped>
.employerList {
  width: 100%;
  margin-top: 4%;
  height: 100%;
}

.employer {
  background-color: #ffffff69;
  padding: 0;
  border: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff80;
    transform: translateY(-1px);
  }
}

.employer-content {
  display: flex;
  align-items: center;
  padding: 5%;
  gap: 15px;
}

.employer-icon {
  font-size: 1.2rem;
  color: #6c757d;
  min-width: 20px;
}

.employer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employer-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.employer-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.nav-icon {
  color: #6c757d;
  font-size: 0.9rem;
}

.section-divider {
  margin: 20px 0;
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #dee2e6, transparent);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 0 5%;
}

.section-icon {
  font-size: 1.3rem;
  color: #6c757d;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.tableList {
  width: 100%;
  margin-bottom: 5%;
}

.tablebtn {
  background-color: #ffffff69;
  padding: 0;
  border: none;
  margin-bottom: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff80;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.table-in-use {
    background-color: rgb(233 220 220 / 60%);

    &:hover {
      background-color: rgb(233 220 220 / 75%);
    }
  }
}

.table-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5%;
  min-height: 60px;
}

.table-main-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.table-icon {
  font-size: 1.3rem;
  color: #28a745;
  min-width: 20px;

  &.icon-in-use {
    color: #dc3545;
  }
}

.table-infos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-number {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.table-status {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
}

.table-status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;

  &.in-use {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }

  &.available {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
}

.status-icon {
  font-size: 0.8rem;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-arrow {
  color: #6c757d;
  font-size: 0.9rem;
}

.listDiv {
  padding: 0 5%;
}

// Responsive adjustments
@media (max-width: 768px) {
  .table-content {
    min-height: 70px;
  }

  .table-number {
    font-size: 1.2rem;
  }

  .status-badge {
    padding: 8px 14px;
  }
}
</style>
