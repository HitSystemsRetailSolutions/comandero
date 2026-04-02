<template>
  <div class="menu-modal-viewport premium-menu-modal">
    <MDBModalHeader class="modal-header-premium sticky-header">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="utensils" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="product-name-title">{{
            menuSelected?.nombreArticulo || menuSelected?.nombre
          }}</span
          ><br />
          <span class="product-category-subtitle"
            >Selecciona tus preferencias</span
          >
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium">
      <div class="scrollable-content-premium">
        <div
          v-for="(suplementos, familia) in suplByFamily"
          :key="familia"
          class="premium-family-section"
        >
          <div class="family-header-premium" @click="onToggleFamilia(familia)">
            <h5 class="family-name-premium">{{ familia }}</h5>
            <div class="family-controls-premium">
              <div
                v-if="seleccionadoPorFamilia[familia]"
                class="selection-pill-premium animate-pop-in"
              >
                <MDBIcon icon="check" class="me-1" />
                {{ seleccionadoPorFamilia[familia].nombre }}
              </div>
              <div class="toggle-icon-box">
                <MDBIcon
                  :icon="
                    familiasAbiertas[familia] ? 'chevron-up' : 'chevron-down'
                  "
                />
              </div>
            </div>
          </div>

          <div
            v-show="familiasAbiertas[familia]"
            class="suplementos-grid-premium animate-slide-down"
          >
            <div
              v-for="(suplemento, index) in suplementos"
              :key="index"
              class="premium-suple-card"
              :class="{
                selected:
                  seleccionadoPorFamilia[familia]?.idArticulo ===
                  (suplemento.idArticulo || suplemento._id),
                disabled: suplemento.esSumable === false,
              }"
              @click="
                suplemento.esSumable !== false &&
                  onSetSeleccionFamilia(familia, suplemento)
              "
            >
              <div
                class="card-glow"
                v-if="
                  seleccionadoPorFamilia[familia]?.idArticulo ===
                  (suplemento.idArticulo || suplemento._id)
                "
              ></div>
              <div class="suple-card-inner">
                <div
                  class="check-icon-wrapper"
                  v-if="
                    seleccionadoPorFamilia[familia]?.idArticulo ===
                    (suplemento.idArticulo || suplemento._id)
                  "
                >
                  <MDBIcon icon="check" />
                </div>
                <span class="suple-name-premium">{{ suplemento.nombre }}</span>
                <span v-if="!suplemento.esSumable" class="badge-status-pill"
                  >A peso</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter
      v-if="!initialSeleccionadoPorFamilia || closeBtn"
      class="modal-footer-premium sticky-footer"
    >
      <MDBBtn
        v-if="!initialSeleccionadoPorFamilia"
        outline="danger"
        @click="$emit('update:modelValue', false)"
        class="premium-footer-btn cancel"
      >
        <MDBIcon icon="times" class="me-2" />
        Cancelar
      </MDBBtn>
      <MDBBtn
        v-if="!initialSeleccionadoPorFamilia"
        color="primary"
        @click="confirmarMenu"
        class="premium-footer-btn confirm"
      >
        <MDBIcon icon="plus-circle" class="me-2" />
        Añadir producto
      </MDBBtn>

      <MDBBtn
        v-if="initialSeleccionadoPorFamilia && closeBtn"
        color="primary"
        @click="$emit('update:modelValue', false)"
        class="premium-footer-btn w-100"
      >
        <MDBIcon icon="check" class="me-2" />
        Listo
      </MDBBtn>
    </MDBModalFooter>
  </div>
  <SuplementosModal
    v-model="showSuplModal"
    :suplArticle="suplArticle"
    @confirmarSuplementos="onConfirmarSuplementos"
  />
