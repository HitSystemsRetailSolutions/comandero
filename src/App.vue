<template>
  <div class="">
    <router-view />
  </div>
</template>

<script>
// import HelloWorld from "./components/HelloWorld.vue";
import { onUnmounted } from "vue";
import { socket } from "./services/sockets";
import Swal from "sweetalert2";
export default {
  name: "App",
  components: {
    // HelloWorld,
  },
  setup() {
    const avisarEfectivo = cobro => {
      if (cobro?.estado !== "CANCELADO" || !cobro.automatico || !(cobro.efectivoADevolver > 0)) return;
      Swal.fire({ icon: "warning", title: "Ticket anulado automáticamente",
        text: (cobro.idTicket || cobro.idPago) + " · " + "Revisa y completa la devolución del efectivo pendiente:" + " " + Number(cobro.efectivoADevolver).toFixed(2) + " €" });
    };
    socket.on("cobro:resuelto", avisarEfectivo);
    onUnmounted(() => socket.off("cobro:resuelto", avisarEfectivo));
    return {};
  },
};
</script>

<style>
#app {
  font-family: Roboto, Helvetica, Arial, sans-serif;
}
body {
  background-color: #f8f9fa;
}
</style>
