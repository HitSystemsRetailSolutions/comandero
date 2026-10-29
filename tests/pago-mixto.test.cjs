const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const vue = require('vue');

// Ejecuta el setup real del SFC con transporte y confirmaciones controlados.
const source = fs.readFileSync(require.resolve('../src/components/PagoMixtoPanel.vue'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*;$/gm, '').replace('export default', 'module.exports =');

function fixture(handler, saved, active = false, es3G = false) {
  const requests = [];
  const events = [];
  const confirmations = [];
  const storage = new Map(saved ? [['toc:pagoMixto:basket-1', JSON.stringify(saved)]] : []);
  const context = {
    ...vue, module: { exports: {} },
    window: { crypto: { randomUUID: () => 'payment-1234567890' } },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    axios: {
      get: async (url) => {
        if (url === 'datafonoInt/es3G' && es3G instanceof Error) throw es3G;
        return { data: url === 'datafonoInt/es3G' ? es3G : 12345 };
      },
      post: async (url, body) => {
        requests.push(body);
        return { data: await handler(body) };
      },
    },
    Swal: { fire: async (options) => { confirmations.push(options); return { isConfirmed: true }; } },
  };
  vm.runInNewContext(source, context);
  const scope = vue.effectScope();
  const props = vue.reactive({
    active, basket: { _id: 'basket-1', modo: 'VENTA', lista: [], detalleIva: { importe1: 10.01, importe2: 0.02 } },
    worker: { _id: 7 },
  });
  const api = scope.run(() => context.module.exports.setup(props, { emit: (...args) => events.push(args) }));
  return { api, props, requests, events, storage, confirmations, stop: () => scope.stop() };
}
const response = (estado, extra = {}) => ({ ok: true, idPago: 'payment-1234567890', estado,
  pago: { efectivo: 4, tarjeta: 6.03, tipoTarjeta: 'TARJETA' }, idTicket: 12345, ...extra });
const noPending = { ok: true, idPago: null, estado: null };

test('prioriza y selecciona el 3G configurado antes de empezar un cobro mixto', async () => {
  const f = fixture(() => noPending, undefined, false, true);
  try {
    await f.api.recover();
    assert.equal(f.api.terminal.value, 'DATAFONO_3G');
    assert.equal(f.api.terminalOptions.value[0].value, 'DATAFONO_3G');
    assert.equal(f.api.preferredTerminal.value, 'DATAFONO_3G');
  } finally { f.stop(); }
});

test('prioriza el integrado cuando está configurado y deja elegir manualmente', async () => {
  const f = fixture(() => noPending);
  try {
    await f.api.recover();
    assert.equal(f.api.terminal.value, 'TARJETA');
    assert.equal(f.api.terminalOptions.value[0].value, 'TARJETA');
    f.api.terminal.value = 'DATAFONO_3G';
    assert.equal(f.api.preferredTerminal.value, 'TARJETA');
    assert.equal(f.api.terminal.value, 'DATAFONO_3G');
  } finally { f.stop(); }
});

test('conserva el datáfono de un pago pendiente aunque los parámetros indiquen otro', async () => {
  const f = fixture(() => response('PREPARADO'), undefined, false, true);
  try {
    await f.api.recover();
    assert.equal(f.api.terminal.value, 'TARJETA');
    assert.equal(f.api.payment.value.pago.tipoTarjeta, 'TARJETA');
  } finally { f.stop(); }
});

test('si falla la configuración permite elegir el datáfono sin bloquear el cobro', async () => {
  const f = fixture(() => noPending, undefined, false, new Error('Sin conexión'));
  try {
    await f.api.recover();
    assert.equal(f.api.ready.value, true);
    assert.equal(f.api.preferredTerminal.value, null);
    assert.equal(f.api.error.value, '');
  } finally { f.stop(); }
});

test('al montarse dentro del modal abierto consulta y desbloquea los métodos de pago', async () => {
  const f = fixture(() => noPending, undefined, true);
  try {
    await new Promise(setImmediate);
    assert.deepEqual(f.requests.map((r) => r.accion), ['PENDIENTE']);
    assert.equal(f.api.ready.value, true);
    assert.equal(f.events.filter(([name]) => name === 'blocked').at(-1)[1], false);
    f.api.open();
    assert.equal(f.api.visible.value, true);
    await f.api.cancel();
    f.props.active = false;
    await vue.nextTick();
    f.props.active = true;
    await new Promise(setImmediate);
    assert.equal(f.requests.length, 2);
    assert.equal(f.events.filter(([name]) => name === 'blocked').at(-1)[1], false);
  } finally { f.stop(); }
});

test('al montarse con el modal abierto recupera un pago pendiente y muestra su panel', async () => {
  const f = fixture(() => response('PREPARADO'), undefined, true);
  try {
    await new Promise(setImmediate);
    assert.equal(f.api.visible.value, true);
    assert.equal(f.api.payment.value.estado, 'PREPARADO');
    assert.equal(f.events.filter(([name]) => name === 'blocked').at(-1)[1], true);
    assert.equal(f.events.filter(([name]) => name === 'pending').at(-1)[1], true);
  } finally { f.stop(); }
});

test('cobra solo la parte de tarjeta, confirma efectivo e imprime el ID devuelto', async () => {
  const f = fixture((body) => body.accion === 'PENDIENTE' ? noPending : response({
    PREPARAR: 'PREPARADO', TARJETA: 'EFECTIVO_PENDIENTE', FINALIZAR: 'FINALIZADO',
  }[body.accion]));
  try {
    await f.api.recover();
    f.api.cash.value = 4;
    await f.api.run();
    assert.deepEqual(f.requests.map((r) => r.accion), ['PENDIENTE', 'PREPARAR', 'TARJETA', 'FINALIZAR']);
    assert.equal(f.requests[1].pago.tarjeta, 6.03);
    assert.equal(f.requests[1].idTicket, 12345);
    assert.equal(f.confirmations.length, 1);
    assert.deepEqual(f.events.at(-1), ['paid', 12345]);
    assert.equal(f.events.filter(([name]) => name === 'busy').at(-1)[1], false);
    assert.equal(f.events.filter(([name]) => name === 'pending').at(-1)[1], false);
    assert.equal(f.storage.size, 0);
  } finally { f.stop(); }
});

test('rechaza repartos inválidos antes de enviar un cargo', async () => {
  const f = fixture(() => noPending);
  try {
    await f.api.recover();
    for (const cash of [0, -1, 10.03, 11, 1.001, 'NaN']) {
      f.api.cash.value = cash;
      await f.api.run();
    }
    assert.deepEqual(f.requests.map((r) => r.accion), ['PENDIENTE']);
  } finally { f.stop(); }
});

test('recupera una respuesta perdida sin volver a cobrar la tarjeta', async () => {
  let fail = true;
  const handler = (body) => {
    if (body.accion === 'PENDIENTE') return noPending;
    if (body.accion === 'PREPARAR') return response('PREPARADO');
    if (body.accion === 'TARJETA' && fail) { fail = false; throw new Error('Conexión perdida'); }
    if (body.accion === 'ESTADO') return response('EFECTIVO_PENDIENTE');
    return response('FINALIZADO');
  };
  const f = fixture(handler);
  try {
    await f.api.recover();
    f.api.cash.value = 4;
    await f.api.run();
    assert.match(f.api.error.value, /Conexión perdida/);
    assert.equal(f.storage.size, 1);
    await f.api.run();
    assert.equal(f.requests.filter((r) => r.accion === 'TARJETA').length, 1);
    assert.deepEqual(f.events.at(-1), ['paid', 12345]);
  } finally { f.stop(); }
});

test('reanuda FINALIZANDO tras recarga sin pedir efectivo ni tarjeta otra vez', async () => {
  const f = fixture((body) => response(body.accion === 'FINALIZAR' ? 'FINALIZADO' : 'FINALIZANDO'),
    { idPago: 'payment-1234567890', efectivoCobrado: true });
  try {
    await f.api.recover();
    await f.api.run();
    assert.deepEqual(f.requests.map((r) => r.accion), ['PREPARAR', 'ESTADO', 'FINALIZAR']);
    assert.equal(f.confirmations.length, 0);
    assert.deepEqual(f.events.at(-1), ['paid', 12345]);
  } finally { f.stop(); }
});

test('una consulta fallida mantiene bloqueados los demás métodos hasta reintentar', async () => {
  let fail = true;
  const f = fixture(() => { if (fail) throw new Error('Sin conexión'); return noPending; });
  try {
    await f.api.recover();
    assert.equal(f.api.ready.value, false);
    assert.equal(f.events.filter(([name]) => name === 'blocked').at(-1)[1], true);
    fail = false;
    await f.api.recover();
    assert.equal(f.api.ready.value, true);
    assert.equal(f.events.filter(([name]) => name === 'blocked').at(-1)[1], false);
  } finally { f.stop(); }
});

test('la cancelación 3G exige confirmar la devolución manual', async () => {
  const f = fixture((body) => response(body.accion === 'CANCELAR' ? 'CANCELADO' : 'EFECTIVO_PENDIENTE',
    { pago: { efectivo: 4, tarjeta: 6.03, tipoTarjeta: 'DATAFONO_3G' } }), { idPago: 'payment-1234567890' });
  try {
    await f.api.recover();
    await f.api.cancel();
    assert.match(f.confirmations[0].text, /Devuelve manualmente 6.03/);
    assert.equal(f.requests.at(-1).devolucion3GConfirmada, true);
    assert.equal(f.storage.size, 0);
    assert.equal(f.events.filter(([name]) => name === 'pending').at(-1)[1], false);
  } finally { f.stop(); }
});

test('un estado de tarjeta incierto solo permite consultar, sin repetir el cargo', async () => {
  const f = fixture(() => response('TARJETA_INCIERTA'));
  try {
    await f.api.recover();
    await f.api.run();
    assert.deepEqual(f.requests.map((r) => r.accion), ['PENDIENTE', 'ESTADO']);
    assert.equal(f.events.some(([name]) => name === 'paid'), false);
    assert.equal(f.events.filter(([name]) => name === 'pending').at(-1)[1], true);
  } finally { f.stop(); }
});

test('recupera PREPARAR tras una desconexión usando el mismo identificador', async () => {
  let fail = true;
  const f = fixture((body) => {
    if (body.accion === 'PENDIENTE') return noPending;
    if (fail) { fail = false; throw new Error('Respuesta perdida'); }
    return response('PREPARADO');
  });
  try {
    await f.api.recover();
    f.api.cash.value = 4;
    await f.api.run();
    const saved = JSON.parse(f.storage.get('toc:pagoMixto:basket-1'));
    await f.api.recover();
    assert.equal(f.requests.at(-1).accion, 'PREPARAR');
    assert.equal(f.requests.at(-1).idPago, saved.idPago);
    assert.equal(f.requests.at(-1).idTicket, saved.solicitud.idTicket);
    assert.equal(f.api.payment.value.estado, 'PREPARADO');
  } finally { f.stop(); }
});

test('no devuelve la tarjeta de un cobro recuperado si ya se recibió el efectivo', async () => {
  const f = fixture(() => response('EFECTIVO_PENDIENTE'));
  try {
    await f.api.recover();
    await f.api.cancel();
    assert.equal(f.api.payment.value.efectivoCobrado, true);
    assert.equal(f.requests.some((r) => r.accion === 'CANCELAR'), false);
    assert.equal(f.storage.size, 1);
  } finally { f.stop(); }
});

test('bloquea pulsaciones simultáneas durante el cobro', async () => {
  const f = fixture((body) => body.accion === 'PENDIENTE' ? noPending : response({
    PREPARAR: 'PREPARADO', TARJETA: 'EFECTIVO_PENDIENTE', FINALIZAR: 'FINALIZADO',
  }[body.accion]));
  try {
    await f.api.recover();
    f.api.cash.value = 4;
    await Promise.all([f.api.run(), f.api.run()]);
    assert.equal(f.requests.filter((r) => r.accion === 'TARJETA').length, 1);
    assert.equal(f.events.filter(([name]) => name === 'paid').length, 1);
  } finally { f.stop(); }
});
