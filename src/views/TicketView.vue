<template>
  <div>
    <MDBListGroup class="employerList">
      <MDBListGroupItem @click="selectOtherTable" class="employer"
        ><MDBIcon icon="shopping-basket" />&nbsp;&nbsp; Mesa
        {{ selectedTable.indexMesa + 1 }}
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
    const actProd = ref(null);
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
      if (actProd.value == x)
        if (await deleteProduct(selectedTable.value.lista[x].nombre)) {
          actProd.value = -1;
          return removeProduct(selectedTable.value.lista[x], x);
        }
      actProd.value = x;
      console.log(x);
    };

    function deleteProduct(x) {
      return Swal.fire({
        title: "¿Desea eliminar '" + x + "' de la lista? ",
        html: `El producto seleccionado será eliminado de la cesta.`,
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "red",
        cancelButtonColor: "green",
        iconColor: "red",
        icon: "warning",
        backdrop: "rgba(255,0,0,0.4)",
      }).then((result) => {
        return result.isConfirmed;
      });
    }

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
      let ticketsWithPrinter = selectedTable.value.lista.filter(
        (x) => x.impresora
      );
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
      console.log(selectedTable.value);
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
      selectOtherTable,
      removeProduct,
      tables,
      SelectEmployer,
      actProd,
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
.nameSubItem {
  overflow: hidden;
  white-space: nowrap;
  width: 6rem;
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
