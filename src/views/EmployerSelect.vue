<template>
  <div class="unified-layout">
    <!-- Hero Header -->
    <div class="hero-header">
      <div class="hero-icon-wrap">
        <MDBIcon icon="users" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Seleccionar Empleado</h2>
        <p class="hero-subtitle">¿Quién está trabajando ahora?</p>
      </div>
    </div>

    <!-- Search bar -->
    <div class="search-container">
      <MDBIcon icon="search" class="search-icon" />
      <input
        v-model="searchQuery"
        class="search-input"
        type="text"
        placeholder="Buscar empleado..."
      />
    </div>

    <!-- Employers grid -->
    <div class="employers-grid" v-if="filteredEmployers.length > 0">
      <div
        v-for="(x, i) in filteredEmployers"
        :key="i"
        class="employer-card"
        @click="SelectEmployer(x)"
      >
        <div class="employer-avatar">
          <span class="employer-initials">{{ getInitials(x.nombre) }}</span>
        </div>
        <div class="employer-info">
          <span class="employer-name">{{ x.nombre }}</span>
          <span class="employer-role">Empleado</span>
        </div>
        <div class="employer-arrow">
          <MDBIcon icon="chevron-right" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-else>
      <MDBIcon icon="user-slash" class="empty-icon" />
      <p class="empty-text">No se encontraron empleados</p>
    </div>

    <!-- Footer info -->
    <div class="footer-bar">
      <MDBIcon icon="info-circle" class="footer-icon" />
      <span
        >{{ employers.length }} empleado{{
          employers.length !== 1 ? "s" : ""
        }}
        registrado{{ employers.length !== 1 ? "s" : "" }}</span
      >
    </div>
  </div>
</template>

<script>
import { MDBIcon } from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import router from "@/router";
import { useRouter } from "vue-router";

export default {
  name: "EmployerSelectView",
  components: {
    MDBIcon,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const employers = computed(() => store.state.Employers.arrayEmployers);
    const searchQuery = ref("");

    const filteredEmployers = computed(() => {
      if (!searchQuery.value.trim()) return employers.value;
      return employers.value.filter((e) =>
        e.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()),
      );
    });

    function getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    function SelectEmployer(employer) {
      store.dispatch("Employers/setSelectedEmployer", employer);
    }

    onMounted(() => {});

    return {
      employers,
      filteredEmployers,
      searchQuery,
      getInitials,
      SelectEmployer,
    };
  },
};
</script>

<style lang="scss" scoped>
.unified-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
  overflow-y: auto;
  padding: 0 0 30px 0;
}

/* ── Hero Header ── */
.hero-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 5% 0 5%;
  padding: 20px 22px;
  background-color: #ffffff69;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.hero-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: linear-gradient(135deg, #007bff22, #007bff44);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-icon {
  font-size: 1.6rem;
  color: #007bff;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hero-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #212529;
  margin: 0;
}

.hero-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

/* ── Search ── */
.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 5% 12px 5%;
  padding: 12px 16px;
  background-color: #ffffff80;
  border-radius: 12px;
  border: 1px solid transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:focus-within {
    border-color: #007bff55;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.12);
  }
}

.search-icon {
  color: #adb5bd;
  font-size: 1rem;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: #333;

  &::placeholder {
    color: #adb5bd;
  }
}

/* ── Employers Grid ── */
.employers-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 5%;
}

.employer-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px 18px;
  background-color: #ffffff69;
  border-radius: 12px;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff90;
    border-color: #007bff44;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.12);

    .employer-arrow {
      color: #007bff;
      transform: translateX(3px);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.employer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff33, #007bff66);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.employer-initials {
  font-size: 1.05rem;
  font-weight: 700;
  color: #007bff;
  letter-spacing: 0.5px;
}

.employer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.employer-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: #212529;
}

.employer-role {
  font-size: 0.78rem;
  color: #6c757d;
  font-weight: 500;
}

.employer-arrow {
  color: #adb5bd;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 15px;
  color: #adb5bd;
}

.empty-icon {
  font-size: 3rem;
}

.empty-text {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

/* ── Footer ── */
.footer-bar {
  margin-top: auto;
  padding: 14px 5%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #adb5bd;
  font-size: 0.82rem;
  font-weight: 500;
}

.footer-icon {
  font-size: 0.9rem;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.05rem;
  }

  .employer-card {
    padding: 12px 15px;
  }

  .employer-avatar {
    width: 42px;
    height: 42px;
  }

  .employer-name {
    font-size: 1rem;
  }
}
</style>
