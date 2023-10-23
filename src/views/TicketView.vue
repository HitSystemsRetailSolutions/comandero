<template>
  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem
        @click="selectOtherTable"
        v-if="!hideInfo"
        class="employer"
        ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
        {{ selectedTable.indexMesa + 1 }}
      </MDBListGroupItem>
    </MDBListGroup>
    <hr />
    <div class="listDiv">
      <MDBTable style="transform: scale(0.95); margin-top: -1.5vh">
        <thead>
          <tr>
            <th scope="col">Uds.</th>
            <th scope="col">Producto</th>
            <th scope="col">€</th>
            <th scope="col">Opts.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="selectedTable.lista.length == 0">
            <td scope="row">Vacío</td>
            <td class="nameItem">Vacío</td>
            <td>0€</td>
            <td>Vacío</td>
          </tr>
          <tr v-for="(x, i) in selectedTable.lista">
            <th scope="row">x{{ x.unidades }}</th>
            <td>
              <span class="nameItem"> {{ x.nombre }}</span>
              <tr v-for="(z, y) in x.arraySuplementos" class="suplements">
                <td style="overflow: hidden; white-space: nowrap">
                  &nbsp;&nbsp;<i> > {{ z.nombre }}</i>
                </td>
              </tr>
            </td>
            <td>
              {{ x.subtotal.toFixed(2) }}€
              <tr v-for="(z, y) in x.arraySuplementos" class="suplements">
                <td>
                  <i> {{ z.precioConIva.toFixed(2) }}€</i>
                </td>
              </tr>
            </td>
            <td>
              &nbsp;&nbsp;&nbsp;<MDBIcon
                style="font-size: 4vmin"
                @click="removeProduct(x, i)"
                icon="trash-alt"
              />
            </td>
          </tr>
        </tbody>
      </MDBTable>
    </div>
    <hr />
    <div style="position: fixed; bottom: 0">
      <span
        style="
          font-size: 3vh;
          bottom: 12.5vh;
          margin-left: 2%;
          position: absolute;
        "
        ><MDBIcon icon="hand-holding-usd" />&nbsp;&nbsp;Total:
        {{
          (
            selectedTable.detalleIva.importe1 +
            selectedTable.detalleIva.importe2 +
            selectedTable.detalleIva.importe3 +
            selectedTable.detalleIva.importe4 +
            selectedTable.detalleIva.importe5
          ).toFixed(2)
        }}€</span
      >

      <MDBBtn
        outline="warning"
        style="width: 95%; margin-bottom: 3%"
        @click="router.push('/ticketview')"
        >Cobrar con efectivo&nbsp;&nbsp; <MDBIcon icon="euro-sign"></MDBIcon>
      </MDBBtn>

      <MDBBtn
        outline="primary"
        style="width: 95%; margin-bottom: 5%"
        @click="router.push('/ticketview')"
        >Cobrar con tarjeta&nbsp;&nbsp; <MDBIcon icon="credit-card"></MDBIcon>
      </MDBBtn>
    </div>
  </div>
</template>
<script>
import {
  MDBBtn,
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
  MDBTable,
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
    MDBTable,
    MDBListGroup,
    MDBListGroupItem,
    MDBBtn,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const hideInfo = ref(false);
    const tables = computed(() => store.state.Tables.arrayTables);
    let selectedTable = computed(() => store.state.Tables.selectedTable);
    const actualPage = computed(() => route.currentRoute.value.path);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    const removeProduct = async (x, i) => {
      let z = selectedTable.value.lista.filter(
        (products) => products.idArticulo == x.idArticulo
      );
      console.log(z);

      store.dispatch(
        "Tables/removeProduct",
        selectedTable.value.lista.indexOf(z[0])
      );
    };
    const selectOtherTable = () => {
      router.push("/tableselection");
    };
    onMounted(() => {
      if (tables.value.length == 0) {
        router.push("/");
      }
      console.log(selectedTable.value);
    });
    return {
      selectedTable,
      actualPage,
      selectOtherEmployer,
      router,
      hideInfo,
      selectOtherTable,
      removeProduct,
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
}

.suplements {
  color: gray;
}

.listDiv {
  overflow: scroll;
  max-height: 55vh;
  overflow-x: hidden;
  margin-left: -1.3rem;
}
.nameItem {
  overflow: hidden;
  white-space: nowrap;
  width: 8rem;
  display: block;
  text-overflow: ellipsis;
}

.hideInfo {
  background-color: #ffffff69;
  padding: 5%;
  align-self: center;
  width: 100%;
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
