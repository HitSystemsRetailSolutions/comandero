<template>
  <section v-if="visible || busy || error" class="mixed-payment" aria-label="Pago mixto">
    <div v-if="busy" class="mixed-notice" role="status">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>Comprobando el cobro… {{ proceso }}</span>
    </div>
    <template v-if="visible">
      <div class="mixed-heading">
        <span class="mixed-icon"><i class="fas fa-wallet" aria-hidden="true"></i></span>
        <div><h5>Efectivo + tarjeta</h5><p>Indica el efectivo. El resto se calcula en tarjeta.</p></div>
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
      <fieldset class="mixed-terminals" :disabled="busy || !!payment">
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
        <button type="button" class="btn btn-primary mixed-submit" :disabled="busy || (!payment && !valid)" @click="run">
          <i class="fas fa-check-circle" aria-hidden="true"></i>
          {{ payment ? 'Continuar / consultar estado' : 'Cobrar pago mixto' }}
        </button>
        <button type="button" class="btn btn-outline-primary mixed-back" :disabled="busy" @click="cancel">{{ payment ? 'Cancelar pago mixto' : 'Volver' }}</button>
      </div>
    </template>
    <p v-if="error" class="mixed-notice mixed-error" role="alert">{{ error }}</p>
    <button v-if="!ready && !busy" type="button" class="btn btn-outline-primary mixed-back" @click="recover">Reintentar consulta</button>
  </section>
</template>

