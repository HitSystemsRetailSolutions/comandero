<template>
  <MDBModal
    id="editProductModal"
    tabindex="-1"
    labelledby="editProductModal"
    v-model="isOpen"
    :staticBackdrop="true"
    size="lg"
    class="premium-modal edit-product-modal"
  >
    <MDBModalHeader class="modal-header-premium sticky-header">
      <div class="modal-title-premium d-flex w-100 align-items-center">
        <div class="title-icon-wrapper me-3">
          <MDBIcon icon="edit" class="title-icon" />
        </div>
        <div class="title-text-group">
          <span class="product-name-title">{{ product?.nombre }}</span>
          <span class="product-category-subtitle" v-if="product?.familia">{{
            product.familia
          }}</span>
        </div>
        <div class="ms-auto product-price-badge" v-if="product">
          {{ product.subtotal?.toFixed(2) }}€
        </div>
      </div>
    </MDBModalHeader>
    <MDBModalBody class="modal-body-premium scrollable-modal-body">
      <div class="glass-container" v-if="product">
        <!-- Main Controls Grid -->
        <div class="controls-grid">
          <!-- Quantity Adjuster -->
          <div class="control-card quantity-card">
            <div class="card-header-slim">
              <MDBIcon icon="calculator" class="me-2" />
              <span>Unidades</span>
            </div>

            <div class="quantity-selector">
              <button
                class="qty-btn minus"
                @click="handleRestProduct"
                :disabled="product.unidades <= 1"
              >
                <MDBIcon icon="minus" />
              </button>

              <div class="qty-display">
                <span class="qty-value">{{ product.unidades }}</span>
                <span class="qty-unit">uds</span>
              </div>

              <button
                class="qty-btn plus"
                @click="handleAddProduct"
                v-if="!product.nombre.includes('Promo. ')"
              >
                <MDBIcon icon="plus" />
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="control-card actions-card">
            <div class="card-header-slim">
              <MDBIcon icon="bolt" class="me-2" />
              <span>Acciones</span>
            </div>
            <div class="actions-group">
              <MDBBtn
                color="danger"
                class="premium-action-btn delete-btn w-100"
                @click="handleRemoveProduct"
              >
                <MDBIcon icon="trash-alt" class="me-2" /> Eliminar artículo
              </MDBBtn>
            </div>
          </div>
        </div>

        <!-- Supplements Section -->
        <div
          v-if="product.arraySuplementos && product.arraySuplementos.length > 0"
          class="premium-section supplements-section"
        >
          <div class="section-badge">
            <MDBIcon icon="plus-circle" class="me-2" />
            <span>Suplementos Añadidos</span>
          </div>

          <div class="supplements-grid">
            <div
              v-for="(x, i) in product.arraySuplementos"
              :key="i"
              class="premium-supplement-card"
            >
              <div class="sup-content">
                <div class="sup-icon-box">
                  <MDBIcon icon="puzzle-piece" />
                </div>
                <span class="sup-name">{{ x.nombre }}</span>
              </div>
              <button class="sup-remove-btn" @click="handleRemoveSuplement(i)">
                <MDBIcon icon="times" />
              </button>
            </div>
          </div>
        </div>

        <!-- Menu Configuration Section -->
        <div v-if="product.articulosMenu" class="premium-section menu-section">
          <div class="section-badge menu-badge mb-2">
            <MDBIcon icon="utensils" class="me-2" />
            <span>Configuración de Menú</span>
          </div>
          <MDBBtn
            color="primary"
            outline
            class="premium-action-btn w-100 d-flex align-items-center justify-content-center"
            @click="isMenuModalOpen = true"
          >
            <MDBIcon icon="utensils" class="me-2" />
            Modificar Opciones del Menú
          </MDBBtn>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter class="modal-footer-premium sticky-footer">
      <MDBBtn
        outline="primary"
        @click="isOpen = false"
        class="premium-close-btn"
      >
        <MDBIcon icon="times" class="me-2" /> Cerrar
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>
  <!-- Menu Modal extracted from body -->
  <MDBModal
    id="menuModalContainer"
    tabindex="-1"
    v-model="isMenuModalOpen"
    :staticBackdrop="true"
    size="lg"
  >
    <MenuModal
      v-if="menuDataLoaded && product?.articulosMenu"
      id="menuModal"
      :menuSelected="product"
      :suplByFamily="suplByFamily"
      :initialSeleccionadoPorFamilia="menuSeleccionadoPorFamilia"
      :closeBtn="true"
      @aplicarCambios="onAplicarCambios"
      @update:modelValue="isMenuModalOpen = $event"
    />
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
import MenuModal from "@/components/MenuModal.vue";
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";

