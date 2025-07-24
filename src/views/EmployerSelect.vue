<template>
  <!-- Título de sección -->
  <div class="section-header">
    <MDBIcon icon="users" class="section-icon" />
    <h3 class="section-title">Seleccionar Empleado</h3>
  </div>

  <div class="listDiv">
    <MDBListGroup class="employersList">
      <MDBListGroupItem
        v-for="(x, i) in employers"
        :key="i"
        class="employer"
        @click="SelectEmployer(i)"
      >
        <div class="employer-content">
          <div class="employer-main-info">
            <MDBIcon icon="user-tag" class="employer-icon" />
            <div class="employer-info">
              <span class="employer-name">{{ x.nombre }}</span>
            </div>
          </div>

          <div class="employer-status">
            <div class="status-badge">
              <MDBIcon icon="clock" class="status-icon" />
              <div class="status-info">
                <span class="status-label">Estado actual:</span>
                <span class="status-value">Fichado</span>
              </div>
            </div>
            <MDBIcon icon="chevron-right" class="nav-arrow" />
          </div>
        </div>
      </MDBListGroupItem>
    </MDBListGroup>
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
import router from "@/router";

import { useRouter } from "vue-router";
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
    const employers = computed(() => store.state.Employers.arrayEmployers);
    const actualPage = computed(() => route.currentRoute.value.path);

    function SelectEmployer(i) {
      store.dispatch("Employers/setSelectedEmployer", employers.value[i]);
    }
    onMounted(() => {
      if (employers.value.length == 0) {
        router.push("/");
      }
    });
    return {
      actualPage,
      SelectEmployer,
      employers,
    };
  },
};
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 5% 25px 5%;
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

.listDiv {
  padding: 0 5%;
}

.employersList {
  width: 100%;
  height: 100%;
}

.employer {
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
}

.employer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5%;
  min-height: 65px;
}

.employer-main-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.employer-icon {
  font-size: 1.2rem;
  color: #6c757d;
  min-width: 20px;
}

.employer-info {
  display: flex;
  flex-direction: column;
}

.employer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.employer-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(40, 167, 69, 0.1);
  border-radius: 20px;
}

.status-icon {
  font-size: 0.8rem;
  color: #28a745;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.status-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
  line-height: 1;
}

.status-value {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 600;
  line-height: 1;
}

.nav-arrow {
  color: #6c757d;
  font-size: 0.9rem;
}

.titleEmployersSelector {
  margin-top: 5%;
  font-size: 7vw;
}

// Responsive adjustments
@media (max-width: 768px) {
  .employer-content {
    min-height: 70px;
  }

  .employer-name {
    font-size: 1.2rem;
  }

  .status-badge {
    padding: 10px 14px;
  }
}
</style>
