<template>
  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherEmployer" class="employer"
        ><MDBIcon icon="user-tag" />&nbsp;&nbsp; {{ SelectEmployer.nombre }}
      </MDBListGroupItem>
    </MDBListGroup>
    <hr />
    <div class="listDiv">
      <MDBListGroup class="tableList">
        <MDBListGroupItem
          v-for="(x, i) in tables"
          class="tablebtn"
          :style="
            x.lista.length > 0
              ? 'background-color: rgb(233 220 220 / 50%);'
              : ''
          "
          @click="selectTable(x)"
          ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
          {{ x.indexMesa + 1 }}
          <div class="inUseDiv" v-if="x.lista.length > 0">
            <span style="font-size: 0.8rem; font-style: italic"
              >Mesa en uso</span
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
import { ref, computed } from "vue";
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
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const tables = computed(() => store.state.Tables.arrayTables);
    const actualPage = computed(() => route.currentRoute.value.path);

    const selectTable = async (x) => {
      await store.dispatch("Tables/setSelectedTable", x);
      router.push("/clientsInTableSelection");
    };
    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    return {
      selectTable,
      actualPage,
      selectOtherEmployer,
      router,
      tables,
      SelectEmployer,
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
  margin-bottom: 5%;
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