export default {
  name: "EditProductModal",
  components: {
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
    MDBBtn,
    MDBIcon,
    MenuModal,
  },
  props: {
    modelValue: Boolean,
    index: Number,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const store = useStore();
    const isOpen = computed({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    const selectedTable = computed(() => store.state.Tables.selectedTable);
    const product = computed(() => selectedTable.value?.lista[props.index]);

    const isMenuModalOpen = ref(false);
    const menuArticles = ref([]);
    const menuDataLoaded = ref(false);

    const fetchMenuDetails = async () => {
      menuDataLoaded.value = false;
      if (product.value?.articulosMenu) {
        try {
          const infoArticle = await axios.post("articulos/getArticuloById", {
            idArticulo: product.value.idArticulo,
          });
          const res = await axios.post("articulos/getSuplementos", {
            arrayIdSuplementos: infoArticle?.data?.suplementos,
          });
          menuArticles.value = res.data;
          menuDataLoaded.value = true;
        } catch (error) {
          console.error("Error fetching menu details:", error);
          menuDataLoaded.value = true;
        }
      } else {
        menuDataLoaded.value = true;
      }
    };

    watch(() => props.index, fetchMenuDetails, { immediate: true });
    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) fetchMenuDetails();
      },
    );

    const suplByFamily = computed(() => {
      const grupos = {};
      menuArticles.value.forEach((sup) => {
        const familia = sup.familia || "Sin familia";
        if (!grupos[familia]) grupos[familia] = [];
        grupos[familia].push(sup);
      });
      const familiasOrdenadas = Object.keys(grupos).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      const resultado = {};
      familiasOrdenadas.forEach((fam) => {
        resultado[fam] = grupos[fam].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, undefined, { sensitivity: "base" }),
        );
      });
      return resultado;
    });

    const menuSeleccionadoPorFamilia = computed(() => {
      const result = {};
      const articulosMenu = product.value?.articulosMenu;
      const suplMap = {};
      Object.entries(suplByFamily.value).forEach(([familia, sups]) => {
        sups.forEach((sup) => {
          suplMap[String(sup.idArticulo || sup._id)] = { familia, sup };
        });
      });
      if (articulosMenu && Array.isArray(articulosMenu)) {
        articulosMenu.forEach((art) => {
          const match = suplMap[String(art.idArticulo)];
          if (match) {
            result[match.familia] = {
              idArticulo: art.idArticulo ?? art._id ?? null,
              nombre: art.nombre ?? null,
              arraySuplementos: art.arraySuplementos ?? null,
              unidades: art.unidades ?? 1,
              gramos: art.gramos ?? null,
              printed: art.printed ?? 0,
              impresora: art.impresora ?? null,
              instancias: art.instancias ?? [],
            };
          }
        });
      }
      return result;
    });

    const handleAddProduct = async () => {
      await axios.post("teclado/clickTeclaArticulo", {
        idArticulo: product.value.idArticulo,
        gramos: product.value.gramos ?? 0,
        idCesta: selectedTable.value._id,
        unidades: 1,
        arraySuplementos: product.value.arraySuplementos ?? null,
        nombre: product.value.nombre,
        menu: "",
      });
    };

    const handleRestProduct = async () => {
      if (product.value.unidades > 1) {
        await axios.post("teclado/clickTeclaArticulo", {
          idArticulo: product.value.idArticulo,
          gramos: product.value.gramos ?? 0,
          idCesta: selectedTable.value._id,
          unidades: -1,
          arraySuplementos: product.value.arraySuplementos ?? null,
          nombre: product.value.nombre,
          menu: "",
        });
      }
    };

    const handleRemoveProduct = async () => {
      await store.dispatch("Tables/removeProduct", props.index);
      isOpen.value = false;
    };

    const handleRemoveSuplement = async (supIndex) => {
      isOpen.value = false;
      const x = { ...product.value };
      await store.dispatch("Tables/removeProduct", props.index);

      const newSups = [...x.arraySuplementos];
      newSups.splice(supIndex, 1);
      const finalSups = newSups.length > 0 ? newSups : null;

      setTimeout(async () => {
        try {
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticulo,
            gramos: x.gramos ?? 0,
            idCesta: selectedTable.value._id,
            unidades: 1,
            arraySuplementos: finalSups,
            nombre: x.nombre,
            menu: "",
          });
          // Re-open modal for the newly added item (which will be at the end probably)
          // Wait for state sync
          setTimeout(() => {
            isOpen.value = true;
          }, 50);
        } catch (error) {
          console.error("Error removing supplement:", error);
        }
      }, 100);
    };

    const onAplicarCambios = async (menu) => {
      const seleccionadoPorFamilia = Object.values(menu);
      try {
        await axios.post("cestas/modificarArticuloMenu", {
          idCesta: selectedTable.value._id,
          articulosMenu: seleccionadoPorFamilia,
          indexCesta: props.index,
        });
      } catch (error) {
        console.error("Error applying menu changes:", error);
      }
    };

    return {
      isOpen,
      product,
      handleAddProduct,
      handleRestProduct,
      handleRemoveProduct,
      handleRemoveSuplement,
      suplByFamily,
      menuSeleccionadoPorFamilia,
      onAplicarCambios,
      menuDataLoaded,
      isMenuModalOpen,
    };
  },
};
</script>

