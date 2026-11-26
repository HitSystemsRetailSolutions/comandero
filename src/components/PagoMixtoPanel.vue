<template>
  <section v-if="visible || busy || error" class="mixed-payment" aria-label="Pago mixto">
    <div v-if="busy" class="mixed-notice" role="status">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>{{ recovering ? "Recuperando cobro…" : "Procesando el cobro…" }} {{ proceso }}</span>
    </div>
    <template v-if="visible">
      <div class="mixed-heading">
        <span class="mixed-icon"><i class="fas fa-wallet" aria-hidden="true"></i></span>
        <div><h5>{{ 'Efectivo + tarjeta' }}</h5><p>{{ payment ? 'Cobro guardado' : 'Indica la parte en efectivo. El resto se cobra con tarjeta.' }}<span v-if="payment?.idTicket"> · {{ payment.idTicket }}</span></p></div>
      </div>
      <div class="mixed-amounts">
        <div class="mixed-amount cash-amount">
          <label for="mixed-cash"><i class="fas fa-money-bill-wave" aria-hidden="true"></i> Efectivo</label>
          <div class="mixed-input"><input id="mixed-cash" v-model="cash" type="number" inputmode="decimal"
            min="0.01" step="0.01" placeholder="0,00" aria-describedby="mixed-help"
            :disabled="busy || !!payment" /><span>€</span></div>
          <span class="mixed-caption">Importe que recibes en metálico</span>
        </div>
        <div class="mixed-amount card-amount">
          <span class="mixed-label"><i class="fas fa-credit-card" aria-hidden="true"></i> Tarjeta</span>
          <output class="mixed-card-total" for="mixed-cash" aria-live="polite">{{ Number.isFinite(card) ? card.toFixed(2) : '0.00' }} <span>€</span></output>
          <span class="mixed-caption">Resto a cobrar en el datáfono</span>
        </div>
      </div>
      <fieldset v-if="!payment" class="mixed-terminals" :disabled="busy || !!payment">
        <legend>Datáfono para la tarjeta</legend>
        <div class="mixed-terminal-options">
          <label v-for="option in terminalOptions" :key="option.value" class="mixed-terminal" :class="{ selected: terminal === option.value }">
            <input v-model="terminal" type="radio" name="mixed-terminal" :value="option.value" />
            <span>
              <strong>
                <span class="mixed-terminal-icon" :class="option.iconClass">
                  <i class="fas" :class="'fa-' + option.icon" aria-hidden="true"></i>
                </span>
                {{ option.label }}
              </strong>
              <small>{{ option.hint }}</small>
            </span>
            <span v-if="preferredTerminal === option.value" class="mixed-preferred">Habitual</span>
          </label>
        </div>
      </fieldset>
      <p v-if="message" class="mixed-notice" role="status"><i class="fas fa-info-circle" aria-hidden="true"></i>{{ message }}</p>
      <p id="mixed-help" v-if="!payment" class="mixed-help">Ambos importes deben ser mayores que cero. Total inferior a 1.000 €.</p>
      <div class="mixed-actions">
        <button v-if="ready" type="button" class="btn btn-primary mixed-submit" :disabled="busy || operationActive || (!payment && !valid)" @click="primaryAction">
          <i class="fas fa-check-circle" aria-hidden="true"></i>{{ primaryLabel }}
        </button>
      </div>
    </template>
    <p v-if="error" class="mixed-notice mixed-error" role="alert">{{ error }}</p>
    <button v-if="!ready && !busy" type="button" class="btn btn-outline-primary mixed-back" @click="recover">{{ "Reintentar recuperación" }}</button>
  </section>
</template>

<script>
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { guardarCancelacionCobro, guardarSalidaCobro, estadoSalidaCobro, socket, mantenerSesionCobro, comprobarDisponibilidadDatafono } from "@/services/sockets";
import Swal from "sweetalert2";

