<template>
  <MDBModal
    id="openEditProductModal"
    tabindex="-1"
    labelledby="openEditProductModal"
    v-model="openEditProductModal"
    :staticBackdrop="true"
    size="xl"
    style="background-color: #fff9f2"
  >
    <MDBModalHeader style="background-color: #fff9f2">
      <span style="font-size: 3vh; margin-top: 5%"
        ><b>{{ selectedTable.lista[EditProductModalInfo].nombre }}</b></span
      >
    </MDBModalHeader>
    <MDBModalBody style="background-color: #fff9f2">
      <div>
        <div>
          <span style="font-size: 2.5vh; margin-top: 5%"><b>Unidades</b></span>
          <hr />
          <div class="divUnidadesModal">
            <div>
              <span style="font-size: 4vh; margin-top: 5%">
                <b>{{ selectedTable.lista[EditProductModalInfo].unidades }}</b>
                uds.
              </span>
            </div>
            <div class="divBotonesModal">
              <MDBIcon
                @click="addProduct(selectedTable.lista[EditProductModalInfo])"
                style="font-size: 5vmin"
                icon="plus"
              />
              <MDBIcon
                @click="
                  removeProduct(selectedTable.lista[EditProductModalInfo]);
                  openEditProductModal = false;
                "
                style="font-size: 5vmin"
                icon="trash-alt"
              />
              <MDBIcon
                @click="restProduct(selectedTable.lista[EditProductModalInfo])"
                style="font-size: 5vmin"
                :style="
                  selectedTable.lista[EditProductModalInfo].unidades == 1
                    ? 'color: gray; opacity: 0.5; cursor: not-allowed;'
                    : ''
                "
                icon="minus"
              />
            </div>
          </div>
          <hr />
          <div
            v-if="selectedTable.lista[EditProductModalInfo].arraySuplementos"
          >
            <span style="font-size: 2.5vh; margin-top: 5%"
              ><b>Suplementos</b></span
            >
            <hr />
            <div
              v-for="(x, i) in selectedTable.lista[EditProductModalInfo]
                .arraySuplementos"
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  margin-left: 5%;
                  margin-right: 5%;
                  margin-top: 3%;
                  align-items: center;
                "
              >
                <span style="font-size: 2.2vh; color: gray; font-style: italic"
                  >> {{ x.nombre }}</span
                >
                <MDBIcon
                  @click="removeSuplement(i)"
                  style="font-size: 5vmin"
                  icon="trash-alt"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MDBModalBody>
    <MDBModalFooter style="background-color: #fff9f2">
      <MDBBtn @click="openEditProductModal = false">Cerrar</MDBBtn>
    </MDBModalFooter>
  </MDBModal>

  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherTable" class="employer"
        ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
        {{ selectedTable.indexMesa + 1 }}
      </MDBListGroupItem>
      <MDBListGroupItem @click="changeClients" class="employer"
        ><MDBIcon icon="user-tie" />&nbsp;&nbsp;
        {{ selectedTable.comensales }} comensales
      </MDBListGroupItem>
      <MDBListGroupItem
        class="employer"
        @click="sendToPrepare"
        v-bind:disabled="selectedTable.lista.length == 0"
        :style="selectedTable.lista.length == 0 ? 'opacity: 0.5' : ''"
        ><MDBIcon icon="print" />&nbsp;&nbsp; Preparar
      </MDBListGroupItem>
    </MDBListGroup>
    <hr />
    <div class="listDiv">
      <div
        v-if="selectedTable.lista.length == 0"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 2rem;
          text-align: center;
          margin: auto;
          margin-left: 5%;
        "
      >
        <span><MDBIcon icon="shopping-basket"></MDBIcon></span>
        <span>No hay productos en esta cesta</span>
      </div>
      <MDBTable
        style="transform: scale(0.95); margin-top: -1.5vh"
        v-if="selectedTable.lista.length > 0"
      >
        <thead>
          <tr>
            <th scope="col">Uds.</th>
            <th scope="col">Producto</th>
            <th scope="col">€</th>

            <!-- <th scope="col">Opts.</th>-->
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(x, i) in selectedTable.lista"
            v-on:click="selectProduct(i)"
            :style="actProd == i ? 'background-color: #f6ebdf;' : ''"
          >
            <th scope="row">x{{ x.unidades }}</th>
            <td>
              <span class="nameItem">
                <MDBIcon
                  style="font-size: 0.6rem; color: darkslategray"
                  :style="x?.printed ? 'color: green' : ''"
                  icon="print"
                  v-if="x.impresora"
                  >&nbsp;&nbsp;</MDBIcon
                >{{ x.nombre }}</span
              >

              <tr
                v-for="(z, y) in x.arraySuplementos"
                class="suplements nameSubItem"
              >
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
            <!-- <td>
              &nbsp;<MDBIcon
                style="font-size: 4vmin"
                @click="removeProduct(x, i)"
                icon="trash-alt"
              />
            </td> -->
          </tr>
        </tbody>
      </MDBTable>
    </div>
    <hr />
    <div style="position: fixed; bottom: 0">
      <span
        style="
          font-size: 3vh;
          bottom: 13.5vh;
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
        @click="cobrar('EFECTIVO')"
        >Cobrar con efectivo&nbsp;&nbsp; <MDBIcon icon="euro-sign"></MDBIcon>
      </MDBBtn>

      <MDBBtn
        outline="primary"
        style="width: 95%; margin-bottom: 5%"
        @click="cobrar('DATAFONO_3G')"
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
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";
import Swal from "sweetalert2";
import axios from "axios";
export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBTable,
    MDBListGroup,
    MDBListGroupItem,
    MDBBtn,
    MDBModal,
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
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
    const openEditProductModal = ref(false);
    const EditProductModalInfo = ref(-1);
    const actProd = ref(null);
    const selectOtherEmployer = () => {
      router.push("/employer");
    };

    const addProduct = async (x, i) => {
      await axios.post("teclado/clickTeclaArticulo", {
        idArticulo: x.idArticulo,
        gramos: x.gramos ?? 0,
        idCesta: selectedTable.value._id,
        unidades: 1,
        arraySuplementos: x.arraySuplementos ?? null,
        nombre: x.nombre,
        menu: "",
      });
      return true;
    };

    const restProduct = async (x, i) => {
      let z = selectedTable.value.lista.filter(
        (products) =>
          products.idArticulo == x.idArticulo &&
          JSON.stringify(products.arraySuplementos) ==
            JSON.stringify(x.arraySuplementos)
      );
      if (z.length > 0) {
        if (z[0].unidades > 1) {
          await axios.post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticulo,
            gramos: x.gramos ?? 0,
            idCesta: selectedTable.value._id,
            unidades: -1,
            arraySuplementos: x.arraySuplementos ?? null,
            nombre: x.nombre,
            menu: "",
          });
        }
      }
    };

    const changeClients = async () => {
      let res = await axios
        .post("/cestas/setClients", {
          clients: 0,
          cesta: selectedTable.value._id,
        })
        .then((res) => {
          setTimeout(() => {
            router.push("/clientsInTableSelection");
          }, 10);
        });
    };

    const removeProduct = async (x, i) => {
      actProd.value = null;
      let z = selectedTable.value.lista.filter(
        (products) =>
          products.idArticulo == x.idArticulo &&
          JSON.stringify(products.arraySuplementos) ==
            JSON.stringify(x.arraySuplementos)
      );
      await store.dispatch(
        "Tables/removeProduct",
        selectedTable.value.lista.indexOf(z[0])
      );
      return x;
    };

    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const getTotal = () => {
      return (
        selectedTable.value.detalleIva.importe1 +
        selectedTable.value.detalleIva.importe2 +
        selectedTable.value.detalleIva.importe3 +
        selectedTable.value.detalleIva.importe4 +
        selectedTable.value.detalleIva.importe5
      );
    };

    const selectProduct = async (x) => {
      if (actProd.value == x) {
        selectedTable.value.lista[x].id = x;
        EditProductModalInfo.value = x;
        openEditProductModal.value = true;
      }

      actProd.value = x;
    };

    const removeSuplement = async (sup) => {
      openEditProductModal.value = false;
      let x = selectedTable.value.lista[EditProductModalInfo.value];

      removeProduct(selectedTable.value.lista[EditProductModalInfo.value]);
      x.arraySuplementos.splice(sup, 1);
      if (x.arraySuplementos.length <= 0) x.arraySuplementos = null;
      setTimeout(async () => {
        await axios
          .post("teclado/clickTeclaArticulo", {
            idArticulo: x.idArticulo,
            gramos: x.gramos ?? 0,
            idCesta: selectedTable.value._id,
            unidades: 1,
            arraySuplementos: x.arraySuplementos ?? null,
            nombre: x.nombre,
            menu: "",
          })
          .then((x) => {
            if (x.data.error) throw Error(x.data.error);
            setTimeout(() => {
              EditProductModalInfo.value = selectedTable.value.lista.length - 1;
              openEditProductModal.value = true;
            }, 10);
          });
      }, 100);

      //EditProductModalInfo.value = selectedTable.value.lista.length - 1;
    };

    async function cobrar(fm) {
      try {
        const resultado = await axios.post("tickets/crearTicket", {
          total: getTotal(),
          idCesta: selectedTable.value._id,
          idTrabajador: SelectEmployer.value._id,
          tipo: fm,
          tkrsData: {
            cantidadTkrs: 0,
            formaPago: "EFECTIVO",
          },
        });

        if (!resultado.data) {
          throw Error("No se ha podido crear el ticket");
        } else {
          const res = await axios
            .post("/cestas/setClients", {
              clients: 0,
              cesta: selectedTable.value._id,
            })
            .then((res) => {
              console.log(res);
              if (res) router.push("/categoryselection");
            });
          Swal.fire({
            icon: "success",
            title: "Venta registrada correctamente",
            showConfirmButton: false,
            timer: 1000,
          });
          router.push("/tableselection");
        }
      } catch (err) {
        Swal.fire("Oops...", err.message, "error");
      }
    }

    const sendToPrepare = async () => {
      let ticketsWithPrinter = [];
      for (let i = 0; i < selectedTable.value.lista.length; i++) {
        if (
          selectedTable.value.lista[i].impresora &&
          !selectedTable.value.lista[i].printed
        ) {
          ticketsWithPrinter.push(selectedTable.value.lista[i]);
          await store.dispatch(
            "Tables/setProductPrinted",
            selectedTable.value.lista[i]
          );
          selectedTable.value.lista[i].printed = true;
        }
      }
      console.log(ticketsWithPrinter);
      const res = await axios.post("impresora/imprimirTicketComandero", {
        products: ticketsWithPrinter,
        table: selectedTable.value.indexMesa + 1,
        worker: SelectEmployer.value.nombre,
        clients: selectedTable.value.comensales,
      });
      if (res.data)
        Swal.fire({
          icon: "success",
          title: "Se ha enviado el ticket a imprimir",
          showConfirmButton: false,
          timer: 1000,
        });
    };

    onMounted(() => {
      if (tables.value.length == 0) {
        router.push("/");
      }
    });

    return {
      selectedTable,
      actualPage,
      selectOtherEmployer,
      cobrar,
      router,
      hideInfo,
      sendToPrepare,
      selectProduct,
      openEditProductModal,
      selectOtherTable,
      removeProduct,
      tables,
      removeSuplement,
      changeClients,
      SelectEmployer,
      actProd,
      restProduct,
      addProduct,
      EditProductModalInfo,
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

.suplements {
  color: gray;
}

.divUnidadesModal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.divBotonesModal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10%;
  width: 50%;
}

.listDiv {
  overflow: scroll;
  max-height: 55vh;
  overflow-x: hidden;
  margin-left: -1.4rem;
}
.nameItem {
  overflow: hidden;
  white-space: nowrap;
  width: 24vh;
  display: block;
  text-overflow: ellipsis;
}
.nameSubItem {
  overflow: hidden;
  white-space: nowrap;
  width: 6rem;
  display: block;
  text-overflow: ellipsis;
}

.employer {
  background-color: #ffffff69;
  padding: 5%;
}
</style>
