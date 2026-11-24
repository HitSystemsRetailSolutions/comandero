// Composable para la lógica de selección de suplementos
import { ref, watch } from "vue";

function getSupplementKey(supplement) {
  return String(supplement?.idArticulo ?? supplement?._id ?? supplement?.nombre ?? "");
}

export function useSuplementosSelection(suplArticle, initialSelectedSuplementos = []) {
  // Estado local reactivo para los suplementos
  const localSuplArticle = ref([]);

  // Sincroniza el estado local con el prop, marca los seleccionados y los ordena alfabéticamente
  watch(
    [suplArticle, initialSelectedSuplementos],
    ([val, selected]) => {
      const selectedKeys = (selected || []).map((item) => getSupplementKey(item)).filter(Boolean);

      if (val) {
        // Mapeamos los elementos
        const mapped = val.comap 
          ? val.map((s) => ({
              ...s,
              selected: selectedKeys.includes(getSupplementKey(s)),
            }))
          : val.map((s) => ({
              ...s,
              selected: selectedKeys.includes(getSupplementKey(s)),
            }));

        // Ordenamos alfabéticamente por 'nombre'
        mapped.sort((a, b) =>
          (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" })
        );

        localSuplArticle.value = mapped;
      } else {
        localSuplArticle.value = [];
      }
    },
    { immediate: true, deep: true },
  );

  // Alternar selección
  function toggleSuplemento(x) {
    x.selected = !x.selected;
  }

  // Obtener seleccionados
  function getSeleccionados() {
    return localSuplArticle.value.filter((s) => s.selected);
  }

  // Resetear selección
  function resetSelection() {
    localSuplArticle.value.forEach((s) => (s.selected = false));
  }

  return {
    localSuplArticle,
    toggleSuplemento,
    getSeleccionados,
    resetSelection,
  };
}