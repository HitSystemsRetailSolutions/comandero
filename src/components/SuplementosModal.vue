<template>
  <MDBModal
    id="suplModal"
    tabindex="-1"
    labelledby="suplModal"
    v-model="modelValue"
    :staticBackdrop="true"
    size="lg"
    class="premium-modal supplements-modal-container"
  >
    <MDBModalHeader class="modal-header-premium sticky-header">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="plus-circle" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="product-name-title">Añadir Suplementos</span>
          <span class="product-category-subtitle">Personaliza tu artículo</span>
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium scrollable-modal-body">
      <div class="supplements-grid-premium animate-fade-in">
        <div
          v-for="(x, y) in localSuplArticle"
          :key="y"
          @click="toggleSuplemento(x)"
          class="premium-suplement-card"
          :class="{ selected: x.selected }"
        >
          <div class="card-glow" v-if="x.selected"></div>
          <div class="suple-card-inner">
            <div class="check-icon-wrapper" v-if="x.selected">
              <MDBIcon icon="check" />
            </div>

            <div class="suple-icon-box">
              <MDBIcon icon="puzzle-piece" />
            </div>

            <span class="suple-name-premium">{{ x.nombre }}</span>

            <div class="price-tag-premium" v-if="x.precioConIva > 0">
              <span class="price-currency">+</span
              >{{ x.precioConIva.toFixed(2) }}€
            </div>
            <div class="price-tag-premium free" v-else>Gratis</div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-premium sticky-footer">
      <MDBBtn
        outline="danger"
        @click="$emit('update:modelValue', false)"
        class="premium-footer-btn cancel"
      >
        <MDBIcon icon="times" class="me-2" />
        Cancelar
      </MDBBtn>
      <MDBBtn
        color="primary"
        @click="confirmarSuplementos"
        class="premium-footer-btn confirm"
      >
        <MDBIcon icon="check" class="me-2" />
        Aplicar
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>
</template>
<script>
import {
  MDBModal,
  MDBModalHeader,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
  MDBIcon,
} from "mdb-vue-ui-kit";
import { toRef, computed } from "vue";
import { useSuplementosSelection } from "../composables/useSuplementosSelection";

export default {
  name: "SuplementosModal",
  components: {
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
    MDBBtn,
    MDBIcon,
  },
  props: {
    modelValue: Boolean,
    suplArticle: Array,
  },
  emits: ["update:modelValue", "confirmarSuplementos"],
  setup(props, { emit }) {
    const suplArticleRef = toRef(props, "suplArticle");
    const {
      localSuplArticle,
      toggleSuplemento,
      getSeleccionados,
      resetSelection,
    } = useSuplementosSelection(suplArticleRef);

    // Computed para v-model compatible
    const modalVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    function confirmarSuplementos() {
      emit("confirmarSuplementos", getSeleccionados());
      emit("update:modelValue", false);
      resetSelection();
    }

    return {
      localSuplArticle,
      toggleSuplemento,
      confirmarSuplementos,
      modelValue: modalVisible,
    };
  },
};
</script>
<style scoped lang="scss">
.supplements-modal-container {
  :deep(.modal-content) {
    background-color: #f8f9fa;
    border-radius: 16px;
    border: 1px solid #dee2e6;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
}

.modal-header-premium {
  background-color: #ffffff69;
  border-bottom: 2px solid #e9ecef;
  padding: 15px 20px;
}

.title-icon-wrapper {
  width: 40px;
  height: 40px;
  background-color: #e3f2fd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  .title-icon {
    color: #007bff;
    font-size: 1.1rem;
  }
}
.title-text-group {
  display: flex;
  flex-direction: column;
}

.product-name-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #343a40;
}

.product-category-subtitle {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.modal-body-premium {
  padding: 20px;
  background-color: #f8f9fa;
}

.supplements-grid-premium {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.premium-suplement-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 15px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 90px;
  transition: all 0.2s;

  &:hover {
    border-color: #adb5bd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }

  &.selected {
    border-color: #007bff;
    background-color: #f0f7ff;
    .suple-name-premium {
      color: #007bff;
      font-weight: bold;
    }
    .suple-icon-box {
      color: #007bff;
    }
  }
}

.check-icon-wrapper {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #007bff;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.suple-icon-box {
  font-size: 1.2rem;
  color: #adb5bd;
  margin-bottom: 8px;
}

.suple-name-premium {
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  line-height: 1.2;
  margin-bottom: 6px;
}

.price-tag-premium {
  font-size: 0.85rem;
  font-weight: bold;
  color: #28a745;
  background-color: #e8f5e9;
  padding: 2px 8px;
  border-radius: 10px;

  &.free {
    color: #6c757d;
    background-color: #e9ecef;
    font-weight: 500;
  }
}

.modal-footer-premium {
  background-color: #ffffff69;
  border-top: 2px solid #e9ecef;
  padding: 12px 20px;
  display: flex;
  gap: 12px;
}

.premium-footer-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
  text-transform: none;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff !important;
}
.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: #fff !important;
}

.scrollable-modal-body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
