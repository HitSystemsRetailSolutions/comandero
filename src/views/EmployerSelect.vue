<template>
  <!--  <MDBFooter class="bottomMenu" :text="['center']">
    
    <div class="text-center p-3">
      <div class="ButtonsResponsive">
        <MDBIcon icon="home" />
        <MDBIcon icon="user-tag" />
        <MDBIcon icon="border-all" />
        <MDBIcon icon="shopping-basket" />
      </div>
    </div>
    
  </MDBFooter> -->
  <br />
  <div class="listDiv">
    <MDBListGroup class="employersList">
      <MDBListGroupItem
        v-for="(x, i) in employers"
        class="employer"
        @click="SelectEmployer(i)"
        ><MDBIcon icon="user-tag" />&nbsp;&nbsp; {{ x.nombre }}
        <div class="timeEmployer">
          <span style="font-size: 0.8rem; font-style: italic"
            >Estado actual:</span
          >
          <span style="font-size: 0.7rem; font-style: italic">Fichado</span>
        </div></MDBListGroupItem
      >
    </MDBListGroup>
  </div>
  <br />
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
import router from "@/router";

import { useRouter } from "vue-router";
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
    const employers = computed(() => store.state.Employers.arrayEmployers);
    const actualPage = computed(() => route.currentRoute.value.path);

    function SelectEmployer(i) {
      store.dispatch("Employers/setSelectedEmployer", employers.value[i]);
    }
    onMounted(() => {
      if (employers.value.length == 0) {
        router.push("/");
      }
    });
    return {
      actualPage,
      SelectEmployer,
      employers,
    };
  },
};
</script>

<style lang="scss" scoped>
.listDiv {
  top: 2rem;
}
.employersList {
  width: 100%;
  height: 100%;
}

.employer {
  background-color: #ffffff69;
  padding: 5%;
}

.timeEmployer {
  display: flex;
  flex-direction: column;
  right: 5%;
  position: absolute;
  align-items: center;
  top: 20%;
}
.titleEmployersSelector {
  margin-top: 5%;
  font-size: 7vw;
}
</style>
