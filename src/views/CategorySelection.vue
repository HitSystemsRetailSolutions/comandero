<template>
  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherEmployer" class="employer"
        ><MDBIcon icon="user-tag" />&nbsp;&nbsp; {{ SelectEmployer.nombre }}
      </MDBListGroupItem>
      <MDBListGroupItem @click="selectOtherTable" class="employer"
        ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
        {{ selectTable.indexMesa + 1 }}
      </MDBListGroupItem>
      <MDBListGroupItem class="employer"
        ><div class="ticketBtn">
          <div>
            <MDBIcon icon="hand-holding-usd" />&nbsp;&nbsp;
            <span>{{ totalTable.toFixed(2) }}€</span>
          </div>
          <span style="font-size: 0.9rem; font-style: italic"
            >Info. de mesa</span
          >
        </div>
      </MDBListGroupItem>
    </MDBListGroup>
    <hr />
    <div class="listDiv">
      <MDBListGroup class="tableList">
        <MDBListGroupItem
          v-for="(x, i) in categories"
          class="tablebtn"
          @click="selectCategory(i)"
          ><MDBIcon icon="box" />&nbsp;&nbsp;
          {{ x.nombre }}
          <div class="inUseDiv">
            <span style="font-size: 0.7rem; font-style: italic"
              >{{ x.arrayTeclas?.length }} productos</span
            >
          </div></MDBListGroupItem
        >
      </MDBListGroup>
    </div>
  </div>
</template>
<script>
import {
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";

export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBListGroupItem,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const totalTable = ref(0);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const selectTable = computed(() => store.state.Tables.selectedTable);
    const categories = computed(() => store.state.Categories.arrayCategories);
    const actualPage = computed(() => route.currentRoute.value.path);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const selectCategory = (i) => {
      router.push("/productselection");
      store.dispatch(
        "Categories/setSelectedCategoryMutation",
        categories.value[i]
      );
    };

    function setTotalTable() {
      let x = selectTable.value.detalleIva;
      totalTable.value =
        x.importe1 + x.importe2 + x.importe3 + x.importe4 + x.importe5;
    }

    onMounted(() => {
      setTotalTable();
      if (!SelectEmployer.value) router.push("/");
    });

    return {
      actualPage,
      selectOtherEmployer,
      router,
      selectOtherTable,
      selectTable,
      selectCategory,
      SelectEmployer,
      totalTable,
      setTotalTable,
      categories,
    };
  },
};
</script>

<style lang="scss" scoped>
.employerList {
  width: 100%;
  margin-top: 4%;
  height: 100%;
}
.tableList {
  width: 100%;
  margin-top: 4%;
  height: 100%;
}

.ticketBtn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.tablebtn {
  background-color: #ffffff69;
  padding: 5%;
}
.employer {
  background-color: #ffffff69;
  padding: 5%;
}

.inUseDiv {
  display: flex;
  flex-direction: column;
  right: 5%;
  position: absolute;
  align-items: center;
  top: 30%;
}
</style>
