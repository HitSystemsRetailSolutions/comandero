<template>
  <div class="row mt-1">
    <h1 class="titulo text-center" style="font-weight: bold">
      ¡No se han encontrado datos en este TPV!
    </h1>
  </div>

  <label class="subtitulo">
    Hemos intentado cargar los datos de este TPV, pero no ha sido posible.
    <p style="font-size: 1.7rem">
      Si cree que ha sido un error, puede reintentarlo pulsando el botón:
    </p></label
  >
  <div class="botonesDiv">
    <MDBBtn @click="irAVentas()" class="botones" color="warning">
      {{ $t("reintentar", "Reintentar") }}</MDBBtn
    >

    <!--<MDBBtn
      @click="contrasenyaAdmin = true"
      class="botones"
      color="danger"
    >
      {{ $t("instalador", "Instalador") }}</MDBBtn
    >-->
  </div>
  <MDBIcon
    class="QRbtn"
    @click="
      QRmodal = true;
      startQR();
    "
    icon="qrcode"
  ></MDBIcon>
  <MDBIcon
    class="ajustesBtn"
    @click="contrasenyaAdmin = true"
    icon="tools"
  ></MDBIcon>
  <MDBModal
    id="QRmodal"
    tabindex="-1"
    labelledby="QRmodal"
    v-model="QRmodal"
    :staticBackdrop="true"
    size="xl"
  >
    <MDBModalHeader>
      <MDBModalTitle>
        {{ $t("insalador_qr", "Instalador por QR") }}
      </MDBModalTitle>
    </MDBModalHeader>
    <MDBModalBody>
      <MDBStepper ref="btnStepper" disableStepperHeadClick="true">
        <MDBStepperStep active>
          <MDBStepperHead icon="1"
            >Leer QR &nbsp;&nbsp; <MDBIcon icon="qrcode" />
          </MDBStepperHead>
        </MDBStepperStep>
        <MDBStepperStep>
          <MDBStepperHead icon="2"
            >Seleccionar tienda&nbsp;&nbsp; <MDBIcon icon="hand-pointer"
          /></MDBStepperHead>
        </MDBStepperStep>
        <MDBStepperStep>
          <MDBStepperHead icon="3"
            >Confirmar&nbsp;&nbsp; <MDBIcon icon="check-double"
          /></MDBStepperHead>
        </MDBStepperStep>
        <MDBStepperStep>
          <MDBStepperHead icon="4"
            >Instalar&nbsp;&nbsp; <MDBIcon icon="download"
          /></MDBStepperHead>
        </MDBStepperStep>
        <MDBStepperStep>
          <MDBStepperHead icon="5"
            >Finalizar&nbsp;&nbsp; <MDBIcon icon="flag"
          /></MDBStepperHead>
        </MDBStepperStep>
      </MDBStepper>
      <div style="text-align: center; margin-top: 5%">
        <qrcode-vue
          background="rgb(0 0 0 / 0%)"
          v-if="QRstatus[0] === 0"
          :value="QRinfo"
          size="300"
          level="H"
        />
      </div>
      <div v-if="QRstatus[0] === 1" class="QRloadingDiv">
        <img
          src="img/loadingNew.gif"
          style="display: block; margin: auto; width: 350px"
          alt="Esperando respuesta del servidor"
        />
        <span class="telegramTxt">Configure el TPV mediante telegram.</span>
      </div>
      <div v-if="QRstatus[0] === 2" class="QRloadingDiv">
        <h1 class="titulo text-center" style="font-weight: bold">
          ¿Esta seguro que desea instalar la siguiente licencia?
        </h1>
        <span class="passLicTitle">{{ QRstatus[2] }}</span>
        <div class="passLic">
          <span
            >Este cambio es irreversible y todos los datos serán
            eliminados.</span
          >
        </div>
        <MDBModalFooter style="justify-content: space-between"
          ><MDBBtn
            color="danger"
            size="lg"
            @click="
              btnStepper?.changeStep(0);
              startQR();
            "
            >Rechazar</MDBBtn
          >
          <MDBBtn
            color="success"
            size="lg"
            @click="
              loadingBar = 10;
              btnStepper?.changeStep(4);
              QRstatus[0] = 3;
              installQR();
            "
            >Aceptar</MDBBtn
          ></MDBModalFooter
        >
      </div>
      <div v-if="QRstatus[0] === 3" class="QRloadingDiv">
        <div class="row">
          <img
            src="img/loadingNew.gif"
            style="display: block; margin: auto; width: 300px"
            alt="Esperando respuesta del servidor"
          />
          <div class="passLic">
            <span
              >Estamos instalando este equipo, por favor, mantengase a la
              espera.</span
            >
          </div>
        </div>
        <div>
          <span class="animate-flicker">{{
            `${QRinstallerStatus[QRinstallerStatusI]} [${
              QRinstallerStatusI + 1
            }/${
              QRinstallerStatus.length
            }]    |    ${QRseconds} segundos transcurridos...`
          }}</span>
          <MDBProgress :height="20">
            <MDBProgressBar :value="loadingBar">
              {{ loadingBar }}%
            </MDBProgressBar>
          </MDBProgress>
        </div>
      </div>

      <div v-if="QRstatus[0] === 4" class="QRloadingDiv">
        <MDBIcon
          style="zoom: 6; color: red"
          v-if="QRinstallerStatusI == -1"
          fas
          icon="times"
        />
        <MDBIcon
          style="zoom: 6; color: green"
          v-if="QRinstallerStatusI == 3"
          fas
          icon="flag-checkered"
        />
        <div class="passLic">
          <span v-if="QRinstallerStatusI == -1"
            >La descarga ha fallado, reintentalo mas tarde...</span
          >
          <span v-if="QRinstallerStatusI == 3">¡Descarga completada!</span>
        </div>
        <MDBModalFooter
          ><MDBBtn
            color="danger"
            v-if="QRinstallerStatusI == -1"
            size="lg"
            @click="
              btnStepper?.changeStep(0);
              startQR();
            "
            >Reintentar</MDBBtn
          >
          <MDBBtn
            color="success"
            size="lg"
            @click="irAVentas()"
            v-if="QRinstallerStatusI == 3"
            >Abrir Terminal</MDBBtn
          ></MDBModalFooter
        >
      </div>
    </MDBModalBody>
  </MDBModal>
  <MDBModal
    id="contrasenyaAdmin"
    tabindex="-1"
    labelledby="contrasenyaAdmin"
    v-model="contrasenyaAdmin"
    size="lg"
  >
    <MDBModalHeader>
      <MDBModalTitle> Acceso al instalador manual </MDBModalTitle>
    </MDBModalHeader>
    <MDBModalBody>
      <div>
        <MDBInput
          v-model="contrasenaIntroducida"
          type="password"
          placeholder="Contraseña de administrador"
        />
      </div>
    </MDBModalBody>
    <MDBModalFooter>
      <MDBBtn
        color="danger"
        size="lg"
        @click="
          contrasenyaAdmin = false;
          contrasenaIntroducida = '';
        "
        >Salir</MDBBtn
      >
      <MDBBtn color="success" size="lg" @click="checkPassword()"
        >Acceder</MDBBtn
      >
    </MDBModalFooter>
  </MDBModal>
  <MDBModal
    id="abrirInstalador"
    tabindex="-1"
    labelledby="abrirInstalador"
    v-model="abrirInstalador"
    :staticBackdrop="true"
    size="xl"
  >
    <MDBModalHeader>
      <MDBModalTitle>
        {{ $t("instalador_de_licencia", "Instalador de licencia") }}
      </MDBModalTitle>
    </MDBModalHeader>
    <MDBModalBody>
      <div class="">
        <MDBIcon
          class="infoBtn"
          color="secondary"
          fas
          icon="info-circle"
          @click="infoTPVmodal = true"
        />
        <label class="form-label">Nº {{ $t("licencia", "licencia") }}</label>
        <MDBInput v-model="licencia" type="number" />
        <label class="form-label">{{
          $t("tipo_datafono", "Tipo datáfono")
        }}</label>
        <select v-model="tipoDatafono" class="form-select">
          <option value="3G">3G</option>
          <option value="PAYTEF">PAYTEF</option>
        </select>
      </div>
      <p style="font-size: 20px; font-weight: bold">
        {{ $t("atencion", "¡Atención!") }}
        {{ $t("si_ya_habian_datos", "si ya habían datos") }}
        {{ $t("en_este_TPV", "en este TPV") }},
        {{ $t("instalar_la_licencia", "instalar la licencia") }}
        {{ $t("eliminara_los_datos_antiguos", "eliminará los datos antiguos") }}
      </p>
    </MDBModalBody>
    <MDBModalFooter>
      <MDBBtn
        color="secondary"
        class="botonesInstalador"
        @click="confirmarXIP()"
      >
        {{ $t("descargar_xip", "Descargar por IP") }}
      </MDBBtn>
      <MDBBtn color="success" class="botonesInstalador" @click="confirmar()">
        {{ $t("confirmar", "Confirmar") }}
      </MDBBtn>
    </MDBModalFooter>
  </MDBModal>
  <MDBModal
    id="descargarTPV"
    tabindex="-1"
    labelledby="descargarTPV"
    v-model="descargarTPV"
    :staticBackdrop="true"
  >
    <MDBModalBody>
      <div class="row">
        <p style="font-size: 20px; font-weight: bold; color: green">
          {{
            $t("espera_mientras_se_descargan", "Espera mientras descargamos")
          }}
          {{ $t("los_datos_TPV", "los datos del TPV") }}
        </p>
      </div>
      <div class="row">
        <img
          src="img/loadingNew.gif"
          style="display: block; margin: auto; width: 300px"
          alt="Esperando respuesta del servidor"
        />
      </div>
      <MDBProgress :height="20">
        <MDBProgressBar :value="loadingBar"> {{ loadingBar }}% </MDBProgressBar>
      </MDBProgress>
    </MDBModalBody>
  </MDBModal>

  <MDBModal
    id="infoTPVmodal"
    tabindex="-1"
    labelledby="infoTPVmodal"
    v-model="infoTPVmodal"
  >
    <MDBModalHeader>
      <MDBModalTitle>
        {{ $t("descargando", "Descargando datos") }}
      </MDBModalTitle>
    </MDBModalHeader>
    <MDBModalBody>
      <h5><MDBIcon icon="wifi" />&nbsp;Estado de conexión</h5>
      <p :style="haveInternet === true ? 'color:green;' : 'color:red;'">
        <MDBIcon icon="angle-right" />&nbsp;{{
          haveInternet === true ? "En línea" : "Sin conexión"
        }}
      </p>
      <hr />
      <h5><MDBIcon icon="ethernet" />&nbsp;IP del TPV</h5>
      <p><MDBIcon icon="angle-right" />&nbsp;{{ IP }}</p>
      <hr />
      <h5><MDBIcon icon="shopping-basket" />&nbsp;Tienda asignada</h5>
      <p><MDBIcon icon="angle-right" />&nbsp;{{ assignatedShop }}</p>
    </MDBModalBody>
  </MDBModal>
