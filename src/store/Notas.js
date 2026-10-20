import axios from "axios";
import { DEFAULT_TEXTS } from "../constants/notas";

export default {
  namespaced: true,
  state: {
    notas: [],
  },
  getters: {
    sortedNotas: (state) => state.notas.length
      ? [...state.notas].sort((a, b) => a.orden - b.orden)
      : DEFAULT_TEXTS.map((texto, index) => ({
        id: null, texto, orden: index + 1, timestamp: null, isNew: true,
      })),
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
    async getServidor({ dispatch }) {
      try {
        const response = await axios.get("notas/getServidor");
        const notas = response.data;
        if (!Array.isArray(notas)) throw Error("Respuesta de notas no válida");
        await dispatch("setNotas", notas);
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
        isNew: Boolean(nota.isNew),
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
        timestamp: nota.timestamp || null,
        isNew: Boolean(nota.isNew),
      }));
      const acciones = {
        crear,
        modificar,
        eliminar,
        timestamp,
      };
      try {
        const response = await axios.post("notas/registrarCambiosLocales", { lista: prepared, acciones });
        if (response.data !== true) throw Error("No se pudieron guardar las notas");
        await dispatch("setNotas", prepared);
      } catch (error) {
        console.error("Error guardando notas en servidor:", error);
        throw error;
      }
      return prepared;
    },
  },
};
