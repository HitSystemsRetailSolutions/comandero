<template>
  <div class="menu-modal-viewport premium-menu-modal">
    <MDBModalHeader class="modal-header-premium sticky-header">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="utensils" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="product-name-title">{{ menuSelected?.nombreArticulo || menuSelected?.nombre }}</span
          ><br />
          <span class="product-category-subtitle">Selecciona tus preferencias</span>
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium">
      <div class="scrollable-content-premium">
        <div v-for="(suplementos, familia) in suplByFamily" :key="familia" class="premium-family-section">
          <div class="family-header-premium" @click="onToggleFamilia(familia)">
            <h5 class="family-name-premium">{{ familia }}</h5>
            <div class="family-controls-premium">
              <div v-if="getSelectedItemsForFamily(familia).length" class="selection-pill-premium animate-pop-in">
                <MDBIcon icon="check" class="me-1" />
                {{ getSelectedItemsForFamily(familia).length }}
                {{ getSelectedItemsForFamily(familia).length > 1 ? "seleccionados" : "seleccionado" }}
              </div>
              <div v-if="getSelectedItemsForFamily(familia).length" class="selection-details-premium">
                <span
                  v-for="(selectedItem, index) in getSelectedItemsForFamily(familia).slice(0, 2)"
                  :key="selectedItem.idArticulo || selectedItem._id || index"
                  class="selection-detail-pill"
                >
                  {{ selectedItem.nombre }}
                </span>
                <span v-if="getSelectedItemsForFamily(familia).length > 2" class="selection-detail-pill more">
                  +{{ getSelectedItemsForFamily(familia).length - 2 }}
                </span>
              </div>
              <div class="toggle-icon-box">
                <MDBIcon :icon="familiasAbiertas[familia] ? 'chevron-up' : 'chevron-down'" />
              </div>
            </div>
          </div>

          <div v-show="familiasAbiertas[familia]" class="suplementos-grid-premium animate-slide-down">
            <div
              v-for="(suplemento, index) in suplementos"
              :key="index"
              class="premium-suple-card"
              :class="{
                selected: isSelectedInFamily(familia, suplemento),
                disabled: suplemento.esSumable === false,
              }"
              @click="suplemento.esSumable !== false && onSetSeleccionFamilia(familia, suplemento)"
            >
              <div class="card-glow" v-if="isSelectedInFamily(familia, suplemento)"></div>
              <div class="suple-card-inner">
                <div class="check-icon-wrapper" v-if="isSelectedInFamily(familia, suplemento)">
                  <MDBIcon icon="check" />
                </div>
                <span class="suple-name-premium">{{ suplemento.nombre }}</span>
                <span v-if="!suplemento.esSumable" class="badge-status-pill">A peso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter v-if="!initialSeleccionadoPorFamilia || closeBtn" class="modal-footer-premium sticky-footer">
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
    :selectedSuplementos="selectedSuplementosForModal"
    @confirmarSuplementos="onConfirmarSuplementos"
  />
</template>
<script>
import { MDBModalHeader, MDBModalBody, MDBModalFooter, MDBBtn, MDBIcon } from "mdb-vue-ui-kit";
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
    const { familiasAbiertas, seleccionadoPorFamilia, onToggleFamilia, resetSelection, initFamilies } =
      useMenuSelection(suplByFamilyRef);

    const showSuplModal = ref(false);
    const suplArticle = ref(null);
    const selectedSuplementosForModal = ref([]);
    const pendingFamilia = ref(null);
    const pendingProducto = ref(null);
    const pendingSelection = ref(null);

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
            const normalized = Array.isArray(art)
              ? art.filter((item) => item && typeof item === "object")
              : art && typeof art === "object"
              ? [art]
              : [];
            if (normalized.length) {
              seleccionadoPorFamilia[familia] = normalized;
            }
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

    function normalizeFamilySelections(value) {
      if (Array.isArray(value)) {
        return value.filter((item) => item && typeof item === "object");
      }
      if (value && typeof value === "object") {
        return [value];
      }
      return [];
    }

    function getSelectedItemsForFamily(familia) {
      return normalizeFamilySelections(seleccionadoPorFamilia[familia]);
    }

    function isSelectedInFamily(familia, producto) {
      const idSup = producto.idArticulo ?? producto._id ?? null;
      return getSelectedItemsForFamily(familia).some((item) => (item.idArticulo ?? item._id ?? null) === idSup);
    }

    async function onSetSeleccionFamilia(familia, producto) {
      const idSup = producto.idArticulo ?? producto._id ?? null;
      const selectedItems = getSelectedItemsForFamily(familia);
      const existingSelection = selectedItems.find((item) => (item.idArticulo ?? item._id ?? null) === idSup);

      if (existingSelection) {
        const remaining = selectedItems.filter((item) => (item.idArticulo ?? item._id ?? null) !== idSup);
        if (remaining.length) {
          seleccionadoPorFamilia[familia] = remaining;
        } else {
          delete seleccionadoPorFamilia[familia];
        }
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
        pendingSelection.value = {
          idArticulo: idSup,
          nombre: producto.nombre ?? null,
          unidades: producto.unidades ?? 1,
          gramos: producto.gramos ?? null,
          printed: 0,
          impresora: data.impresora ?? null,
        };
        selectedSuplementosForModal.value = Array.isArray(existingSelection?.arraySuplementos)
          ? existingSelection.arraySuplementos
          : [];
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
      const currentSelections = getSelectedItemsForFamily(familia);
      currentSelections.push(obj);
      seleccionadoPorFamilia[familia] = currentSelections;
    }

    function onConfirmarSuplementos(suplementosSeleccionados) {
      if (!pendingFamilia.value || !pendingProducto.value) return;

      const objectInstances = [];
      for (let i = 0; i < (pendingProducto.value.unidades ?? 1); i++) {
        objectInstances.push({
          instanceId: Date.now() + i,
          printed: false,
        });
      }

      const obj = {
        ...pendingSelection.value,
        arraySuplementos: suplementosSeleccionados ?? null,
        instancias: objectInstances,
      };
      const currentSelections = getSelectedItemsForFamily(pendingFamilia.value);
      currentSelections.push(obj);
      seleccionadoPorFamilia[pendingFamilia.value] = currentSelections;
      pendingFamilia.value = null;
      pendingProducto.value = null;
      pendingSelection.value = null;
      selectedSuplementosForModal.value = [];
      suplArticle.value = null;
      showSuplModal.value = false;
    }

    function confirmarMenu() {
      emit("confirmarMenu", seleccionadoPorFamilia);
      emit("update:modelValue", false);
      resetSelection();
      selectedSuplementosForModal.value = [];
    }

    return {
      familiasAbiertas,
      seleccionadoPorFamilia,
      onToggleFamilia,
      onSetSeleccionFamilia,
      getSelectedItemsForFamily,
      isSelectedInFamily,
      confirmarMenu,
      modelValue: modalVisible,
      showSuplModal,
      suplArticle,
      selectedSuplementosForModal,
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

.selection-details-premium {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 4px;
}

.selection-detail-pill {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;

  &.more {
    color: #007bff;
    background-color: #edf6ff;
  }
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
