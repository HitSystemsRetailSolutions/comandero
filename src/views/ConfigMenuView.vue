<template>
  <div class="unified-layout">
    <!-- Top bar -->
    <div class="top-header">
      <div class="header-item" @click="volver">
        <MDBIcon icon="arrow-left" class="header-icon" />
        <span class="header-text">Volver</span>
      </div>
    </div>

    <!-- Hero Header -->
    <div class="hero-header">
      <div class="hero-icon-wrap">
        <MDBIcon icon="cog" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Configuración</h2>
        <p class="hero-subtitle">Selecciona una opción para administrar las notas de cocina</p>
      </div>
    </div>

    <!-- Options -->
    <div class="options-list">
      <div class="option-card" @click="openNotasConfig">
        <div class="option-icon-wrap">
          <MDBIcon icon="sticky-note" class="option-icon" />
        </div>
        <div class="option-info">
          <span class="option-title">Configuración Notas</span>
          <span class="option-desc">Edita el orden, texto y elementos de las notas</span>
        </div>
        <MDBIcon icon="chevron-right" class="option-arrow" />
      </div>

      <div
        class="option-card"
        :class="{ 'option-loading': loading }"
        @click="actualizarNotas"
      >
        <div class="option-icon-wrap secondary">
          <MDBIcon icon="sync" class="option-icon" :class="{ 'icon-spin': loading }" />
        </div>
        <div class="option-info">
          <span class="option-title">Actualizar Notas</span>
          <span class="option-desc">Recarga las notas guardadas desde el servidor</span>
        </div>
        <MDBIcon icon="chevron-right" class="option-arrow" />
      </div>
    </div>
  </div>
</template>

<script>
import { MDBIcon } from "mdb-vue-ui-kit";
import { useStore } from "vuex";
import router from "@/router";
import { ref } from "vue";
import Swal from "sweetalert2";

export default {
  name: "ConfigMenuView",
  components: {
    MDBIcon,
  },
  setup() {
    const store = useStore();
    const loading = ref(false);

    const openNotasConfig = () => {
      router.push("/notasconfig");
    };

    const actualizarNotas = async () => {
      if (loading.value) return;
      loading.value = true;
      const notas = await store.dispatch("Notas/getServidor");
      if (notas) {
        Swal.fire("OK", "Notas actualizadas", "success");
      } else {
        Swal.fire("Error", "Error al actualizar las notas", "error");
      }
      loading.value = false;
    };

    const volver = () => {
      router.push("/employer");
    };

    return {
      openNotasConfig,
      actualizarNotas,
      volver,
      loading,
    };
  },
};
</script>

<style lang="scss" scoped>
.unified-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 15px;
  gap: 15px;
  background-color: #f8f9fa;
}

/* ── Top bar ── */
.top-header {
  display: flex;
  gap: 15px;
}

.header-item {
  background-color: #ffffff69;
  padding: 12px 18px;
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
  font-size: 1.1rem;
  color: #007bff;
}

.header-text {
  font-weight: 600;
  font-size: 1rem;
  color: #343a40;
}

/* ── Hero Header ── */
.hero-header {
  display: flex;
  align-items: center;
  gap: 16px;
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

/* ── Options ── */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px 18px;
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
  }

  &:hover .option-arrow {
    color: #007bff;
    transform: translateX(3px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &.option-loading {
    pointer-events: none;
    opacity: 0.7;
  }
}

.option-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #007bff33, #007bff66);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.secondary {
    background: linear-gradient(135deg, #2d8a5e33, #2d8a5e66);

    .option-icon {
      color: #2d8a5e;
    }
  }
}

.option-icon {
  font-size: 1.2rem;
  color: #007bff;
}

.icon-spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.option-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #212529;
}

.option-desc {
  font-size: 0.82rem;
  color: #6c757d;
  font-weight: 500;
}

.option-arrow {
  color: #adb5bd;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero-header {
    padding: 16px 18px;
  }

  .hero-title {
    font-size: 1.05rem;
  }

  .option-card {
    padding: 14px 15px;
  }

  .option-icon-wrap {
    width: 42px;
    height: 42px;
  }
}
</style>
