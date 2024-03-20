import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
import Employers from "./Employers";
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
        state.selectedTable = state.arrayTables.find(
          (x) => x.indexMesa == state.indexTable
        );
      }
    },
    async setTable(state, payload) {
      state.selectedTable = payload;
      state.indexTable = payload.indexMesa;
      await axios
        .post("cestas/cambiarCestaTrabajador", {
          idCesta: state.selectedTable._id,
          idTrabajador: Employers.state.selectedEmployer._id,
        })
        .then(async (res) => {
          // await router.push("/categoryselection");
        });
    },
    async addProduct(state, payload) {},
    async setProductPrinted(state, payload) {
      console.log(state.arrayTables);
      for (let i = 0; i < state.arrayTables.length; i++) {
        if (state.arrayTables[i]._id == state.selectedTable._id) {
          for (let j = 0; j < state.arrayTables[i].lista.length; j++) {
            state.arrayTables[i].lista[j].printed = true;
            console.log("hola", j, state.arrayTables[i].lista[j]);
            for (let k = 0; k < state.selectedTable.lista.length; k++) {
              state.selectedTable.lista[k].printed = true;
            }
          }
        }
      }
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
    setProductPrinted({ commit }, data) {
      commit("setProductPrinted", data);
    },
  },
};
