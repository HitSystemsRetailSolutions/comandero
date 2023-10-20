<template>
  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem class="hideInfo" @click="hideInfo = !hideInfo"
        ><MDBIcon :icon="hideInfo ? 'angle-down' : 'angle-up'" />&nbsp;&nbsp;
        {{ hideInfo ? "Mostrar " : "Esconder " }} información
      </MDBListGroupItem>
      <MDBListGroupItem
        @click="selectOtherEmployer"
        style="width: 97%"
        v-if="!hideInfo"
        class="employer"
        ><MDBIcon icon="user-tag" />&nbsp;&nbsp; {{ SelectEmployer.nombre }}
      </MDBListGroupItem>
      <MDBListGroupItem
        style="width: 97%"
        @click="selectOtherTable"
        v-if="!hideInfo"
        class="employer"
        ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
        {{ selectTable.indexMesa + 1 }}
      </MDBListGroupItem>
      <MDBListGroupItem style="width: 97%" class="employer" v-if="!hideInfo"
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
        <MDBListGroupItem @click="selectOtherCategory" class="employer"
          ><MDBIcon icon="box" />&nbsp;&nbsp;
          {{ products.nombre }}
        </MDBListGroupItem>
        <MDBListGroupItem
          v-for="(x, i) in products.arrayTeclas.filter(
            (prods) => prods.esSumable
          )"
          class="tablebtn flex-product"
          ><div class="inUseDivR">
            <MDBIcon
              @click="removeProduct(x, y)"
              style="font-size: 6vmin"
              icon="minus"
            />
          </div>
          <div style="text-align: center">
            <div>
              <MDBIcon icon="tags" style="font-size: 3vmin" />&nbsp;&nbsp;
              <span style="font-size: 4.3vmin">{{ x.nombreArticulo }}</span>
            </div>
            <span
              ><i>{{ x.precioConIva }}€</i></span
            >
            &nbsp;&nbsp;<span>
              <b
                >x{{
                  selectTable.lista.filter(
                    (products) => products.idArticulo == x.idArticle
                  )[0]?.unidades || 0
                }}</b
              ></span
            >
          </div>
          <div class="inUseDivL">
            <MDBIcon
              @click="addProduct(x, i)"
              style="font-size: 6vmin"
              icon="plus"
            /></div
        ></MDBListGroupItem>
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
import axios from "axios";
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
    const hideInfo = ref(false);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    let selectTable = computed(() => store.state.Tables.selectedTable);
    let products = computed(() => store.state.Categories.selectedCategory);
    const actualPage = computed(() => route.currentRoute.value.path);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    const selectOtherTable = () => {
      router.push("/tableselection");
    };
    const selectOtherCategory = () => {
      router.push("/categoryselection");
    };

    function setTotalTable() {
      let x = selectTable.value.detalleIva;
      totalTable.value =
        x.importe1 + x.importe2 + x.importe3 + x.importe4 + x.importe5;
    }

    const addProduct = async (x, i) => {
      await axios.post("teclado/clickTeclaArticulo", {
        idArticulo: x.idArticle,
        gramos: 0,
        idCesta: selectTable.value._id,
        unidades: 1,
        arraySuplementos: null,
        nombre: x.nombreArticulo,
        menu: products.value.nombre,
      });
      if (
        selectTable.value.lista.filter(
          (products) => products.idArticulo == x.idArticle
        ).length > 0
      ) {
        for (let i = 0; i < selectTable.value.lista.length; i++) {
          if (selectTable.value.lista[i].idArticulo == x.idArticle) {
            selectTable.value.lista[i].unidades += 1;
            totalTable.value += x.precioConIva;
          }
        }
      } else {
        store.dispatch("Tables/addProduct", x);
        totalTable.value += x.precioConIva;
      }
    };
    const removeProduct = async (x, i) => {
      let z = selectTable.value.lista.filter(
        (products) => products.idArticulo == x.idArticle
      );
      if (z.length > 0) {
        if (z[0].unidades > 1) {
          for (let i = 0; i < selectTable.value.lista.length; i++) {
            if (selectTable.value.lista[i].idArticulo == x.idArticle) {
              selectTable.value.lista[i].unidades -= 1;
              totalTable.value -= x.precioConIva;
            }
          }
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticle,
            gramos: 0,
            idCesta: selectTable.value._id,
            unidades: -1,
            arraySuplementos: null,
            nombre: x.nombreArticulo,
            menu: products.value.nombre,
          });
        } else if (z[0].unidades == 1) {
          totalTable.value -= x.precioConIva;
          store.dispatch(
            "Tables/removeProduct",
            selectTable.value.lista.indexOf(z[0])
          );
        }
      }
    };

    onMounted(() => {
      totalTable.value = 0;
      setTotalTable();
      if (SelectEmployer.value == null) {
        router.push("/");
      }
    });

    return {
      actualPage,
      selectOtherEmployer,
      router,
      selectOtherTable,
      selectOtherCategory,
      setTotalTable,
      removeProduct,
      hideInfo,
      selectTable,
      addProduct,
      totalTable,
      SelectEmployer,
      products,
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
  align-self: center;
  width: 100%;
}
.hideInfo {
  background-color: #ffffff69;
  padding: 5%;
  align-self: center;
  width: 100%;
}

.inUseDivR {
  display: flex;
  flex-direction: column;

  align-items: center;
  top: 30%;
}

.flex-product {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>
