import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
export default {
  namespaced: true,
  state: {
    arrayTables: [],
    indexTable: null,
    selectedTable: [],
  },
  mutations: {
    arrayTables(state, payload) {
      state.arrayTables = payload.filter((table) => table.indexMesa != null);
      if (state.indexTable != null) {
        state.selectedTable = state.arrayTables[state.indexTable];
      }
    },
    async setTable(state, payload) {
      state.selectedTable = payload;
      state.indexTable = payload.indexMesa;
      await router.push("/categoryselection");
    },
    async addProduct(state, payload) {
      state.selectedTable.lista.push({
        arraySuplementos: null,
        gramos: null,
        idArticulo: payload.idArticle,
        nombre: payload.nombreArticulo,
        promocion: null,
        puntos: null,
        regalo: false,
        subtotal: payload.precioConIva,
        unidades: 1,
      });
    },
    async removeProduct(state, payload) {
      axios
        .post("cestas/borrarItemCesta", {
          idCesta: state.selectedTable._id,
          index: payload,
        })
        .then((resDelete) => {
          if (!resDelete.data) {
            throw Error("No se ha podido eliminar el artículo de la cesta");
          } else {
            state.selectedTable.lista.splice(payload, 1);
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    },
  },
  getters: {
    getTables: (state) => state.arrayTables,
    getSelectedTable: (state) => state.selectedTable,
  },
  actions: {
    arrayTablesMutation({ commit }, data) {
      commit("arrayTables", data);
    },
    setSelectedTable({ commit }, data) {
      commit("setTable", data);
    },
    addProduct({ commit }, data) {
      commit("addProduct", data);
    },
    removeProduct({ commit }, data) {
      commit("removeProduct", data);
    },
  },
};
