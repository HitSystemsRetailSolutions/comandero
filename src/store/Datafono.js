let Diccionario = {
  waitingForCard: "Esperando tarjeta del cliente...",
  cardInserted: "Tarjeta insertada, espere por favor...",
  enterPIN: "El cliente debe ingresar su PIN...",
  cardRemoved: "Retire la tarjeta del cliente...",
  amountConfirmation: "El cliente debe confirmar el monto...",
  finished: "Transacción procesada con éxito...",
  errorConexion: "Error de conexión, recuperando resultado...",
};

export default {
  namespaced: true,
  state: {
    estado: "",
    procesoActual: "sin pagos pendientes...",
  },
  mutations: {
    setEstadoMutation(state, payload) {
      state.estado = payload;
    },
    setProcesoMutation(state, payload) {
      if (Diccionario[payload] == undefined || payload == "processing") {
        state.procesoActual = "Procesando pago, espere por favor...";
      } else {
        state.procesoActual = Diccionario[payload];
      }
    },
  },
  actions: {
    setEstado({ commit }, payload) {
      if (
        payload == "APROBADA" ||
        payload == "DENEGADA" ||
        payload == "PERDIDA"
      ) {
        setTimeout(() => {
          commit("setEstadoMutation", "ONLINE");
        }, 2000);
      }
      commit("setEstadoMutation", payload);
    },
    setProceso({ commit }, payload) {
      commit("setProcesoMutation", payload);
    },
  },
};
