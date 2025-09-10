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
    mesas: [],
  },
  mutations: {
    async arrayTables(state, payload) {
      // Solo cargar mesas si el array está vacío
      if (state.mesas.length === 0) {
        try {
          const resMesas = await axios.get("mesas/getMesas");
          state.mesas = resMesas.data;
        } catch (error) {
          console.error("Error cargando mesas:", error);
        }
      }

      const filteredTables = payload.filter((table) => table.indexMesa != null);

      // Preservar propiedades locales importantes como 'printed'
      const updatedTables = filteredTables.map((newTable) => {
        const existingTable = state.arrayTables.find(
          (t) => t._id === newTable._id
        );
        newTable.nombre = state.mesas.find(
          (e) => e._id == newTable.indexMesa
        ).nombre;
        if (existingTable && existingTable.lista) {
          // Preservar propiedades locales en los productos
          newTable.lista = newTable.lista.map((newProduct) => {
            const existingProduct = existingTable.lista.find(
              (p) =>
                p.idArticulo === newProduct.idArticulo &&
                JSON.stringify(p.arraySuplementos) ===
                  JSON.stringify(newProduct.arraySuplementos)
            );

            return newProduct;
          });
        }
        return newTable;
      });

      state.arrayTables = updatedTables;
      console.log(state.arrayTables);
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
