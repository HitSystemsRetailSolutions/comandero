import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
export default {
  namespaced: true,
  state: {
    arrayEmployers: [],
    selectedEmployer: null,
    updating: false,
  },
  mutations: {
    setArrayEmployersMutation(state, payload) {
      state.arrayEmployers = payload;
    },
    async setEmployer(state, payload) {
      state.selectedEmployer = payload;
      await router.push("/tableselection");
    },
    setUpdatingMutation(state, payload) {
      state.updating = payload;
    },

    // se deselecciona el trabajador el nuevo activo no la inicia este framework y coincide con el trabajador activo
    setNewActiveMutation(state, payload) {

       if (
        payload ==state.selectedEmployer?._id && !state.updating
      ) {
        router.push("/employer");
        Swal.fire(
          "¡Alguien ha iniciado sesión!",
          "Alguien a iniciado como: " +
            state.selectedEmployer.nombre,
          "error"
        );
        state.selectedEmployer = null;
      }
      state.updating = false;
    },
  },
  getters: {
    getEmployers: (state) => state.arrayEmployers,
    getSelectedEmployer: (state) => state.selectedEmployer,
  },
  actions: {
    setArrayEmployersMutation({ commit }, data) {
      commit("setArrayEmployersMutation", data);
    },
    setSelectedEmployer({ commit }, data) {
      commit("setUpdatingMutation", true);
      commit("setEmployer", data);
    },
    setNewActive({ commit }, data) {
      commit("setNewActiveMutation", data);
    },
  },
};
