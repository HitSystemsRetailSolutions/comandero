<template>
  <div>
    <!-- Encabezado con información del empleado y mesa -->
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherEmployer" class="employer">
        <div class="header-content">
          <MDBIcon icon="user-tag" class="header-icon" />
          <span class="header-text">{{ SelectEmployer.nombre }}</span>
          <MDBIcon icon="chevron-right" class="nav-icon" />
        </div>
      </MDBListGroupItem>
      <MDBListGroupItem @click="selectOtherTable" class="employer">
        <div class="header-content">
          <MDBIcon icon="shopping-basket" class="header-icon" />
          <span class="header-text">Mesa {{ selectTable.indexMesa + 1 }}</span>
          <MDBIcon icon="chevron-right" class="nav-icon" />
        </div>
      </MDBListGroupItem>
    </MDBListGroup>

    <hr class="section-divider" />

    <!-- Controles de cantidad mejorados -->
    <div class="clients-selector">
      <div class="selector-title">
        <MDBIcon icon="users" class="title-icon" />
        <h3>Número de comensales</h3>
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
          <MDBIcon icon="backward" />
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
          <span class="clients-label">comensales</span>
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
          <MDBIcon icon="forward" />
          <span>+5</span>
        </button>
      </div>

      <div class="table-info">
        <span>Mesa {{ selectTable.indexMesa + 1 }}</span>
      </div>
    </div>

    <hr class="section-divider" />

    <!-- Visualización de avatares mejorada -->
    <div class="divClients">
      <div v-for="i in clientsInTable" :key="i" class="client">
        <div class="client-avatar">
          <MDBIcon icon="user-tie" class="client-icon" />
          <span class="clientNum">{{ i }}</span>
        </div>
      </div>
    </div>

    <!-- Botón de confirmación mejorado -->
    <div class="confirm-section">
      <button class="confirm-btn" @click="confirmClients()">
        <MDBIcon icon="check" class="confirm-icon" />
        <span>Confirmar comensales</span>
      </button>
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
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";
import axios from "axios";

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
      const res = await axios
        .post("/cestas/setClients", {
          clients: clientsInTable.value,
          cesta: selectTable.value._id,
        })
        .then((res) => {
          if (res) router.push("/categoryselection");
        });
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
  }
}

.header-content {
  display: flex;
  align-items: center;
  padding: 5%;
  gap: 15px;
}

.header-icon {
  font-size: 1.1rem;
  color: #6c757d;
  min-width: 18px;
}

.header-text {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
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

.clients-selector {
  padding: 0 5%;
  margin-bottom: 20px;
}

.selector-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}

.title-icon {
  font-size: 1.2rem;
  color: #6c757d;
}

.selector-title h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.quick-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.control-btn {
  background-color: #ffffff69;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #333;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: #ffffff80;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.control-btn-large {
    width: 60px;
    height: 60px;
    flex-direction: column;
    gap: 2px;

    span {
      font-size: 0.7rem;
      font-weight: 600;
    }
  }
}

.clients-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  background-color: #ffffff80;
  border-radius: 15px;
  min-width: 80px;
}

.clients-number {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.clients-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.table-info {
  text-align: center;
  font-size: 1rem;
  color: #6c757d;
  font-weight: 500;
}

.divClients {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 40vh;
  overflow-y: auto;
  margin: 20px 0;
  flex-wrap: wrap;
  gap: 15px;
  padding: 0 5%;
}

.client {
  display: flex;
  align-items: center;
  justify-content: center;
}

.client-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #ffffff69;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff80;
    transform: scale(1.05);
  }
}

.client-icon {
  font-size: 2rem;
  color: #6c757d;
}

.clientNum {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #333;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  border: 2px solid white;
}

.confirm-section {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.confirm-btn {
  background-color: #ffffff80;
  border: none;
  border-radius: 25px;
  padding: 15px 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background-color: #ffffff95;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.confirm-icon {
  font-size: 1.2rem;
  color: #28a745;
}

// Responsive adjustments
@media (max-width: 768px) {
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

  .client-avatar {
    width: 55px;
    height: 55px;
  }

  .client-icon {
    font-size: 1.8rem;
  }
}
</style>