<script>
import { computed, nextTick, ref, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

const newId = () => window.crypto?.randomUUID?.() || `pago-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const messages = {
  PREPARANDO: "Reparto guardado. Continúa para comprobar el cobro.",
  PREPARADO: "Pendiente de cobrar la tarjeta.",
  TARJETA_EN_CURSO: "Operación en curso. Consulta el estado antes de continuar.",
  TARJETA_INCIERTA: "Comprueba la última operación del datáfono. No repitas el cargo.",
  EFECTIVO_PENDIENTE: "Tarjeta confirmada. Recoge el efectivo y continúa.",
  FINALIZANDO: "Cobro recibido. Continúa para terminar el registro.",
  FINALIZADO: "Cobro registrado. Continúa para cerrar.",
  DEVOLUCION_EN_CURSO: "Comprueba la devolución en el datáfono y consulta el estado.",
  DEVOLUCION_CONFIRMADA: "Devolución confirmada. Cancela para completar el registro.",
  CANCELANDO_TICKET: "Cancela para completar el registro de la anulación.",
};

export default {
  props: {
    active: Boolean,
    basket: { type: Object, required: true },
    worker: { type: Object, required: true },
    proceso: String,
  },
  emits: ["blocked", "busy", "pending", "paid", "visibility-change"],
  setup(props, { emit }) {
    const visible = ref(false);
    const busy = ref(false);
    const ready = ref(false);
    const error = ref("");
    const cash = ref("");
    const terminal = ref("TARJETA");
    const preferredTerminal = ref(null);
    const terminalOptions = computed(() => [
      { value: "TARJETA", label: "Integrado", hint: "Conectado al programa", icon: "network-wired", iconClass: "connected" },
      { value: "DATAFONO_3G", label: "Independiente / 3G", hint: "Introduce el importe en el terminal", icon: "wifi", iconClass: "independent" },
    ].sort((a, b) => Number(b.value === preferredTerminal.value) - Number(a.value === preferredTerminal.value)));
    const payment = ref(null);
    const key = computed(() => `toc:pagoMixto:${props.basket._id}`);
    const total = computed(() => Object.entries(props.basket.detalleIva || {})
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
    const message = computed(() => messages[payment.value?.estado] || "");
    watch([busy, ready, visible, payment], () => {
      emit("visibility-change", visible.value);
      emit("busy", busy.value);
      emit("pending", !!payment.value);
      emit("blocked", busy.value || !ready.value || visible.value || !!payment.value);
    }, { immediate: true });

    function save() {
      // Compatible con la recuperación del modal de cobro del TPV.
      localStorage.setItem(key.value, JSON.stringify({
        idPago: payment.value.idPago, solicitud: payment.value.solicitud,
        efectivoCobrado: payment.value.efectivoCobrado,
        efectivoEnCurso: payment.value.efectivoEnCurso,
      }));
    }
    function reset() {
      localStorage.removeItem(key.value);
      payment.value = null;
      visible.value = false;
      cash.value = "";
    }
    async function action(accion, extra = {}) {
      const { data } = await axios.post("tickets/pagoMixto", {
        idPago: payment.value?.idPago || newId(), idTrabajador: props.worker._id,
        accion, ...extra,
      }, { timeout: 0 });
      if (!data?.ok) {
        if (accion === "PREPARAR" && data?.registrado === false) reset();
        throw new Error(data?.msg || "No se ha podido completar el pago mixto");
      }
      if (data.idPago) {
        payment.value = { ...payment.value, ...data };
        cash.value = data.pago.efectivo;
        terminal.value = data.pago.tipoTarjeta;
        visible.value = true;
        save();
      }
      return data;
    }
    async function recover() {
      if (busy.value) return;
      busy.value = true;
      ready.value = false;
      error.value = "";
      try {
        const saved = JSON.parse(localStorage.getItem(key.value) || "null");
        if (saved?.idPago) {
          payment.value = { ...saved, estado: "PREPARANDO" };
          visible.value = true;
          await action("PREPARAR", saved.solicitud || {});
        } else {
          await action("PENDIENTE", { idCesta: props.basket._id });
          if (payment.value?.estado === "EFECTIVO_PENDIENTE") {
            payment.value.efectivoEnCurso = true;
            save();
          }
        }
        if (payment.value?.estado === "CANCELADO") reset();
        if (!payment.value) {
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
      finally { busy.value = false; }
    }
    async function run() {
      if (busy.value || !ready.value || (!payment.value && !valid.value)) return;
      let completedId = null;
      busy.value = true;
      error.value = "";
      try {
        if (!payment.value) {
          const { data: idTicket } = await axios.get("tickets/getProximoId", {
            params: { datafonoIntegrado: terminal.value === "TARJETA" },
          });
          if (!idTicket || typeof idTicket !== "number") throw new Error("No se ha podido obtener el ID del ticket");
          payment.value = { idPago: newId(), estado: "PREPARANDO", solicitud: {
            idTicket, idCesta: props.basket._id, cantidadTkrs: 0, propina: 0,
            pago: { efectivo: Number(cash.value), tarjeta: card.value, tipoTarjeta: terminal.value },
          } };
          save();
        }
        let data = payment.value.estado === "PREPARANDO"
          ? await action("PREPARAR", payment.value.solicitud || {}) : await action("ESTADO");
        if (data.estado === "CANCELADO") { reset(); return; }
        if (data.estado === "PREPARADO") {
          if (data.pago.tipoTarjeta === "DATAFONO_3G") {
            const confirmation = await Swal.fire({ icon: "question", title: "Confirma el cobro con tarjeta",
              text: `${data.pago.tarjeta.toFixed(2)} € en el datáfono independiente`, showCancelButton: true,
              confirmButtonText: "Cobrado en el datáfono", cancelButtonText: "Volver" });
            if (!confirmation.isConfirmed) return;
          }
          data = await action("TARJETA");
        }
        if (data.estado === "EFECTIVO_PENDIENTE" && !payment.value.efectivoCobrado) {
          const confirmation = await Swal.fire({ icon: "question", title: "Confirma el efectivo recibido",
            text: `${data.pago.efectivo.toFixed(2)} €. Si ya lo has recibido, no vuelvas a cobrarlo.`,
            showCancelButton: true, confirmButtonText: "Efectivo recibido", cancelButtonText: "Volver" });
          if (!confirmation.isConfirmed) return;
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
    async function cancel() {
      if (busy.value) return;
      if (!payment.value) { visible.value = false; return; }
      if (payment.value.efectivoCobrado || ["FINALIZANDO", "FINALIZADO"].includes(payment.value.estado)) {
        error.value = "Comprueba el efectivo recibido y continúa para terminar el registro del cobro.";
        return;
      }
      busy.value = true;
      error.value = "";
      try {
        if (payment.value.efectivoEnCurso) {
          const cashCheck = await Swal.fire({ icon: "question", title: "Comprueba el efectivo del cobro anterior",
            text: "Indica si ya has recibido el efectivo antes de cancelar.", showDenyButton: true, showCancelButton: true,
            confirmButtonText: "Ya recibido", denyButtonText: "No recibido", cancelButtonText: "Volver" });
          if (cashCheck.isDismissed) return;
          if (cashCheck.isConfirmed) {
            payment.value.efectivoCobrado = true;
            save();
            error.value = "Continúa para terminar el registro del efectivo recibido.";
            return;
          }
          if (!cashCheck.isDenied) return;
          payment.value.efectivoEnCurso = false;
          save();
        }
        const data = payment.value.estado === "PREPARANDO"
          ? await action("PREPARAR", payment.value.solicitud || {}) : await action("ESTADO");
        if (data.estado === "CANCELADO") { reset(); return; }
        const manualRefund = data.estado === "EFECTIVO_PENDIENTE" && data.pago.tipoTarjeta === "DATAFONO_3G";
        const confirmation = await Swal.fire({ icon: "question", title: "¿Cancelar el pago mixto?",
          text: manualRefund ? `Devuelve manualmente ${data.pago.tarjeta.toFixed(2)} € en el datáfono 3G antes de confirmar.`
            : "Si la tarjeta está cobrada, se devolverá esa parte.",
          showCancelButton: true, confirmButtonText: manualRefund ? "Devolución realizada" : "Confirmar cancelación", cancelButtonText: "Volver" });
        if (!confirmation.isConfirmed) return;
        const result = await action("CANCELAR", { devolucion3GConfirmada: manualRefund });
        if (result.estado === "CANCELADO") reset();
      } catch (err) { error.value = err.message; }
      finally { busy.value = false; }
    }
    // MDBModal monta el contenido con active=true al abrirse por primera vez.
    watch(() => props.active, (active) => { if (active) recover(); }, { immediate: true });
    return { visible, busy, ready, error, cash, terminal, preferredTerminal, terminalOptions, payment, card, valid, message, run, cancel, recover,
      open: () => { if (ready.value && !busy.value) visible.value = true; } };
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
