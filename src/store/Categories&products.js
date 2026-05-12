import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
export default {
  namespaced: true,
  state: {
    arrayCategories: [],
    arrayProducts: null,
    selectedCategory: null,
  },
  mutations: {
    setArrayCategoriesMutation(state, payload) {
      state.arrayCategories = payload;
    },
    setSelectedCategoryMutation(state, payload) {
      state.selectedCategory = payload;
    },
  },
  getters: {
    getCategories: (state) => state.arrayCategories,
  },
  actions: {
    setArrayCategoriesMutation({ commit, state }, data) {
      commit("setArrayCategoriesMutation", data);
      if (state.selectedCategory) {
        let updatedCategory = data.find(
          (cat) => cat.nombre === state.selectedCategory.nombre,
        );

        if (!updatedCategory) {
          // Buscamos en submenus
          for (const cat of data) {
            if (cat.arraySubmenus) {
              updatedCategory = cat.arraySubmenus.find(
                (sub) => sub.nombre === state.selectedCategory.nombre,
              );
              if (updatedCategory) break;
            }
          }
        }

        if (updatedCategory) {
          commit("setSelectedCategoryMutation", updatedCategory);
        }
      }
    },
    setSelectedCategoryMutation({ commit }, data) {
      commit("setSelectedCategoryMutation", data);
    },
  },
};

async function processSubMenu() {}