</template>

<script>
import { ref } from "vue";
import axios from "axios";
import router from "../router/index";
import Swal from "sweetalert2";
import {
  MDBModal,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBCard,
  MDBProgress,
  MDBDropdownToggle,
  MDBDropdownItem,
  MDBDropdownMenu,
  MDBCardBody,
  MDBCardText,
  MDBIcon,
  MDBInput,
  MDBContainer,
  MDBProgressBar,
  MDBBtn,
  MDBDropdown,
  MDBCol,
  MDBRow,
  MDBStepper,
  MDBStepperHead,
  MDBStepperStep,
  MDBStepperContent,
} from "mdb-vue-ui-kit";
import { tocGame } from "../services/tocGame";
import md5 from "md5";
export default {
  name: "InstallWizard",
  components: {
    MDBCard,
    MDBCardBody,
    MDBCardText,
    MDBIcon,
    MDBInput,
    MDBModal,
    MDBModalHeader,
    MDBRow,
    MDBModalTitle,
    MDBDropdown,
    MDBContainer,
    MDBCol,
    MDBModalBody,
    MDBModalFooter,
    MDBBtn,
    MDBProgressBar,
    MDBDropdownToggle,
    MDBDropdownItem,
    MDBDropdownMenu,
    MDBProgress,
    MDBStepper,
    MDBStepperHead,
    MDBStepperStep,
    MDBStepperContent,
  },
  setup() {
    const licencia = ref("");
    const password = ref("");
    const tipoImpresora = ref("USB");
    const abrirInstalador = ref(false);
    const tipoDatafono = ref("CLEARONE");
    const impresoraCafeteria = ref("NO");
    const infoTPVmodal = ref(false);
    const esperando = ref(false);
    const modalInstalador = ref(false);
    const contrasenaIntroducida = ref("");
    const primeraParte = ref(true);
    const segundaParte = ref(false);
    const descargarTPV = ref(false);
    const loadingBar = ref(0);
    const contrasenyaAdmin = ref(false);
    const IP = ref("No detectado");
    const haveInternet = ref(false);
    const assignatedShop = ref("No detectado");
    const ipInSystem = ref(false);
    const QRinfo = ref("");
    const QRstatus = ref([0, -1, ""]);
    const QRseconds = ref(0);
    const QRinstallerStatus = [
      "Conectando con el servidor...",
      "Solicitando datos para el TPV...",
      "Instalando datos del TPV...",
      "Instalación finalizada!",
    ];
    const QRinstallerStatusI = ref(0);
    const OpenSettings = ref(false);
    const QRmodal = ref(false);
    const btnStepper = ref(null);
    function testPrint() {}

    async function confirmar() {
      esperando.value = true;

      const enviarParametros = {
        parametros: {
          licencia: Number(licencia.value),
          password: password.value,
          tipoDatafono: tipoDatafono.value,
        },
      };
      descargarTPV.value = true;
      abrirInstalador.value = false;
      loadingBar.value = 30;
      try {
        const res = await axios.post("/instalador/pedirDatos", {
          password: enviarParametros.parametros.password,
          numLlicencia: enviarParametros.parametros.licencia,
          tipoDatafono: enviarParametros.parametros.tipoDatafono,
        });
        loadingBar.value = 75;

        if (res.data) {
          const res2 = await axios.post("instalador/descargarTodo");
          loadingBar.value = 100;
          if (res2.data) {
            router.push("/");
            descargarTPV.value = false;
          } else {
            descargarTPV.value = false;
            throw Error("Error en instalador/descargarTodo");
          }
        } else {
          throw Error("Los datos introducidos no son correctos");
        }
      } catch (err) {
        descargarTPV.value = false;
        abrirInstalador.value = true;
        Swal.fire("Oops...", err.message, "error");
      }
      loadingBar.value = 0;
    }

    async function installQR() {
      await InstallCounter();
      QRinstallerStatusI.value = 0;
      QRinstallerStatusI.value += 1;
      const enviarParametros = {
        parametros: {
          licencia: QRstatus.value[1],
          tipoDatafono: "3G",
        },
      };

      try {
        loadingBar.value = 10;
        axios
          .post("/instalador/setData", {
            cn: QRinfo.value,
            bssnes: QRstatus.value[3],
            cd: enviarParametros.parametros.licencia,
          })
          .catch((err) => {
            console.error("Error en instalador/setData");
          });
        loadingBar.value = 45;
        const res = await axios.post("/instalador/pedirDatosQR", {
          password: enviarParametros.parametros.password,
          numLlicencia: enviarParametros.parametros.licencia,
          tipoDatafono: enviarParametros.parametros.tipoDatafono,
        });
        loadingBar.value = 75;
        QRinstallerStatusI.value += 1;

        if (res.data) {
          const res2 = await axios.post("instalador/descargarTodo");
          loadingBar.value = 100;

          if (res2.data) {
            QRinstallerStatusI.value = 3;
          } else {
            throw Error("Error en instalador/descargarTodo");
          }
        } else {
          throw Error("Los datos introducidos no son correctos");
        }
      } catch (err) {
        QRinstallerStatusI.value = -1;
        Swal.fire("Oops...", err.message, "error");
      }
      loadingBar.value = 100;
      setTimeout(() => {
        QRstatus.value[0] = 4;
        btnStepper?.value?.changeStep(5);
      }, 1200);
    }
    let QRinterval = null;
    async function InstallCounter() {
      if (QRinterval) clearInterval(QRinterval);
      QRinterval = setInterval(() => {
        if (QRinstallerStatusI == 3 || QRinstallerStatusI == -1) {
          clearInterval(QRinterval);
          QRseconds.value = 0;
        }
        QRseconds.value += 1;
      }, 1000);
    }

    async function CheckInternet() {
      axios
        .get("https://jsonplaceholder.typicode.com/posts/1", { timeout: 5000 })
        .then(() => {
          haveInternet.value = true;
        })
        .catch(() => {
          haveInternet.value = false;
        });
    }
    CheckInternet();

    async function CheckTienda() {
      const res = await axios.post("/instalador/getIPTienda", {
        ip: IP.value,
      });
      assignatedShop.value = res.data != false ? res.data : "Sin datos";
    }

    async function checkPassword() {
      if (
        md5(contrasenaIntroducida.value) == "11c83b692216a77953e935c3d68b3719"
      ) {
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido de nuevo Hit Systems!",
          showConfirmButton: false,
          timer: 650,
        });
        abrirInstalador.value = true;
        contrasenyaAdmin.value = false;
        password.value = contrasenaIntroducida.value;
        contrasenaIntroducida.value = "";
      } else if (
        md5(contrasenaIntroducida.value) == "d22bfeac753534fbbcfe66a63cb366c4"
      ) {
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido de nuevo Técnico!",
          showConfirmButton: false,
          timer: 650,
        });
        abrirInstalador.value = true;
        contrasenyaAdmin.value = false;
        password.value = contrasenaIntroducida.value;
        contrasenaIntroducida.value = "";
      } else {
        Swal.fire(
          "¡La contraseña y/o el QR son incorrectos!",
          "Por favor, si no eres un técnico, no accedas a este menu.",
          "error"
        );
      }
    }

    async function confirmarXIP() {
      esperando.value = true;
      const enviarParametros = {
        parametros: {
          licencia: Number(licencia.value),
          password: password.value,
          tipoImpresora: tipoImpresora.value,
          tipoDatafono: tipoDatafono.value,
          impresoraCafeteria: impresoraCafeteria.value,
        },
      };

      try {
        const res = await axios.post("/instalador/pedirDatosIP", {
          ip: IP.value,
        });

        if (res.data) {
          primeraParte.value = false;
          segundaParte.value = true;
          const res2 = await axios.post("instalador/descargarTodo");
          if (res2.data) {
            const d = new Date();
            d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000);
            let expires = "expires=" + d.toUTCString();
            document.cookie =
              "datosCierre" +
              "= [" +
              res2.data[1] +
              "] ;" +
              expires +
              ";path=/";
            router.push("/");
            tocGame.cargarTrabajadoresFichados();
            esperando.value = false;
          } else {
            esperando.value = false;
            throw Error(
              "No hemos encontrado tu IP por ningun lado... [Error en instalador/descargarTodo]"
            );
          }
        } else {
          throw Error(
            "No hemos encontrado tu IP por ningun lado... [Error en instalador/pedirDatos]"
          );
        }
      } catch (err) {
        esperando.value = false;
        Swal.fire("Oops...", err.message, "error");
      }
    }

    function irAVentas() {
      router.push("/");
    }

    async function GetIPAndCN() {
      await axios.post("instalador/getCN").then((cn) => {
        QRinfo.value = cn.data.split(" ").join("[SPACE]");
      });
      axios.post("instalador/getIP").then((ip) => {
        if (ip.data != "") ipInSystem.value = true;
        IP.value = ip.data;
        CheckTienda();
      });
    }
    GetIPAndCN();

    let qrCheckerInterval = undefined;
    async function QRProcess() {
      if (
        router.currentRoute.value.fullPath.toLowerCase() != "/installwizard" ||
        !QRmodal.value ||
        QRstatus.value[0] >= 2
      ) {
        clearInterval(qrCheckerInterval);
        return;
      }
      axios
        .post("instalador/getQRstatus", { cn: QRinfo.value })
        .then((data) => {
          if (!data) return Error("No hay datos");
          let dta = JSON.parse(data.data.status);
          btnStepper?.value?.changeStep(Number(dta[0]) + 1);
          QRstatus.value = JSON.parse(data.data.status);
        });
    }

    function startQR() {
      axios
        .post("instalador/resetQRstatus", { cn: QRinfo.value })
        .then((data) => {
          btnStepper?.value?.changeStep(1);
          QRstatus.value = [0, -1, ""];
          if (qrCheckerInterval) clearInterval(qrCheckerInterval);
          if (data) qrCheckerInterval = setInterval(QRProcess, 1000);
        });
    }

    return {
      irAVentas,
      primeraParte,
      segundaParte,
      testPrint,
      confirmar,
      confirmarXIP,
      licencia,
      haveInternet,
      password,
      tipoImpresora,
      tipoDatafono,
      impresoraCafeteria,
      esperando,
      GetIPAndCN,
      abrirInstalador,
      assignatedShop,
      IP,
      ipInSystem,
      infoTPVmodal,
      modalInstalador,
      contrasenyaAdmin,
      descargarTPV,
      loadingBar,
      installQR,
      startQR,
      checkPassword,
      QRinfo,
      InstallCounter,
      contrasenaIntroducida,
      QRstatus,
      OpenSettings,
      QRinstallerStatus,
      QRinstallerStatusI,
      QRseconds,
      QRmodal,
      btnStepper,
    };
  },
};
</script>

