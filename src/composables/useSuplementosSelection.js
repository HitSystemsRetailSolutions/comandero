// Composable para la lógica de selección de suplementos
import { ref, watch } from "vue";

function getSupplementKey(supplement) {
  return String(supplement?.idArticulo ?? supplement?._id ?? supplement?.nombre ?? "");
}

export function useSuplementosSelection(suplArticle, initialSelectedSuplementos = []) {
  // Estado local reactivo para los suplementos
  const localSuplArticle = ref([]);

  // Sincroniza el estado local con el prop y marca los suplementos ya seleccionados
  watch(
    [suplArticle, initialSelectedSuplementos],
    ([val, selected]) => {
      const selectedKeys = (selected || []).map((item) => getSupplementKey(item)).filter(Boolean);

      localSuplArticle.value = val
        ? val.map((s) => ({
            ...s,
            selected: selectedKeys.includes(getSupplementKey(s)),
          }))
        : [];
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
