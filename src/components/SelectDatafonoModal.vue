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
  >
    <MDBModalHeader class="modal-header-premium">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="credit-card" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="modal-main-title">Selecciona el tipo de datáfono</span>
          <span class="modal-subtitle">Elige cómo deseas procesar el cobro</span>
        </div>
      </div>
    </MDBModalHeader>

    <MDBModalBody class="modal-body-premium">
      <div class="datafono-options-grid">
        <!-- Opción A: Datáfono Integrado -->
        <div class="datafono-option-card" @click="select('DATAFONO_INTEGRADO')">
          <div class="option-icon-wrapper connected">
            <MDBIcon icon="network-wired" class="option-icon" />
          </div>
          <div class="option-info">
            <h5 class="option-title">Datáfono Integrado</h5>
            <p class="option-subtitle">Conectado al programa</p>
            <p class="option-description">Cobro automático desde el sistema.</p>
          </div>
          <MDBBtn color="primary" class="select-option-btn w-100"> Seleccionar integrado </MDBBtn>
        </div>

        <!-- Opción B: Datáfono Independiente -->
        <div class="datafono-option-card" @click="select('DATAFONO_3G')">
          <div class="option-icon-wrapper independent">
            <MDBIcon icon="wifi" class="option-icon" />
          </div>
          <div class="option-info">
            <h5 class="option-title">Datáfono Independiente</h5>
            <p class="option-subtitle">3G / Portátil</p>
            <p class="option-description">Introducir importe manualmente en el terminal.</p>
          </div>
          <MDBBtn color="dark" class="select-option-btn w-100"> Seleccionar independiente / 3G </MDBBtn>
        </div>
      </div>
    </MDBModalBody>

    <MDBModalFooter class="modal-footer-premium">
      <MDBBtn outline="primary" class="premium-cancel-btn" @click="cancel"> Atrás </MDBBtn>
    </MDBModalFooter>
  </MDBModal>
</template>

<script>
import { MDBBtn, MDBIcon, MDBModal, MDBModalBody, MDBModalFooter, MDBModalHeader } from "mdb-vue-ui-kit";

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
    const select = (tipo) => {
      emit("update:modelValue", false);
      emit("select", tipo);
    };

    const cancel = () => {
      emit("update:modelValue", false);
      emit("cancel");
    };

    return { select, cancel };
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

.option-icon-wrapper {
  width: 60px;
  height: 60px;
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
</style>
