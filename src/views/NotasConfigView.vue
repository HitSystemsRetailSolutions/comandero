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
        <MDBIcon icon="sticky-note" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Configuración Notas</h2>
        <p class="hero-subtitle">Actualiza el orden, el texto y los elementos de las notas</p>
      </div>
    </div>

    <!-- Notas list -->
    <div class="notas-list" v-if="notas.length > 0">
      <div
        v-for="(nota, index) in notas"
        :key="nota.id || `nota-${index}`"
        class="nota-item"
        :class="{
          dragging: dragIndex === index || touchIndex === index,
          'confirm-mode': pendingDelete === index,
        }"
        :data-index="index"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
        @touchstart="onTouchStart($event, index)"
        @touchmove="onTouchMove($event)"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <template v-if="pendingDelete !== index">
          <div class="drag-handle">
            <MDBIcon icon="grip-vertical" />
          </div>
          <div class="nota-order">{{ index + 1 }}</div>
          <input
            v-model="nota.texto"
            @input="nota.texto = nota.texto.toUpperCase()"
            @keydown.enter="$event.target.blur()"
            class="nota-input"
            :placeholder="`Nota ${index + 1}`"
          />
          <div class="nota-actions">
            <button
              class="icon-button trash-button"
              type="button"
              @click="confirmDelete(index)"
            >
              <MDBIcon icon="trash" />
            </button>
          </div>
        </template>
        <div v-else class="delete-confirmation">
          <span class="confirm-text"
            >¿Eliminar <strong>{{ nota.texto || `Nota ${index + 1}` }}</strong>?</span
          >
          <div class="confirm-actions">
            <button class="cancel-btn" type="button" @click="pendingDelete = null">Cancelar</button>
            <button class="confirm-btn" type="button" @click="deleteNota(index)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-else>
      <MDBIcon icon="sticky-note" class="empty-icon" />
      <p class="empty-text">No hay notas configuradas</p>
    </div>

    <div class="info-row">
      <MDBIcon icon="info-circle" class="info-icon" />
      <span>Arrastra el icono <MDBIcon icon="grip-vertical" class="mx-1" /> para reordenar</span>
    </div>

    <div class="actions-row">
      <button class="secondary-btn" @click="addNota">
        <MDBIcon icon="plus" class="me-2" />Agregar nota
      </button>
      <button class="primary-btn" @click="saveNotas">
        <MDBIcon icon="check" class="me-2" />Guardar
      </button>
    </div>
  </div>
</template>

<script>
import { MDBIcon } from "mdb-vue-ui-kit";
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import router from "@/router";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_TEXTS = ["POCO HECHO", "AL PUNTO", "MUY HECHO", "PARA LLEVAR"];

