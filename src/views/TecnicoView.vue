<template>
  <div class="w-50 mx-auto buttons">
    <div v-if="esAdministrador" class="row mt-2">
      <MDBBtn
        color="success"
        size="lg"
        class="w-100"
        @click="abrirConfigurador()"
        >Configurador</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="descargarClientesFinales()"
        >{{
          $t("descargar_clientes_finales", "Descargar clientes finales")
        }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="descargarTarifasEspeciales()"
        >{{
          $t("descargar_tarifas_especiales", "Descargar tarifas especiales")
        }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="actualizarParametros()"
        >{{
          $t("actualizar_parametros_tienda", "Actualizar parámetros tienda")
        }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="actualizarTrabajadores()"
        >{{ $t("actualizar_trabajadores", "Actualizar trabajadores") }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="actualizarTeclados()"
        >{{ $t("actualizar_teclado", "Actualizar teclado") }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        @click="actualizarPromociones()"
        >Actualizar Promociones</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="primary"
        size="lg"
        class="w-100"
        v-if="modalDatafonoRef"
        @click="modalDatafonoRef.abrirModal()"
        >{{ $t("configurar_datafono", "Configurar datafono") }}</MDBBtn
      >
    </div>
    <div v-if="esAdministrador" class="row mt-2">
      <MDBBtn
        color="success"
        size="lg"
        class="w-100"
        @click="cambiarPrecio()"
        >{{ $t("editar_productos", "Editar productos") }}</MDBBtn
      >
    </div>
    <div v-if="esAdministrador" class="row mt-2">
      <MDBBtn
        color="success"
        size="lg"
        class="w-100"
        @click="router.push('/installWizard')"
        >{{ $t("menu_instalador", "Abrir instalador") }}</MDBBtn
      >
    </div>
    <div v-if="esAdministrador" class="row mt-2">
      <MDBBtn
        color="success"
        size="lg"
        class="w-100"
        @click="ListadoDeVentas()"
        >{{ $t("listado_de_ventas", "Listado de ventas") }}</MDBBtn
      >
    </div>
    <!-- porfa funciona -->
    <div v-if="esAdministrador" class="row mt-2">
      <MDBBtn
        color="success"
        size="lg"
        class="w-100"
        @click="verModalInformes()"
        >{{ $t("informes", "Informes") }}</MDBBtn
      >
    </div>
    <div class="row mt-2">
      <MDBBtn
        color="danger"
        size="lg"
        class="w-100"
        @click="ContraseñaAdministrador()"
        >Modo administrador</MDBBtn
      >
    </div>
  </div>
  <VolverComponent />
</template>

<script>
import VolverComponent from "../components/Volver.vue";
import { MDBBtn } from "mdb-vue-ui-kit";
import Swal from "sweetalert2";
import axios from "axios";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { ref } from "vue";
import md5 from "md5";
export default {
  name: "TecnicoView",
  components: {
    VolverComponent,
  },
  setup() {
    const ModalListadoVentasRef = ref(null);
    const modalConfiguradorRef = ref(null);
    const modalInformesRef = ref(null);
    const router = useRouter();
    const store = useStore();
    const esAdministrador = ref(false);
    const modalDatafonoRef = ref(null);

    function abrirConfigurador() {
      if (modalConfiguradorRef.value) modalConfiguradorRef.value.abrirModal();
    }

    function descargarClientesFinales() {
      axios
        .post("clientes/descargarClientesFinales")
        .then((res) => {
          if (res.data) {
            Swal.fire(
              "OK",
              "Clientes finales actualizados correctamente",
              "success"
            );
          } else {
            throw Error("No se han podido descargar los clientes finales");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    function verModalInformes() {
      modalInformesRef.value.abrirModal();
    }

    function descargarTarifasEspeciales() {
      axios
        .get("tarifas/descargarTarifas")
        .then((res) => {
          if (res.data) {
            Swal.fire(
              "OK",
              "Tarifas especiales descargadas correctamente",
              "success"
            );
          } else {
            throw Error("No se han podido descargar las tarifas especiales");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    function actualizarTrabajadores() {
      axios
        .get("trabajadores/actualizarTrabajadores")
        .then((res) => {
          if (res.data) {
            Swal.fire(
              "OK",
              "Trabajadores actualizado correctamente",
              "success"
            );
            document.location.href = `http://${window.location.hostname}:${window.location.port}`;
          } else {
            throw Error("No se ha podido actualizar los trabajadores");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    /* Eze 4.0 */
    function actualizarTeclados() {
      axios
        .post("teclado/actualizarTeclado")
        .then((res) => {
          if (res.data) {
            Swal.fire("OK", "Teclado actualizado correctamente", "success");
            document.location.href = `http://${window.location.hostname}:${window.location.port}`;
          } else {
            throw Error("No se ha podido actualizar el teclado");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    function actualizarPromociones() {
      axios
        .get("promociones/descargarPromociones")
        .then((res) => {
          if (res.data) {
            Swal.fire(
              "OK",
              "Teclado y promociones actualizado correctamente",
              "success"
            );
            document.location.href = `http://${window.location.hostname}:${window.location.port}`;
          } else {
            throw Error("No se han podido actualizar las promociones");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    async function cambiarPrecio() {
      store.dispatch("setModoActual", "MODIFICAR_ARTICULO");
      router.push("/main");
    }

    async function ListadoDeVentas() {
      ModalListadoVentasRef.value.abrirModal();
    }

    function actualizarParametros() {
      axios
        .get("parametros/actualizarParametros")
        .then((res) => {
          if (res.data) {
            Swal.fire("OK", "Parámetros actualizados correctamente", "success");
            document.location.href = `http://${window.location.hostname}:${window.location.port}`;
          } else {
            throw Error("No se han podido actualizar los parámetros");
          }
        })
        .catch((err) => {
          Swal.fire("Oops...", err.message, "error");
        });
    }

    return {
      abrirConfigurador,
      descargarClientesFinales,
      descargarTarifasEspeciales,
      actualizarTrabajadores,
      actualizarTeclados,
      cambiarPrecio,
      actualizarParametros,
      modalDatafonoRef,
      ModalListadoVentasRef,
      router,
      ListadoDeVentas,
      esAdministrador,
      actualizarPromociones,
      modalConfiguradorRef,
      modalInformesRef,
      verModalInformes,
    };
  },
  methods: {
    ContraseñaAdministrador() {
      const contra = prompt("Introduce la contraseña de administrador");

      if (contra && md5(contra) == "bebceff7cb66cf7232478306cba94d8e") {
        Swal.fire(
          "¡Contraseña correcta!",
          "Ahora eres administrador",
          "success"
        );
        return (this.esAdministrador = true);
      } else {
        Swal.fire("Oops...", "Contraseña incorrecta", "error");
        return (this.esAdministrador = false);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.buttons {
  height: 100vh;
  overflow-x: visible;
  overflow-y: scroll;
  width: 60% !important;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons::-webkit-scrollbar {
  display: none;
}

.buttons > * {
  width: 80% !important;
}
</style>