const newId = () => window.crypto?.randomUUID?.() || `pago-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const messages = {
  PREPARANDO: "Recupera el cobro antes de continuar.",
  PREPARADO: "Pendiente de cobrar la tarjeta.",
  TARJETA_EN_CURSO: "Operación en curso. Consulta el estado antes de continuar.",
  TARJETA_INCIERTA: "Comprueba la última operación del datáfono. No repitas el cargo.",
  EFECTIVO_PENDIENTE: "Tarjeta confirmada. Completando el cobro.",
  FINALIZANDO: "Cobro recibido. Continúa para terminar el registro.",
  FINALIZADO: "Cobro registrado. Continúa para cerrar.",
  DEVOLUCION_EN_CURSO: "Comprueba la devolución en el datáfono y consulta el estado.",
  DEVOLUCION_CONFIRMADA: "Devolución confirmada. Finaliza el registro de la anulación.",
  CANCELANDO_TICKET: "Finaliza el registro de la anulación.",
};

export default {
  props: {
    active: Boolean,
    basket: { type: Object, required: true },
    worker: { type: Object, required: true },
    proceso: String,
    terminalOperation: Object,
  },
  emits: ["blocked", "busy", "enabled", "pending", "paid", "visibility-change"],
  setup(props, { emit }) {
    const habilitarPagoMixto = ref(false);
    const visible = ref(false);
    const busy = ref(false);
    const ready = ref(false);
    const recovering = ref(false);
    const error = ref("");
    const cash = ref("");
    const terminal = ref("TARJETA");
    const preferredTerminal = ref(null);
    const terminalOptions = computed(() => [
      { value: "TARJETA", label: "Integrado", hint: "Conectado al programa", icon: "network-wired", iconClass: "connected" },
      { value: "DATAFONO_3G", label: "Independiente / 3G", hint: "Introduce el importe en el terminal", icon: "wifi", iconClass: "independent" },
    ].sort((a, b) => Number(b.value === preferredTerminal.value) - Number(a.value === preferredTerminal.value)));
    const payment = ref(null);
    const sesionCobro = newId();
    let ticketEnSesion = null;
    async function actualizarSesion() {
      const id = props.active ? payment.value?.idTicket || payment.value?.idOperacion || payment.value?.solicitud?.idTicket : null;
      if (ticketEnSesion && ticketEnSesion !== id) await mantenerSesionCobro(ticketEnSesion, sesionCobro, true).catch(() => {});
      ticketEnSesion = id;
      if (id) {
        const data = await mantenerSesionCobro(id, sesionCobro);
        if (!data?.ok) throw new Error(data?.mensaje || "El ticket está en uso en otra pantalla");
      }
    }
    let latido;
    onMounted(() => { latido = setInterval(() => actualizarSesion().catch(() => {}), 20000); });
    onUnmounted(() => { clearInterval(latido); if (ticketEnSesion) mantenerSesionCobro(ticketEnSesion, sesionCobro, true).catch(() => {}); });
    const key = computed(() => `toc:pagoMixto:${props.basket._id}`);
    const total = computed(() => payment.value?.pendiente ?? Object.entries(props.basket.detalleIva || {})
      .filter(([name]) => name.startsWith("importe"))
      .reduce((sum, [, amount]) => sum + Math.round(Number(amount) * 100), 0) / 100);
    const card = computed(() => payment.value?.pago?.tarjeta ??
      (Math.round(total.value * 100) - Math.round(Number(cash.value || 0) * 100)) / 100);
    const valid = computed(() => {
      const amount = Number(cash.value);
      return Number.isFinite(amount) && amount > 0 && card.value > 0 && total.value < 1000 &&
        Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001 &&
        ["VENTA", "PAGO SEPARADO"].includes(props.basket.modo) && !props.basket.lista?.some((item) => item.pagado);
    });
    const message = computed(() => {
      const estado = payment.value?.estado;
      return messages[estado] || "";
    });
    const operationActive = computed(() => props.active && props.terminalOperation?.enCurso === true &&
      [payment.value?.idTicket, payment.value?.idOperacion, payment.value?.solicitud?.idTicket]
        .some(id => id != null && String(id) === String(props.terminalOperation.idTicket)));
    const primaryLabel = computed(() => {
      if (busy.value) return "En curso…";
      if (operationActive.value) return "Esperando al datáfono…";
      if (!payment.value) return "Cobrar pago mixto";
      if (["TARJETA_EN_CURSO","TARJETA_INCIERTA","DEVOLUCION_EN_CURSO"].includes(payment.value.estado)) return "Comprobar tarjeta";
      if (["DEVOLUCION_CONFIRMADA","CANCELANDO_TICKET"].includes(payment.value.estado)) return "Finalizar anulación";
      if (["EFECTIVO_PENDIENTE","FINALIZANDO","FINALIZADO"].includes(payment.value.estado)) return "Finalizar registro";
      return payment.value.efectivoRecibido || payment.value.efectivoCobrado
        ? "Reintentar tarjeta" : "Continuar cobro";
    });
    async function primaryAction() {
      if (!ready.value || busy.value || operationActive.value) return;
      if (["TARJETA_EN_CURSO","TARJETA_INCIERTA","DEVOLUCION_EN_CURSO"].includes(payment.value?.estado)) return check();
      if (["DEVOLUCION_CONFIRMADA","CANCELANDO_TICKET"].includes(payment.value?.estado)) return cancel();
      return run();
    }
    watch(habilitarPagoMixto, enabled => emit("enabled", enabled), { immediate: true });
    watch([busy, ready, visible, payment, operationActive], () => {
      emit("visibility-change", visible.value);
      emit("busy", busy.value || operationActive.value);
      emit("pending", !!payment.value);
      emit("blocked", busy.value || operationActive.value || !ready.value || visible.value || !!payment.value);
    }, { immediate: true });

    function save() {
      // Compatible con la recuperación del modal de cobro del TPV.
      localStorage.setItem(key.value, JSON.stringify({
        idPago: payment.value.idPago, solicitud: payment.value.solicitud,
        efectivoCobrado: payment.value.efectivoCobrado,
        efectivoEnCurso: payment.value.efectivoEnCurso,
        cancelacionSolicitada: payment.value.cancelacionSolicitada, idTrabajador: props.worker._id,
      }));
    }
    function reset() {
      const guardado = JSON.parse(localStorage.getItem(key.value) || "null");
      if (!guardado || guardado.idPago === payment.value?.idPago) localStorage.removeItem(key.value);
      payment.value = null;
      visible.value = false;
      cash.value = "";
    }
    function cerrarCobroResuelto(data) {
      if (data?.estado !== "FINALIZADO" || !payment.value || data.idPago !== payment.value.idPago) return false;
      const idTicket = data.idTicket || payment.value.idTicket;
      reset(); actualizarSesion().catch(() => {});
      emit("resolved", idTicket);
      return true;
    }
    let resolucionPendiente = null;
    function recibirCobroResuelto(data) {
      if (data?.estado !== "FINALIZADO" || !payment.value || data.idPago !== payment.value.idPago) return;
      if (busy.value) { resolucionPendiente = data; return; }
      cerrarCobroResuelto(data);
    }
    socket?.on("cobro:resuelto", recibirCobroResuelto);
    onUnmounted(() => socket?.off("cobro:resuelto", recibirCobroResuelto));
    watch(busy, enCurso => {
      if (!enCurso && resolucionPendiente) {
        const resuelto = resolucionPendiente; resolucionPendiente = null;
        cerrarCobroResuelto(resuelto);
      }
    });
    async function action(accion, extra = {}) {
      const { data } = await axios.post("tickets/pagoMixto", {
        ...extra, idPago: payment.value?.idPago || newId(), idTrabajador: props.worker._id,
        accion, sesionCobro, conexionId: socket?.id,
      }, { timeout: 0 });
      if (!data?.ok) {
        if (accion === "PREPARAR" && data?.registrado === false) reset();
        throw Object.assign(new Error(data?.msg || "No se ha podido completar el pago mixto"), { devolucionNoRealizada: data?.devolucionNoRealizada === true });
      }
      if (data.idPago) {
        payment.value = { ...payment.value, ...data };
        if (data.efectivoRecibido) payment.value.efectivoCobrado = true;
        cash.value = data.pago.efectivo;
        terminal.value = data.pago.tipoTarjeta;
        visible.value = true;
        save();
      }
      return data;
    }
    async function actualizarHabilitarPagoMixto() {
      try {
        const { data } = await axios.post("parametros/getParametros", {}, { timeout: 5000 });
        const valor = data?.params?.habilitarPagoMixto;
        habilitarPagoMixto.value = typeof valor === "string" && valor.toUpperCase() === "SI";
      } catch {
        habilitarPagoMixto.value = false;
      }
      return habilitarPagoMixto.value;
    }
    async function recover() {
      if (busy.value) return;
      busy.value = true;
      ready.value = false;
      recovering.value = true;
      error.value = "";
      habilitarPagoMixto.value = false;
      const configuracion = actualizarHabilitarPagoMixto();
      try {
        const saved = JSON.parse(localStorage.getItem(key.value) || "null");
        if (saved?.idPago) {
          payment.value = { ...saved, estado: "PREPARANDO" };
          visible.value = true;
          await action("PREPARAR", saved.solicitud || {});
          if (saved.cancelacionSolicitada) { await action("CANCELAR"); reset(); return; }
        } else {
          await action("PENDIENTE", { idCesta: props.basket._id });
          if (payment.value?.estado === "EFECTIVO_PENDIENTE") {
            payment.value.efectivoEnCurso = true;
            save();
          }
        }
        if (payment.value?.estado === "FINALIZADO") { cerrarCobroResuelto(payment.value); ready.value = true; return; }
        if (["CANCELADO", "ARCHIVADO_CIERRE"].includes(payment.value?.estado)) reset();
        if (payment.value) await actualizarSesion();
        const habilitado = await configuracion;
        if (!payment.value && habilitado) {
          try {
            // Usa la misma interpretación de parámetros que el TPV (incluye integrado apagado).
            const { data } = await axios.get("datafonoInt/es3G", { timeout: 5000 });
            if (typeof data === "boolean") {
              preferredTerminal.value = data ? "DATAFONO_3G" : "TARJETA";
              terminal.value = preferredTerminal.value;
            }
          } catch { /* Permite seleccionar manualmente si no se puede consultar la configuración. */ }
        }
        ready.value = true;
      } catch (err) { error.value = err.message; }
      finally { recovering.value = false; busy.value = false; }
    }
    const recoverOnConnect = () => { if (props.active && !busy.value) recover(); };
    socket?.on("connect", recoverOnConnect);
    onUnmounted(() => socket?.off("connect", recoverOnConnect));
    async function comprobarDisponibilidadParaCobro() {
      try { await comprobarDisponibilidadDatafono(); return true; }
      catch (err) {
        await Swal.fire("Datáfono no disponible", err.message, "warning");
        return false;
      }
    }
    async function run() {
      if (busy.value || operationActive.value || !ready.value || (!payment.value && !valid.value)) return;
      let completedId = null;
      busy.value = true;
      error.value = "";
      try {
        if (!payment.value && !await actualizarHabilitarPagoMixto()) {
          visible.value = false;
          error.value = "El pago mixto está deshabilitado.";
          return;
        }
        let disponibilidadComprobada = false;
        if ((!payment.value || payment.value.estado === "PREPARANDO") && terminal.value === "TARJETA") {
          if (!await comprobarDisponibilidadParaCobro()) return;
          disponibilidadComprobada = true;
        }
        if (!payment.value) {
          const { data: idTicket } = await axios.get("tickets/getProximoId", {
            params: { datafonoIntegrado: terminal.value === "TARJETA" },
          });
          if (!idTicket || typeof idTicket !== "number") throw new Error("No se ha podido obtener el ID del ticket");
          payment.value = { idPago: newId(), estado: "PREPARANDO", efectivoCobrado: false, solicitud: {
            idTicket, idCesta: props.basket._id, cantidadTkrs: 0, propina: 0, efectivoRecibido: false, sesionCobro,
            pago: { efectivo: Number(cash.value), tarjeta: card.value, tipoTarjeta: terminal.value },
          } };
          save();
        }
        let data = payment.value.estado === "PREPARANDO"
          ? await action("PREPARAR", payment.value.solicitud || {}) : await action("ESTADO");
        if (data.estado === "CANCELADO") { reset(); return; }
        if (data.estado === "PREPARADO") {
          if (data.pago.tipoTarjeta === "TARJETA" && !disponibilidadComprobada && !await comprobarDisponibilidadParaCobro()) return;
          await actualizarSesion();
          if (!payment.value.efectivoCobrado) {
            payment.value.efectivoCobrado = true; save();
          }
          await action("EFECTIVO", { efectivoRecibido: true });
          if (data.pago.tipoTarjeta === "DATAFONO_3G") {
            const confirmation = await Swal.fire({ icon: "question", title: "Confirma el cobro con tarjeta",
              text: `${data.pago.tarjeta.toFixed(2)} € en el datáfono independiente`, showCancelButton: true,
              confirmButtonText: "Cobrado en el datáfono", cancelButtonText: "Volver" });
            if (!confirmation.isConfirmed) return;
          }
          payment.value.estado = "TARJETA_EN_CURSO";
          try { data = await action("TARJETA"); }
          catch (err) { if (payment.value?.estado === "TARJETA_EN_CURSO") payment.value.estado = "TARJETA_INCIERTA"; throw err; }
        }
        if (data.estado === "EFECTIVO_PENDIENTE" && !payment.value.efectivoCobrado) {
          payment.value.efectivoCobrado = true;
          payment.value.efectivoEnCurso = false;
          save();
        }
        if (["EFECTIVO_PENDIENTE", "FINALIZANDO"].includes(data.estado)) data = await action("FINALIZAR");
        if (data.estado === "FINALIZADO") {
          const idTicket = data.idTicket;
          if (!idTicket) throw new Error("No se ha recibido el ticket del pago mixto");
          reset();
          completedId = idTicket;
        }
      } catch (err) { error.value = err.message; }
      finally {
        busy.value = false;
        await nextTick();
        if (completedId) emit("paid", completedId);
      }
    }
    async function check() {
      if (busy.value || operationActive.value || !ready.value || !payment.value) return;
      busy.value = true; error.value = "";
      let completedId = null;
      try {
        let data = await action("ESTADO");
        if (["EFECTIVO_PENDIENTE", "FINALIZANDO"].includes(data.estado) && (data.efectivoRecibido || payment.value.efectivoCobrado)) data = await action("FINALIZAR");
        if (data.estado === "FINALIZADO") { completedId = data.idTicket; reset(); }
      } catch (err) { error.value = err.message; }
      finally { busy.value = false; await nextTick(); if (completedId) emit("paid", completedId); }
    }
    async function leave() {
      if (busy.value || operationActive.value) return false;
      if (!ready.value) {
        // No se adquirió el cobro: salir no modifica la sesión de otro dispositivo.
        payment.value = null; visible.value = false; cash.value = ""; error.value = "";
        await actualizarSesion().catch(() => {}); return true;
      }
      if (!payment.value) { visible.value = false; return true; }
      busy.value = true;
      try {
        const referencia = payment.value.idTicket || payment.value.idOperacion || payment.value.idPago;
        const salida = estadoSalidaCobro(await guardarSalidaCobro({ idPago: payment.value.idPago, idTrabajador: props.worker._id, sesionCobro, claveLocal: key.value }));
        if (salida.mensaje) await Swal.fire({ icon: "info", title: "Estado del cobro", text: salida.mensaje + " · " + referencia });
        reset(); await actualizarSesion(); return true;
      } finally { busy.value = false; }
    }
    async function cancel() {
      if (busy.value) return false;
      if (!payment.value) { visible.value = false; return true; }
      if (!(await Swal.fire({ icon: "question", text: "¿Confirma ANULACIÓN de ticket?", showCancelButton: true })).isConfirmed) return false;
      busy.value = true;
      error.value = "";
      try {
        if (payment.value.estado === "PREPARANDO") await action("PREPARAR", payment.value.solicitud || {});
        let devolucion3GConfirmada = false;
        if (payment.value.pago?.tipoTarjeta === "DATAFONO_3G" && payment.value.estado === "EFECTIVO_PENDIENTE") {
          const confirmacion = await Swal.fire({ icon: "question", title: "Devolución en datáfono independiente",
            text: "Devuelve manualmente " + Number(payment.value.pago.tarjeta).toFixed(2) + " € en el datáfono antes de continuar.", showCancelButton: true });
          if (!confirmacion.isConfirmed) return false;
          devolucion3GConfirmada = true;
        }
        const resultado = await action("CANCELAR", { devolucion3GConfirmada });
        if (["ARCHIVADO_CIERRE", "FINALIZADO"].includes(resultado.estado)) { reset(); await actualizarSesion(); return true; }
        if (resultado.estado !== "CANCELADO" && !resultado.cancelacionSolicitada) return false;
        reset(); await actualizarSesion(); return true;
      } catch (err) {
        if (err.devolucionNoRealizada) {
          payment.value.cancelacionSolicitada = false; save();
          await action("ESTADO").catch(() => {});
          error.value = "La devolución ha sido cancelada o denegada. El cargo original se mantiene y la venta no se ha anulado.";
          return false;
        }
        payment.value.cancelacionSolicitada = true; save();
        guardarCancelacionCobro({ idPago: payment.value.idPago, idTrabajador: props.worker._id, sesionCobro, claveLocal: key.value });
        error.value = "La cancelación queda guardada para comprobarla al recuperar la conexión.";
        payment.value = null; visible.value = false;
        await actualizarSesion().catch(() => {}); return true;
      } finally { busy.value = false; }
    }
    // MDBModal monta el contenido con active=true al abrirse por primera vez.
    watch(() => props.active, (active) => { if (active) recover(); }, { immediate: true });
    return { visible, busy, recovering, ready, operationActive, primaryLabel, primaryAction, error, cash, terminal, preferredTerminal, terminalOptions, payment, card, valid, message, run, check, cancel, leave, recover,
      open: () => { if (habilitarPagoMixto.value && ready.value && !busy.value) visible.value = true; } };
  },
};
</script>

<style scoped>
.mixed-payment { padding: 24px; border-radius: 20px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 5%); color: #1e293b; }
.mixed-heading { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.mixed-icon { display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px; background: #f5f3ff; color: #7c3aed; font-size: 1.3rem; }
.mixed-heading h5 { font-size: 1.15rem; font-weight: 800; margin: 0 0 4px; }
.mixed-heading p, .mixed-help { color: #64748b; font-size: .85rem; margin: 0; line-height: 1.5; }
.mixed-amounts, .mixed-terminal-options { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.mixed-amount { min-width: 0; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; }
.cash-amount { background: #f0fdf8; border-color: #d1fae5; }
.card-amount { background: #eff6ff; border-color: #dbeafe; }
.mixed-amount label, .mixed-label { display: flex; gap: 8px; align-items: center; font-weight: 700; font-size: .9rem; }
.cash-amount label { color: #047857; }.mixed-label { color: #1d4ed8; }
.mixed-input { display: flex; align-items: center; margin: 12px 0 8px; padding: 0 12px; border: 2px solid #a7f3d0; border-radius: 12px; background: white; }
.mixed-input:focus-within { border-color: #10b981; box-shadow: 0 0 0 3px #d1fae5; }
.mixed-input input { width: 100%; min-width: 0; min-height: 52px; border: 0; outline: 0; background: transparent; font-size: 1.65rem; font-weight: 800; color: #065f46; }
.mixed-input span, .mixed-card-total span { font-size: 1.1rem; font-weight: 600; }
.mixed-card-total { display: block; min-height: 56px; margin: 12px 0 8px; font-size: 1.8rem; font-weight: 800; color: #1d4ed8; line-height: 56px; overflow-wrap: anywhere; }
.mixed-caption { display: block; font-size: .75rem; color: #64748b; }
.mixed-terminals { margin: 24px 0 16px; min-width: 0; }.mixed-terminals legend { font-size: .9rem; font-weight: 700; margin-bottom: 12px; }
.mixed-terminal { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 14px; border: 2px solid #e2e8f0; border-radius: 14px; cursor: pointer; }
.mixed-terminal.selected { background: #eff6ff; border-color: #3b82f6; }.mixed-terminal input { accent-color: #2563eb; width: 18px; height: 18px; }
.mixed-terminal strong, .mixed-terminal small { display: block; }.mixed-terminal strong { font-size: .85rem; }.mixed-terminal small { font-size: .75rem; color: #64748b; margin-top: 4px; }
.mixed-terminal strong { display: flex; align-items: center; gap: 8px; }
.mixed-terminal-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
.mixed-terminal-icon.connected { background: #ecfdf5; color: #10b981; }
.mixed-terminal-icon.independent { background: #fef3c7; color: #d97706; }
.mixed-terminals:disabled .mixed-terminal { cursor: default; opacity: .75; }.mixed-preferred { font-size: .65rem; font-weight: 700; color: #1d4ed8; background: #dbeafe; padding: 3px 8px; border-radius: 20px; }
.mixed-notice { display: flex; align-items: center; gap: 10px; background: #eff6ff; color: #1e40af; padding: 14px 16px; border-radius: 12px; font-size: .85rem; line-height: 1.5; margin: 0 0 16px; }
.mixed-error { background: #fef2f2; color: #b91c1c; margin-top: 16px; }.mixed-notice .spinner-border { flex-shrink: 0; }
.mixed-actions { display: flex; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
.mixed-actions button, .mixed-back { min-height: 48px; border-radius: 12px; font-weight: 600; text-transform: none; box-shadow: none; }
.mixed-submit { flex: 1; }.mixed-submit i { margin-right: 6px; }
@media (max-width: 576px), (max-height: 500px) {
  .mixed-payment { padding: 14px; border-radius: 16px; min-width: 0; }
  .mixed-heading { align-items: flex-start; gap: 10px; margin-bottom: 16px; }
  .mixed-heading > div { min-width: 0; }
  .mixed-icon { width: 36px; height: 36px; border-radius: 10px; font-size: 1rem; }
  .mixed-heading h5 { font-size: 1rem; }
  .mixed-heading p, .mixed-help { font-size: .78rem; }
  .mixed-amounts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .mixed-amount { padding: 12px 10px; border-radius: 12px; }
  .mixed-amount label, .mixed-label { font-size: .8rem; gap: 6px; }
  .mixed-input { margin: 10px 0 0; padding: 0 7px; border-radius: 10px; }
  .mixed-input input { min-height: 44px; font-size: 1.25rem; padding: 0; }
  .mixed-input input::-webkit-inner-spin-button, .mixed-input input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .mixed-input input { -moz-appearance: textfield; }
  .mixed-input span, .mixed-card-total span { font-size: .9rem; }
  .mixed-card-total { font-size: 1.35rem; min-height: 48px; line-height: 48px; margin: 10px 0 0; }
  .mixed-caption { display: none; }
  .mixed-terminals { margin: 18px 0 12px; }
  .mixed-terminals legend { font-size: .82rem; margin-bottom: 10px; }
  .mixed-terminal-options { grid-template-columns: 1fr; gap: 8px; }
  .mixed-terminal { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 8px; padding: 12px 10px; min-height: 48px; }
  .mixed-terminal input { margin: 0; }
  .mixed-terminal strong { font-size: .8rem; overflow-wrap: anywhere; }
  .mixed-terminal small { font-size: .7rem; }
  .mixed-preferred { font-size: .6rem; padding: 3px 6px; }
  .mixed-notice { padding: 12px; font-size: .78rem; overflow-wrap: anywhere; }
  .mixed-actions { flex-direction: column; margin-top: 16px; gap: 8px; }
  .mixed-actions button, .mixed-back { width: 100%; padding: 12px 10px; font-size: .82rem; white-space: normal; }
  .mixed-submit { flex: auto; }
}
@media (max-width: 359px) {
  .mixed-amounts { grid-template-columns: 1fr; }
  .mixed-preferred { grid-column: 2 / -1; justify-self: start; }
}
</style>