<style scoped>
.botones {
  font-size: 40px;
}

.titulo {
  margin-top: 10% !important;
}

.infoBtn {
  zoom: 1.5;
  right: 1.3%;
  position: absolute;
  color: cadetblue;
}
.subtitulo {
  font-size: 2rem;
  text-align: center;
  display: block;
  margin-top: 10%;
}

.botonesDiv {
  align-items: center;
  display: flex;
  margin-top: 5%;
  justify-content: space-around;
  flex-direction: row;
}

.botonesInstalador {
  margin-right: 10px;
  font-size: 1.2rem;
}

.botones {
  font-size: 2rem;
}

.passLicTitle {
  font-size: 1.8rem;
}
.passLic {
  margin-top: 5%;
  margin-bottom: 5%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  font-size: 1.8rem;
  color: cadetblue;
}
.telegramTxt {
  margin-top: -20%;
  color: gray;
  font-style: italic;
}

.QRloadingDiv {
  text-align: center;
}

.ajustesBtn {
  font-size: 50px;
  position: absolute;
  top: 2%;
  left: 1%;
}

.QRbtn {
  font-size: 50px;
  position: absolute;
  top: 2%;
  right: 1%;
}

@keyframes flickerAnimation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@-o-keyframes flickerAnimation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@-moz-keyframes flickerAnimation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@-webkit-keyframes flickerAnimation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.animate-flicker {
  -webkit-animation: flickerAnimation 2s infinite;
  -moz-animation: flickerAnimation 2s infinite;
  -o-animation: flickerAnimation 2s infinite;
  animation: flickerAnimation 2s infinite;
}
</style>
