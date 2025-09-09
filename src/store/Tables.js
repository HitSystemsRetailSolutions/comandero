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
      let arrayMesas = [];
      axios
        .get("mesas/getMesas")
        .then((resMesas) => {
          if (resMesas.data && resMesas.data.length === 50) {
            arrayMesas = resMesas.data;

            // Filtrar tablas que tienen indexMesa y añadir el nombre correspondiente
            state.arrayTables = payload
              .filter((table) => table.indexMesa != null)
              .map((table) => {
                const mesaConfig = arrayMesas[table.indexMesa];
                return {
                  ...table,
                  nombre: mesaConfig?.nombre || `Mesa ${table.indexMesa + 1}`,
                };
              });

            if (state.indexTable) {
              state.selectedTable = state.arrayTables.find(
                (x) => x.indexMesa == state.indexTable
              );
            }
          } else {
            throw Error("Error al obtener la configuración de mesas");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
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