export default {
  name: "NotasConfigView",
  components: { MDBIcon },
  setup() {
    const store = useStore();
    const notas = ref([]);
    const originalNotas = ref([]);
    const deletedIds = ref([]);
    const dragIndex = ref(null);
    const touchIndex = ref(null);
    const pendingDelete = ref(null);

    const loadInitial = async () => {
      const loaded = await store.dispatch("Notas/loadNotas");
      notas.value = loaded.map((nota) => ({ ...nota }));
      if (!notas.value.length) {
        notas.value = DEFAULT_TEXTS.map((texto, index) => ({
          id: uuidv4(),
          texto,
          orden: index + 1,
          timestamp: null,
          isNew: true,
        }));
      }
      originalNotas.value = notas.value.map((nota) => ({ ...nota }));
      deletedIds.value = [];
    };

    const addNota = () => {
      notas.value.push({
        id: uuidv4(),
        texto: "",
        orden: notas.value.length + 1,
        timestamp: null,
        isNew: true,
      });
    };

    const confirmDelete = (index) => {
      pendingDelete.value = index;
    };

    const deleteNota = (index) => {
      const [removed] = notas.value.splice(index, 1);
      if (!removed?.isNew) deletedIds.value.push(removed.id);
      notas.value = notas.value.map((nota, idx) => ({
        ...nota,
        orden: idx + 1,
      }));
      pendingDelete.value = null;
    };

    const swapNotas = (from, to) => {
      if (
        from === to ||
        from == null ||
        to == null ||
        Number.isNaN(from) ||
        Number.isNaN(to) ||
        from < 0 ||
        to < 0 ||
        from >= notas.value.length ||
        to >= notas.value.length
      )
        return;
      const updated = [...notas.value];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      notas.value = updated.map((nota, index) => ({
        ...nota,
        orden: index + 1,
      }));
    };

    // El arrastre (ratón y táctil) solo se inicia desde el icono .drag-handle,
    // así el input de texto y el botón de borrar siguen funcionando con normalidad.
    const onDragStart = (event, index) => {
      if (!event.target.closest(".drag-handle")) {
        event.preventDefault();
        return;
      }
      dragIndex.value = index;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    };

    const onDragOver = (event, index) => {
      if (dragIndex.value === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragIndex.value === index) return;
      swapNotas(dragIndex.value, index);
      dragIndex.value = index;
    };

    const onDrop = (event) => {
      event.preventDefault();
      dragIndex.value = null;
    };

    const onDragEnd = () => {
      dragIndex.value = null;
    };

    const onTouchStart = (event, index) => {
      if (!event.target.closest(".drag-handle")) return;
      touchIndex.value = index;
    };

    const onTouchMove = (event) => {
      if (touchIndex.value === null) return;
      // Solo se bloquea el scroll de la página mientras hay un arrastre activo
      event.preventDefault();
      const touch = event.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const item = target?.closest?.(".nota-item");
      if (!item || item.dataset.index === undefined) return;
      const hoverIndex = Number(item.dataset.index);
      if (Number.isNaN(hoverIndex) || hoverIndex === touchIndex.value) return;
      swapNotas(touchIndex.value, hoverIndex);
      touchIndex.value = hoverIndex;
    };

    const onTouchEnd = () => {
      touchIndex.value = null;
    };

    const saveNotas = async () => {
      const timestamp = Date.now();
      const originalById = new Map(
        originalNotas.value.map((nota) => [nota.id, nota]),
      );

      const crear = [];
      const modificar = [];

      const prepared = notas.value.map((nota, index) => {
        const texto = nota.texto.trim();
        const orden = index + 1;

        if (nota?.isNew) {
          crear.push({id: nota.id, texto, orden, timestamp });
        } else {
          const original = originalById.get(nota.id);
          if (!original || original.texto !== texto || original.orden !== orden) {
            modificar.push({ id: nota.id, value: texto, orden, timestamp });
          }
        }

        return { ...nota, texto, orden, timestamp };
      });

      await store.dispatch("Notas/saveNotas", {
        notas: prepared,
        crear,
        modificar,
        eliminar: deletedIds.value,
      });
      router.push("/employer");
    };

    const volver = () => {
      router.push("/configmenu");
    };

    onMounted(loadInitial);

    return {
      notas,
      addNota,
      confirmDelete,
      deleteNota,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      saveNotas,
      volver,
      pendingDelete,
      dragIndex,
      touchIndex,
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

/* ── Notas list ── */
.notas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.nota-item {
  display: grid;
  grid-template-columns: 32px 28px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background-color: #ffffff69;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &.dragging {
    opacity: 0.55;
    border-color: #007bff44;
    box-shadow: 0 6px 16px rgba(0, 123, 255, 0.15);
  }

  &.confirm-mode {
    background-color: #fff5f5;
    border-color: #ffc9c9;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #adb5bd;
  cursor: grab;
  touch-action: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff90;
    color: #007bff;
  }

  &:active {
    cursor: grabbing;
  }
}

.nota-order {
  font-weight: 700;
  color: #495057;
  text-align: center;
  font-size: 0.9rem;
}

.nota-input {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #212529;
  background-color: #ffffff;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff88;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.12);
  }
}

.nota-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.icon-button {
  border: none;
  background: transparent;
  color: #adb5bd;
  cursor: pointer;
  font-size: 1.05rem;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: #fa5252;
    background-color: #fff5f5;
  }
}

.delete-confirmation {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.confirm-text {
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.3;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.confirm-btn,
.cancel-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn {
  background: #fa5252;
  color: #fff;

  &:hover {
    background: #e03131;
  }
}

.cancel-btn {
  background: #f1f3f5;
  color: #495057;

  &:hover {
    background: #e9ecef;
  }
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 12px;
  color: #adb5bd;
}

.empty-icon {
  font-size: 2.5rem;
}

.empty-text {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

/* ── Info row ── */
.info-row {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: #868e96;
  font-size: 0.85rem;
}

.info-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

/* ── Actions ── */
.actions-row {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 6px;
}

.secondary-btn,
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 13px 16px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn {
  background: #edf2ff;
  color: #3b6bdb;
  border: 1.5px solid #c5d4f7;
  flex: 1;

  &:hover {
    background: #dce6fc;
    border-color: #9db8f0;
    transform: translateY(-2px);
  }
}

.primary-btn {
  background: #e6f7ef;
  color: #1a7a4a;
  border: 1.5px solid #b8e6d0;
  flex: 2;

  &:hover {
    background: #d4f0e2;
    border-color: #8fd4b4;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26, 122, 74, 0.12);
  }
}

@media (max-width: 640px) {
  .nota-item {
    grid-template-columns: 28px 22px minmax(0, 1fr) auto;
    padding: 10px 12px;
  }

  .delete-confirmation {
    flex-direction: column;
    align-items: stretch;
  }

  .confirm-actions {
    justify-content: flex-end;
  }
}
</style>
