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
    </MDBListGroup>
    <hr />
    <div>
      <div class="btnClients">
        <MDBIcon
          icon="backward"
          @click="
            clientsInTable -= 5;
            clientsManager();
          "
        />
        <MDBIcon
          icon="minus"
          @click="
            clientsInTable--;
            clientsManager();
          "
        />
        <MDBIcon
          icon="plus"
          @click="
            clientsInTable++;
            clientsManager();
          "
        />
        <MDBIcon
          icon="forward"
          @click="
            clientsInTable += 5;
            clientsManager();
          "
        />
      </div>
      <div style="text-align: center">
        <span style="font-size: 3vh; margin-top: 5%"
          >{{ clientsInTable }} clientes en la mesa
          {{ selectTable.indexMesa + 1 }}</span
        >
      </div>

      <hr />
      <div class="divClients">
        <div v-for="i in clientsInTable" style="padding: 3%" class="client">
          <MDBIcon icon="user-tie" />
          <p class="clientNum">
            {{ i }}
          </p>
        </div>
      </div>
      <MDBIcon
        icon="check"
        @click="confirmClients()"
        style="
          position: fixed;
          bottom: 2%;
          right: 6%;
          color: darkslategray;
          font-size: 6vh;
          text-shadow: -3px -2px 7px lightgray;
        "
      />
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
import axios from "axios";

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
    const clientsInTable = ref(1);
    const selectTable = computed(() => store.state.Tables.selectedTable);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    const clientsManager = () => {
      if (clientsInTable.value < 1) {
        clientsInTable.value = 1;
      }
    };

    onMounted(() => {
      clientsInTable.value = selectTable.value?.comensales || 1;
    });

    const confirmClients = async () => {
      const res = await axios
        .post("/cestas/setClients", {
          clients: clientsInTable.value,
          cesta: selectTable.value._id,
        })
        .then((res) => {
          console.log(res);
          if (res) router.push("/categoryselection");
        });
    };

    return {
      selectTable,
      confirmClients,
      actualPage,
      selectTable,
      selectOtherEmployer,
      router,
      tables,
      SelectEmployer,
      clientsManager,
      clientsInTable,
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

.divClients {
  font-size: 6vh;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 50vh;
  overflow-y: scroll;
  margin-top: 7vh;
  flex-direction: row;
  flex-wrap: wrap;
}
.client {
  padding: 3%;
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  position: relative;
  justify-content: center;
}
.clientNum {
  font-size: 1rem;
  position: absolute;
  right: 0px;
  bottom: 6%;
  margin-bottom: 0px;
  color: white;
  text-shadow: 1px 1px black;
  -webkit-text-stroke: 0.2px black;
}
.btnClients {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  font-size: 5vh;
}
</style>