</template>
<script>
import {
  MDBModalHeader,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
  MDBIcon,
} from "mdb-vue-ui-kit";
import { ref, watch, toRef, computed } from "vue";
import axios from "axios";
import { useMenuSelection } from "../composables/useMenuSelection";
import SuplementosModal from "./SuplementosModal.vue";
export default {
  name: "MenuModal",
  components: {
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
    MDBBtn,
    MDBIcon,
    SuplementosModal,
  },
  props: {
    modelValue: Boolean,
    closeBtn: Boolean,
    menuSelected: Object,
    suplByFamily: Object,
    initialSeleccionadoPorFamilia: Object,
  },
  emits: ["update:modelValue", "confirmarMenu", "aplicarCambios"],
  setup(props, { emit }) {
    const suplByFamilyRef = toRef(props, "suplByFamily");
    const {
      familiasAbiertas,
      seleccionadoPorFamilia,
      onToggleFamilia,
      resetSelection,
      initFamilies,
    } = useMenuSelection(suplByFamilyRef);

    const showSuplModal = ref(false);
    const suplArticle = ref(null);
    const pendingFamilia = ref(null);
    const pendingProducto = ref(null);

    const modalVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    watch(
      suplByFamilyRef,
      () => {
        initFamilies();
        resetSelection();
      },
      { immediate: true },
    );

    watch(
      () => props.initialSeleccionadoPorFamilia,
      (val) => {
        if (val && typeof val === "object") {
          resetSelection();
          Object.entries(val).forEach(([familia, art]) => {
            seleccionadoPorFamilia[familia] = art;
          });
        }
      },
      { immediate: true },
    );

    const lastSeleccionadoStr = ref(JSON.stringify(seleccionadoPorFamilia));
    watch(
      seleccionadoPorFamilia,
      (val) => {
        if (!props.initialSeleccionadoPorFamilia) return;
        const currentStr = JSON.stringify(val);
        if (currentStr !== lastSeleccionadoStr.value) {
          emit("aplicarCambios", { ...val });
          lastSeleccionadoStr.value = currentStr;
        }
      },
      { deep: true },
    );

    async function onSetSeleccionFamilia(familia, producto) {
      const idSel = seleccionadoPorFamilia[familia]?.idArticulo;
      const idSup = producto.idArticulo ?? producto._id ?? null;

      if (idSel === idSup) {
        delete seleccionadoPorFamilia[familia];
        return;
      }
      const { data } = await axios.post("articulos/getArticuloById", {
        idArticulo: producto.idArticulo || producto._id,
      });

      if (data && data.suplementos && data.suplementos.length > 0) {
        const res = await axios.post("articulos/getSuplementos", {
          arrayIdSuplementos: data.suplementos,
        });
        pendingFamilia.value = familia;
        pendingProducto.value = producto;
        suplArticle.value = res.data;
        showSuplModal.value = true;
        return;
      }
      const objectInstances = [];
      for (let i = 0; i < (producto.unidades ?? 1); i++) {
        objectInstances.push({
          instanceId: Date.now() + i,
          printed: false,
        });
      }

      const obj = {
        idArticulo: idSup,
        nombre: producto.nombre ?? null,
        arraySuplementos: producto.arraySuplementos ?? null,
        unidades: producto.unidades ?? 1,
        gramos: producto.gramos ?? null,
        printed: 0,
        impresora: data.impresora ?? null,
        instancias: objectInstances,
      };
      seleccionadoPorFamilia[familia] = obj;
    }

    function onConfirmarSuplementos(suplementosSeleccionados) {
      if (!pendingFamilia.value || !pendingProducto.value) return;
      const idSup =
        pendingProducto.value.idArticulo ?? pendingProducto.value._id ?? null;
      const objectInstances = [];
      for (let i = 0; i < (pendingProducto.value.unidades ?? 1); i++) {
        objectInstances.push({
          instanceId: Date.now() + i,
          printed: false,
        });
      }

      const obj = {
        idArticulo: idSup,
        nombre: pendingProducto.value.nombre ?? null,
        arraySuplementos: suplementosSeleccionados ?? null,
        unidades: pendingProducto.value.unidades ?? 1,
        gramos: pendingProducto.value.gramos ?? null,
        printed: 0,
        impresora: pendingProducto.value.impresora ?? null,
        instancias: objectInstances,
      };
      seleccionadoPorFamilia[pendingFamilia.value] = obj;
      pendingFamilia.value = null;
      pendingProducto.value = null;
      suplArticle.value = null;
      showSuplModal.value = false;
    }

    function confirmarMenu() {
      emit("confirmarMenu", seleccionadoPorFamilia);
      emit("update:modelValue", false);
      resetSelection();
    }

    return {
      familiasAbiertas,
      seleccionadoPorFamilia,
      onToggleFamilia,
      onSetSeleccionFamilia,
      confirmarMenu,
      modelValue: modalVisible,
      showSuplModal,
      suplArticle,
      onConfirmarSuplementos,
    };
  },
};
</script>

<style scoped lang="scss">
.premium-menu-modal {
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header-premium {
  background-color: #ffffff69;
  border-bottom: 2px solid #e9ecef;
  padding: 15px 20px;
}

.title-icon-wrapper {
  width: 38px;
  height: 38px;
  background-color: #fff3e0; // Tint for utensils
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  .title-icon {
    color: #f59e0b;
    font-size: 1rem;
  }
}

.product-name-title {
  font-size: 1.15rem;
  font-weight: bold;
  color: #343a40;
}

.product-category-subtitle {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.modal-body-premium {
  padding: 0;
  background-color: #f8f9fa;
  overflow: hidden;
}

.scrollable-content-premium {
  padding: 15px;
  overflow-y: auto;
  max-height: 60vh;
}

.premium-family-section {
  background-color: #ffffff69;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.family-header-premium {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.3);

  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
}

.family-name-premium {
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #343a40;
}

.selection-pill-premium {
  background-color: #e3f2fd;
  color: #007bff;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
}

.suplementos-grid-premium {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.1);
}

.premium-suple-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 12px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 55px;
  text-align: center;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    border-color: #adb5bd;
    transform: translateY(-1px);
  }

  &.selected {
    border-color: #007bff;
    background-color: #f0f7ff;
    .suple-name-premium {
      color: #007bff;
      font-weight: bold;
    }
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.check-icon-wrapper {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #007bff;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
}

.suple-name-premium {
  font-size: 0.85rem;
  font-weight: 500;
  color: #495057;
}

.badge-status-pill {
  font-size: 0.7rem;
  color: #adb5bd;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.modal-footer-premium {
  background-color: #ffffff69;
  border-top: 2px solid #e9ecef;
  padding: 12px 20px;
  display: flex;
  gap: 10px;
}

.premium-footer-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
  text-transform: none;
}
</style>