<style lang="scss" scoped>
.edit-product-modal {
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

.product-price-badge {
  background-color: #ffffff69;
  color: #28a745;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 1px solid #28a745;
}

.modal-body-premium {
  padding: 20px;
  background-color: #f8f9fa;
}

.glass-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 15px;
}

@media (max-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }
}

.control-card {
  background-color: #ffffff69;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header-slim {
  font-size: 0.85rem;
  font-weight: bold;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #dee2e6;
}

.qty-btn {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s;

  &.minus {
    background-color: #f8f9fa;
    color: #495057;
    &:hover:not(:disabled) {
      background-color: #e9ecef;
    }
    &:disabled {
      opacity: 0.5;
    }
  }

  &.plus {
    background-color: #e3f2fd;
    color: #007bff;
    &:hover {
      background-color: #bbdefb;
    }
  }
}

.qty-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #212529;
}

.qty-unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: #adb5bd;
  text-transform: uppercase;
}

.premium-action-btn {
  border-radius: 10px;
  padding: 12px;
  font-weight: bold;
  text-transform: none;
  font-size: 0.95rem;
  box-shadow: none;

  &.delete-btn {
    background-color: #fa5252;
    &:hover {
      background-color: #e03131;
    }
  }
}

.premium-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-badge {
  align-self: flex-start;
  background-color: #e8f5e9;
  color: #28a745;
  padding: 5px 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

.supplements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.premium-supplement-card {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #adb5bd;
  }
}

.sup-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
}

.sup-remove-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background-color: #fff5f5;
  color: #fa5252;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  &:hover {
    background-color: #ffe3e3;
    color: #e03131;
  }
}

.menu-modal-wrapper {
  background-color: #ffffff69;
  border-radius: 12px;
  padding: 2px;
  border: 1px solid #e9ecef;
}

.modal-footer-premium {
  background-color: #ffffff69;
  border-top: 2px solid #e9ecef;
  padding: 12px 20px;
}

.premium-close-btn {
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
