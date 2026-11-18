import { io } from "socket.io-client";
import axios from "axios";
import store from "../store/index";
import router from "../router/index";
import Swal from "sweetalert2";
import { data } from "autoprefixer";
const socket = io("http://" + store.state.TocGameURL + ":5051");

/* 
socket.on("cargarConfiguracion", (parametros) => {
  try {
    if (parametros) {
      store.dispatch("Configuracion/setParametros", parametros);
    } else {
      //throw Error("Error, parametros no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});
*/
/* Uri */
socket.on("cargarTrabajadores", (arrayTrabajadores) => {
  try {
    if (arrayTrabajadores) {
      store.dispatch("Employers/setArrayEmployersMutation", arrayTrabajadores);
    } else {
      throw Error("Error, arrayTrabajadores no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});

/* Uri */
socket.on("cargarCestas", (arrayCestas) => {
  try {
    if (arrayCestas) {
      store.dispatch("Tables/arrayTablesMutation", arrayCestas);
    } else {
      throw Error("Error, arrayCestas no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});

/* Uri 
socket.on("cargarVentas", (arrayTickets) => {
  try {
    if (arrayTickets) {
      store.dispatch("Caja/setArrayVentas", arrayTickets);
    } else {
      throw Error("Error, arrayTickets no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});
*/
/* Uri */
socket.on("cargarTeclado", (teclado) => {
  try {
    if (teclado) {
      store.dispatch("Categories/setArrayCategoriesMutation", teclado);
    } else {
      throw Error("Error, teclado no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});

socket.on("connect", () => {
  socket.emit("cargarNotas");
});

socket.on("disconnect", () => {
  socket.sendBuffer = [];
  store.dispatch("Datafono/setOperacion", null);
});

socket.on("test", (data) => {
  data;
});

socket.on("resDatafono", (data) => {
  data;
});

socket.on("resConsultaPuntos", (data) => {
  if (data.error == false) {
    Swal.fire({
      icon: "info",
      text: `Puntos del cliente: ${data.info}`,
    });
  } else {
    Swal.fire("Oops...", data.mensaje, "error");
  }
});

function recibirResultadoDatafono(data) {
  if (data?.RespTransaccionDatafonoInt) {
    store.dispatch("Datafono/setEstado", data.aprobada ? "APROBADA" : "DENEGADA");
    return;
  }
  if (data.valid) {
    store.dispatch("Datafono/setEstado", "APROBADA");
  } else if (!data?.lost) {
    store.dispatch("Datafono/setEstado", "DENEGADA");
  } else {
    store.dispatch("Datafono/setEstado", "PERDIDA");
  }
}
socket.on("consultaDatafonoInt", recibirResultadoDatafono);
socket.on("consultaPaytef", recibirResultadoDatafono);

function recibirProcesoDatafono(data) {
  if (data) {
    store.dispatch("Datafono/setProceso", data.proceso);
  } else {
    store.dispatch("Datafono/setProceso", "");
  }
}
socket.on("procesoDatafonoInt", recibirProcesoDatafono);
socket.on("procesoPaytef", recibirProcesoDatafono);
socket.on("errorConexionDatafonoInt", () => {
  store.dispatch("Datafono/setEstado", "PERDIDA");
  store.dispatch("Datafono/setProceso", "resultadoIncierto");
});

socket.on("consultaPaytefRefund", (data) => {
  if (data.ok) {
    Swal.fire("OK", "Devolución aceptada", "success");
  }
});
socket.on("consultaDatafonoIntRefund", (data) => {
  if (data?.RespTransaccionDatafonoInt || typeof data?.ok === "boolean") {
    store.dispatch("Datafono/setEstado", data.aprobada || data.ok ? "APROBADA" : "DENEGADA");
  }
});

// socket.on("nuevoTrabajadorActivo", (data) => {
//   if (data.id) {
//     store.dispatch("Trabajadores/setNuevoActivo", data.id);
//   }
// });

socket.on("resDatafono", (data) => {
  store.dispatch("setEsperandoDatafono", false);
  if (data.error == false) {
    store.dispatch("Cestas/setIdAction", -1);
    store.dispatch("setModoActual", "NORMAL");
    store.dispatch("Clientes/resetClienteActivo");
    store.dispatch("Footer/resetMenuActivo");
    router.push({
      name: "Home",
      params: { tipoToast: "success", mensajeToast: "Ticket creado" },
    });
  } else {
    Swal.fire("Oops...", data.mensaje, "error");
  }
});

socket.on("nuevoTrabajadorActivo", (data) => {
  if (data.id) {
    store.dispatch("Employers/setNewActive", data.id);
  }
});


socket.on("cargarNotas", (notas) => {
  try {
    if (notas) {
      store.dispatch("Notas/setNotas", notas);
    } else {
      throw Error("Error, notas no es correcto");
    }
  } catch (err) {
    Swal.fire("Oops...", err.message, "error");
  }
});


// socket.on("ponerImagen", async (data) => {
//   const image = document.createElement("img");
//   image.src = require("./imagen");
//   image.setAttribute(
//     "style",
//     "position: absolute; top: 0px; left: 0px; width: 20vmin;z-index: 2000;"
//   );
//   document.body.appendChild(image);
// });

function emitSocket(canal, datos = null) {
  if (socket.connected) {
    socket.emit(canal, datos);
  }
}

export { socket, emitSocket };

// Solo consulta disponibilidad: nunca inicia ni repite un cargo.
export async function comprobarDisponibilidadDatafono() {
  try {
    const { data } = await axios.post("datafonoInt/comprobarDisponibilidad", null, {
      headers: { "Content-Type": "application/json" }, timeout: 7000,
    });
    if (data === "ONLINE") return;
  } catch { /* Un fallo de comunicación tampoco acredita disponibilidad. */ }
  throw new Error("No se puede conectar con el datáfono. Comprueba que esté encendido y tenga conexión antes de volver a intentarlo.");
}


// Una salida sin conexión conserva la petición; nunca supone que el banco cobró.
const claveCancelacionesCobro = "toc:cancelacionesCobro";
let recuperandoCancelacionesCobro = false;
export function guardarCancelacionCobro(peticion) {
  const cola = JSON.parse(localStorage.getItem(claveCancelacionesCobro) || "[]");
  const clave = p => p.idPago || String(p.idTicket);
  if (peticion.accion === "DESVINCULAR" && cola.some(p => clave(p) === clave(peticion) && p.accion !== "DESVINCULAR")) return;
  localStorage.setItem(claveCancelacionesCobro, JSON.stringify([
    ...cola.filter(p => clave(p) !== clave(peticion)), peticion,
  ]));
}
export async function guardarSalidaCobro(peticion) {
  guardarCancelacionCobro({ ...peticion, accion: "DESVINCULAR" });
  const respuestas = await recuperarCancelacionesCobro();
  return respuestas?.get(peticion.idPago || String(peticion.idTicket)) || null;
}
export async function recuperarCancelacionesCobro() {
  if (recuperandoCancelacionesCobro) return;
  recuperandoCancelacionesCobro = true;
  const respuestas = new Map();
  try {
    const cola = JSON.parse(localStorage.getItem(claveCancelacionesCobro) || "[]");
    for (const peticion of cola) {
      try {
        const { data } = await axios.post(peticion.idPago ? "tickets/pagoMixto" : "tickets/gestionarCobro", { ...peticion, accion: peticion.accion || "CANCELAR" }, { timeout: peticion.accion === "DESVINCULAR" ? 5000 : 20000 });
        respuestas.set(peticion.idPago || String(peticion.idTicket), data);
        if (data?.devolucionNoRealizada || peticion.accion === "DESVINCULAR" && data?.ok || data?.cancelacionSolicitada || ["CANCELADO", "ARCHIVADO_CIERRE", "CAJA_CERRADA", "ANULADO", "NO_ENCONTRADO"].includes(data?.estado)) {
          const actual = JSON.parse(localStorage.getItem(claveCancelacionesCobro) || "[]");
          localStorage.setItem(claveCancelacionesCobro, JSON.stringify(actual.filter(p => (p.idPago || String(p.idTicket)) !== (peticion.idPago || String(peticion.idTicket)))));
          if (peticion.claveLocal) {
            const guardado = JSON.parse(localStorage.getItem(peticion.claveLocal) || "null");
            if (guardado?.idPago === peticion.idPago && (guardado.cancelacionSolicitada || peticion.accion === "DESVINCULAR")) localStorage.removeItem(peticion.claveLocal);
          }
        }
      } catch { /* Se volverá a intentar al recuperar la conexión. */ }
    }
  } catch { /* Una entrada local dañada no interrumpe el inicio del TPV. */ }
  finally { recuperandoCancelacionesCobro = false; }
  return respuestas;
}
setInterval(recuperarCancelacionesCobro, 30000);

export function estadoSalidaCobro(data) {
  if (data?.estado === "CANCELADO" && data.anuladaAlSalir) return { mensaje: "La tarjeta no se ha cobrado y el ticket ha quedado anulado." +
    (data.efectivoADevolver > 0 ? " " + "Devuelve este efectivo al cliente:" + " " + Number(data.efectivoADevolver).toFixed(2) + " €" : ""), registrado: true, pagado: false };
  if (["NO_ENCONTRADO", "ANULADO", "CANCELADO", "CERRADO", "CAJA_CERRADA", "ARCHIVADO_CIERRE"].includes(data?.estado)) return { mensaje: "", registrado: false, pagado: false };
  if (data?.ok !== true) return { mensaje: "No se ha podido verificar el estado de la venta. La salida queda guardada. Revisa Tickets antes de repetir el cobro.", registrado: false, pagado: false };
  if (data.devolucionEnCurso || data.estado === "DEVOLUCION_EN_CURSO") return { mensaje: "La devolución de tarjeta sigue sin confirmar. Se comprobará automáticamente mientras la caja permanezca abierta.", registrado: true, pagado: false };
  if (["COBRADO", "FINALIZADO", "EFECTIVO"].includes(data.estado) && !data.cancelacionSolicitada) return { mensaje: "", registrado: true, pagado: true };
  if (["NO_COBRADO", "PREPARADO", "SIN_INICIAR"].includes(data.estado) && !data.cancelacionSolicitada) return { mensaje: data.idPago && !data.idTicket ? "El cobro está guardado, pero la tarjeta no se ha cobrado. Puedes revisarlo en Tickets." : "El ticket sigue registrado como efectivo. No hay un cargo de tarjeta confirmado.", registrado: true, pagado: false };
  return { mensaje: "El ticket sigue registrado y se comprobará automáticamente. No generes otra venta para repetir este cobro.", registrado: true, pagado: false };
}

socket.on("datafono:operacion", data => {
  const actual = store.state.Datafono?.operacionActual;
  if (data?.enCurso) {
    store.dispatch("Datafono/setOperacion", data);
    store.dispatch("Datafono/setEstado", "PENDIENTE");
  } else if (!actual || actual.idTicket === data?.idTicket && actual.type === data?.type) {
    store.dispatch("Datafono/setOperacion", null);
    if (store.state.Datafono?.estado === "PENDIENTE") store.dispatch("Datafono/setEstado", "ONLINE");
  }
});

// La presencia se verifica en el backend; también funciona entre dispositivos distintos.
const sesionesCobroPantalla = new Map();
socket.on("cobro:comprobarSesion", ({ idTicket, token }, responder) => {
  if (typeof responder === "function") responder({ activa: sesionesCobroPantalla.get(Number(idTicket)) === token });
});
export async function mantenerSesionCobro(idTicket, token, liberar = false) {
  idTicket = Number(idTicket);
  if (liberar) {
    if (sesionesCobroPantalla.get(idTicket) === token) sesionesCobroPantalla.delete(idTicket);
  } else sesionesCobroPantalla.set(idTicket, token);
  const { data } = await axios.post("tickets/sesionCobro", { idTicket, token, liberar, conexionId: socket.id });
  if (!data?.ok) {
    if (sesionesCobroPantalla.get(idTicket) === token) sesionesCobroPantalla.delete(idTicket);
    throw Object.assign(new Error(data?.mensaje || "No se ha podido recuperar la pantalla de cobro"), { sesionCobro: true });
  }
  return data;
}
socket.on("cobro:resuelto", (cobro) => {
  if (!["FINALIZADO", "CANCELADO"].includes(cobro?.estado) || !cobro.idPago) return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const clave = localStorage.key(i);
      if (!clave?.startsWith("toc:pagoMixto:")) continue;
      const guardado = JSON.parse(localStorage.getItem(clave) || "null");
      if (guardado?.idPago === cobro.idPago) localStorage.removeItem(clave);
    }
  } catch { /* El estado del backend se comprobará igualmente al abrir el cobro. */ }
});
