<template>
  <MDBModal
    id="selectDatafonoModal"
    tabindex="-1"
    labelledby="selectDatafonoModalLabel"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :staticBackdrop="true"
    size="md"
    class="premium-modal datafono-selection-modal"
    :scrollable="true"
  >
    <MDBModalHeader class="modal-header-premium">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="credit-card" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="modal-main-title">Selecciona el tipo de datáfono</span>
          <!-- <span class="modal-subtitle">Elige cómo deseas procesar el cobro</span> -->
        </div>
      </div>
    </MDBModalHeader>

    <MDBModalBody class="modal-body-premium">
      <div v-if="loading" class="terminal-loading" role="status">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Consultando datáfono habitual…
      </div>
      <div v-else class="datafono-options-grid">
        <button v-for="option in options" :key="option.value" type="button" class="datafono-option-card"
          :class="{ preferred: option.value === preferred }" @click="select(option.value)">
          <span v-if="option.value === preferred" class="preferred-badge">Datáfono habitual</span>
          <div class="option-icon-wrapper" :class="option.iconClass">
            <MDBIcon :icon="option.icon" size="sm" class="option-icon" />
          </div>
          <div class="option-info">
            <h5 class="option-title">{{ option.title }}</h5>
            <p class="option-subtitle">{{ option.subtitle }}</p>
          </div>
          <span class="select-option-btn w-100">{{ option.action }}</span>
        </button>
      </div>
    </MDBModalBody>

    <MDBModalFooter class="modal-footer-premium">
      <MDBBtn outline="primary" class="premium-cancel-btn" @click="cancel"> Atrás </MDBBtn>
    </MDBModalFooter>
  </MDBModal>
</template>

<script>
import { MDBBtn, MDBIcon, MDBModal, MDBModalBody, MDBModalFooter, MDBModalHeader } from "mdb-vue-ui-kit";
import { computed, ref, watch } from "vue";
import axios from "axios";

export default {
  name: "SelectDatafonoModal",
  components: {
    MDBBtn,
    MDBIcon,
    MDBModal,
    MDBModalBody,
    MDBModalFooter,
    MDBModalHeader,
  },
  props: {
    /**
     * Controls modal open/close state (v-model).
     */
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "select", "cancel"],
  setup(props, { emit }) {
    const preferred = ref(null);
    const loading = ref(false);
    const options = computed(() => [
      { value: "DATAFONO_INTEGRADO", title: "Datáfono Integrado", subtitle: "Conectado al programa", icon: "network-wired", iconClass: "connected", action: "Seleccionar integrado" },
      { value: "DATAFONO_3G", title: "Datáfono Independiente", subtitle: "3G / Portátil", icon: "wifi", iconClass: "independent", action: "Seleccionar independiente / 3G" },
    ].sort((a, b) => Number(b.value === preferred.value) - Number(a.value === preferred.value)));
    watch(() => props.modelValue, async (open) => {
      if (!open) return;
      loading.value = true;
      try {
        const { data } = await axios.get("datafonoInt/es3G", { timeout: 5000 });
        if (typeof data === "boolean") preferred.value = data ? "DATAFONO_3G" : "DATAFONO_INTEGRADO";
      } catch { /* Ambas opciones siguen disponibles para selección manual. */ }
      finally { loading.value = false; }
    }, { immediate: true });
    const select = (tipo) => {
      emit("update:modelValue", false);
      emit("select", tipo);
    };

    const cancel = () => {
      emit("update:modelValue", false);
      emit("cancel");
    };

    return { select, cancel, preferred, options, loading };
  },
};
</script>

<style lang="scss" scoped>
/* Uses .premium-modal applied by the parent via class binding for border-radius / shadow overrides */

.modal-header-premium {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

.title-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  .title-icon {
    font-size: 1.4rem;
    color: #3b82f6;
  }
}

.modal-main-title {
  display: block;
  font-weight: 800;
  font-size: 1.25rem;
  color: #1e293b;
  line-height: 1.2;
}

.modal-subtitle {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.modal-body-premium {
  padding: 24px;
  background: #f8fafc;
}

.modal-footer-premium {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 18px 24px;
}

.premium-cancel-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
}

.datafono-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 10px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.datafono-option-card {
  font-family: inherit;
  color: #1e293b;
  position: relative;
  background: white;
  padding: 24px;
  border-radius: 20px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  &.preferred { border-color: #3b82f6; background: #f8fbff; }
  &:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;

    .option-icon-wrapper.connected {
      background: #eff6ff;
      color: #3b82f6;
    }
    .option-icon-wrapper.independent {
      background: #f1f5f9;
      color: #475569;
    }
  }
}

.preferred-badge { background: #dbeafe; color: #1d4ed8; padding: 5px 10px; border-radius: 20px; font-size: .7rem; font-weight: 700; margin-bottom: 16px; }
.terminal-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 24px 0; color: #64748b; font-size: .9rem; }

.option-icon-wrapper {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &.connected {
    background: #ecfdf5;
    color: #10b981;
  }

  &.independent {
    background: #fef3c7;
    color: #d97706;
  }

  .option-icon {
    font-size: 1.8rem;
  }
}

.option-info {
  flex-grow: 1;
  margin-bottom: 20px;
}

.option-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.option-subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.option-description {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}

.select-option-btn {
  display: block;
  background: #f1f5f9;
  color: #334155;
  text-transform: none;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  box-shadow: none;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }
}
.preferred .select-option-btn { background: #2563eb; color: white; }

@media (max-width: 576px), (max-height: 500px) {
  .datafono-selection-modal {
    :deep(.modal-dialog) { margin: 8px; height: calc(100vh - 16px); height: calc(100dvh - 16px); max-width: none; }
    :deep(.modal-content) { max-height: 100%; border-radius: 20px; overflow: hidden; }
  }
  .modal-header-premium { padding: 14px 16px; flex-shrink: 0; }
  .modal-main-title { font-size: 1rem; }
  .title-icon-wrapper { width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px; }
  .modal-body-premium { padding: 14px; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  .modal-footer-premium { padding: 10px 14px; padding-bottom: max(10px, env(safe-area-inset-bottom)); flex-shrink: 0; }
  .premium-cancel-btn { width: 100%; min-height: 44px; margin: 0; }
  .datafono-options-grid { gap: 12px; margin-top: 0; grid-template-columns: 1fr; }
  .datafono-option-card { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px; padding: 16px; border-radius: 16px; text-align: left; }
  .preferred-badge { grid-column: 1 / -1; margin: 0; justify-self: start; }
  .option-icon-wrapper { width: 36px; height: 36px; margin: 0; }
  .option-icon-wrapper .option-icon { font-size: 1.25rem; }
  .option-info { margin: 0; min-width: 0; }
  .option-title { font-size: 1rem; }
  .option-subtitle { margin: 0; font-size: .7rem; }
  .select-option-btn { grid-column: 1 / -1; text-align: center; font-size: .8rem; padding: 12px; }
}
@media (hover: none) { .datafono-option-card:hover { transform: none; } }
</style>
