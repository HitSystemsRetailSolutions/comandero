import axios from "axios";

export default {
  namespaced: true,
  state: {
    notas: [],
  },
  getters: {
    sortedNotas: (state) => [...state.notas].sort((a, b) => a.orden - b.orden),
    hasNotas: (state) => state.notas.length > 0,
  },
  mutations: {
    setNotasMutation(state, payload) {
      state.notas = payload;
    },
  },
  actions: {
    loadNotas({state}){
      return state.notas;
    },
    async getServidor({ state, dispatch }) {
      try {
        const response = await axios.get("notas/getServidor");
        const notas = response.data;
        dispatch("setNotas", notas);
        return true;
      } catch (error) {
        console.error("Error cargando notas desde servidor:", error);
        return false;
      }
    },
    setNotas({ commit }, payload) {
      const notas = payload.map((nota, index) => ({
        id: nota.id || null,
        texto: nota.texto || "",
        orden: nota.orden || index + 1,
        timestamp: nota.timestamp || null,
      }));
      commit("setNotasMutation", notas);
      return notas;
    },
    async saveNotas({ dispatch }, { notas, crear, modificar, eliminar }) {
      const timestamp = Date.now();
      const prepared = notas.map((nota, index) => ({
        id: nota.id || null,
        texto: nota.texto || "",
        orden: index + 1,
        timestamp,
      }));
      dispatch("setNotas", prepared);
      const acciones = {
        crear,
        modificar,
        eliminar,
        timestamp,
      };
      try {
        await axios.post("notas/registrarCambiosLocales", { lista: prepared, acciones });
      } catch (error) {
        console.error("Error guardando notas en servidor:", error);
      }
      return prepared;
    },
  },
};
