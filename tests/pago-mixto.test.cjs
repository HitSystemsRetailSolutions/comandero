const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const vue = require('vue');
const servicios=fs.readFileSync(require.resolve('../src/services/sockets.js'),'utf8');
const inicioSalida=servicios.indexOf('export function estadoSalidaCobro');
const estadoSalidaCobro=vm.runInNewContext(servicios.slice(inicioSalida,servicios.indexOf('socket.on("datafono:operacion"',inicioSalida)).replace('export function','function')+'\nestadoSalidaCobro');

// Ejecuta el setup real del SFC con transporte y confirmaciones controlados.
const source = fs.readFileSync(require.resolve('../src/components/PagoMixtoPanel.vue'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*;$/gm, '').replace('export default', 'module.exports =');

function fixture(handler, saved, active = false, es3G = false, options = {}) {
  const requests = [];
  const events = [];
  const confirmations = [];
  const handlers = {};
  const storage = new Map(saved ? [['toc:pagoMixto:basket-1', JSON.stringify(saved)]] : []);
  const context = {
    comprobarDisponibilidadDatafono: async () => { if (options.disponibilidad) await options.disponibilidad(); },
    useI18n: () => ({ t: (_key, fallback) => fallback }),
    estadoSalidaCobro,
    guardarSalidaCobro: p => events.push(["salidaGuardada", p]),
    guardarCancelacionCobro: p => events.push(["cancelacionGuardada", p]),
    mantenerSesionCobro: async (...args) => options.sesion ? options.sesion(...args) : ({ok:true}), socket: {id:'conexion-nueva',on(event,fn){handlers[event]=fn;},off() {}},
    ...vue, onMounted() {}, onUnmounted() {}, module: { exports: {} },
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
        if (url === "tickets/sesionCobro") return { data: { ok: true } };
        requests.push(body);
        return { data: body.accion === "EFECTIVO" ? response("PREPARADO", { efectivoRecibido: true }) : await handler(body) };
      },
    },
    Swal: { fire: async (...args) => { const options = args[0]; confirmations.push(args.length > 1 ? args : options); return { isConfirmed: true }; } },
  };
  vm.runInNewContext(source, context);
  const scope = vue.effectScope();
  const props = vue.reactive({
    active, basket: { _id: 'basket-1', modo: 'VENTA', lista: [], detalleIva: { importe1: 10.01, importe2: 0.02 } },
    worker: { _id: 7 },
  });
  const api = scope.run(() => context.module.exports.setup(props, { emit: (...args) => events.push(args) }));
  return { api, props, requests, events, storage, confirmations, handlers, stop: () => scope.stop() };
}
const response = (estado, extra = {}) => ({ ok: true, idPago: 'payment-1234567890', estado,
  pago: { efectivo: 4, tarjeta: 6.03, tipoTarjeta: 'TARJETA' }, idTicket: 12345, ...extra });
const noPending = { ok: true, idPago: null, estado: null };

test('cancelar un reintento de tarjeta actualiza el estado guardado sin repetir el cargo',async()=>{
  const e=comprobadorTarjeta();e.context.estadoComprobacion.value='NO_COBRADO';
  e.context.comprobarPagoActual=async()=>{e.calls.push('consultar-estado');e.context.estadoComprobacion.value='NO_COBRADO';};
  e.context.axios.post=async(_url,body)=>{e.calls.push(body);return {data:{ok:true,estado:'DESCONOCIDO'}};};
  const codigo=fs.readFileSync(require.resolve('../src/views/TicketView.vue'),'utf8');
  const inicio=codigo.indexOf('async function cobrarConPaytef() {'),fin=codigo.indexOf('\n    async function handlePrintTicket()',inicio);
  await vm.runInNewContext('('+codigo.slice(inicio,fin).trim()+')',e.context)();
  assert.equal(e.context.estadoComprobacion.value,'NO_COBRADO');
  assert.equal(e.calls.filter(c=>c?.accion==='COBRAR').length,1);
  assert.equal(e.calls.filter(c=>c==='consultar-estado').length,1);
  assert.equal(e.context.paytefLoading.value,false);
});

test('un reintento sin respuesta conserva resultado desconocido y permite comprobar',async()=>{
  const e=comprobadorTarjeta();e.context.estadoComprobacion.value='NO_COBRADO';
  e.context.axios.post=async()=>{throw Error('Sin conexión');};
  const codigo=fs.readFileSync(require.resolve('../src/views/TicketView.vue'),'utf8');
  const inicio=codigo.indexOf('async function cobrarConPaytef() {'),fin=codigo.indexOf('\n    async function handlePrintTicket()',inicio);
  await vm.runInNewContext('('+codigo.slice(inicio,fin).trim()+')',e.context)();
  assert.equal(e.context.estadoComprobacion.value,'DESCONOCIDO');
  assert.equal(e.context.paytefLoading.value,false);
});

function comprobadorTarjeta({ estado = 'DESCONOCIDO', errorSesion = null } = {}) {
  const ticketSource=fs.readFileSync(require.resolve('../src/views/TicketView.vue'),'utf8');
  const inicio=ticketSource.indexOf('async function comprobarPagoActual() {');
  const fin=ticketSource.indexOf('\n    async function salirCobroActual()',inicio);
  const calls=[];
  const context={
    paytefLoading:vue.ref(false),currentIdTicket:vue.ref(12345),estadoComprobacion:vue.ref(''),mensajeComprobacion:vue.ref(''),
    paymentModal:vue.ref(true),cerrandoCobroResuelto:false,sesionCobro:'sesion-prueba',
    t:(_key,fallback)=>fallback,
    actualizarSesionCobro:async()=>{calls.push('sesion');if(errorSesion)throw errorSesion;},
    axios:{post:async(url,body)=>{calls.push({url,body});return {data:{ok:true,estado}};}},
  };
  const check=vm.runInNewContext('('+ticketSource.slice(inicio,fin).trim()+')',context);
  return {context,calls,check};
}

test('tarjeta sola valida la sesión antes de consultar y permite recuperar un bloqueo',async()=>{
  const e=comprobadorTarjeta({errorSesion:Object.assign(Error('Otra pantalla mantiene el ticket'),{sesionCobro:true})});
  await e.check();assert.equal(e.context.estadoComprobacion.value,'EN_USO');
  assert.match(e.context.mensajeComprobacion.value,/Otra pantalla/);assert.equal(e.calls.length,1);
  assert.equal(e.context.paytefLoading.value,false);
});

test('tarjeta sola confirma o descarta el ticket recuperado sin repetir el cargo',async()=>{
  for(const estado of ['COBRADO','ANULADO','CANCELADO']){
    const e=comprobadorTarjeta({estado});await e.check();
    assert.equal(e.calls[0],'sesion');assert.equal(e.calls[1].body.accion,'COMPROBAR');
    assert.equal(e.context.currentIdTicket.value,null);assert.equal(e.context.paymentModal.value,false);
    assert.equal(e.calls.filter(c=>c?.body?.accion==='COBRAR').length,0);
  }
});

test('recuperar una solicitud antigua usa la sesión y conexión de la pestaña nueva',async()=>{
  const f=fixture(async()=>response('PREPARADO'),{idPago:'payment-1234567890',solicitud:{idTicket:12345,sesionCobro:'sesion-antigua-123456',conexionId:'conexion-antigua'}},false);
  await f.api.recover();
  const preparacion=f.requests.find(p=>p.accion==='PREPARAR');
  assert.equal(preparacion.sesionCobro,'payment-1234567890');assert.equal(preparacion.conexionId,'conexion-nueva');
  assert.equal(f.api.ready.value,true);f.stop();
});

test('si otra pantalla mantiene el cobro se ofrece recuperar sin habilitar cobro ni anulación',async()=>{
  let ocupada=true;
  const f=fixture(async()=>response('PREPARADO'),undefined,true,false,{sesion:async()=>{
    if(ocupada)throw Error('Este ticket está abierto en otra pantalla');return {ok:true};
  }});
  await new Promise(setImmediate);
  assert.equal(f.api.ready.value,false);assert.match(f.api.error.value,/otra pantalla/);
  await f.api.primaryAction();assert.ok(!f.requests.some(r=>r.accion==='TARJETA'||r.accion==='CANCELAR'));
  ocupada=false;await f.api.recover();
  assert.equal(f.api.ready.value,true);assert.equal(f.api.error.value,'');f.stop();
});

test('el botón principal de un resultado incierto solo comprueba',async()=>{
  const f=fixture(async()=>response('TARJETA_INCIERTA'));
  await f.api.recover();assert.equal(f.api.primaryLabel.value,'Comprobar tarjeta');
  await f.api.primaryAction();assert.ok(f.requests.some(r=>r.accion==='ESTADO'));
  assert.ok(!f.requests.some(r=>r.accion==='TARJETA'));f.stop();
});

test('un resultado no cobrado ofrece reintentar sin volver a pedir efectivo',async()=>{
  const f=fixture(async body=>response(body.accion==='TARJETA'?'EFECTIVO_PENDIENTE':body.accion==='FINALIZAR'?'FINALIZADO':'PREPARADO',{efectivoRecibido:true}));
  await f.api.recover();assert.equal(f.api.primaryLabel.value,'Reintentar tarjeta');
  assert.equal(f.api.payment.value.efectivoCobrado,true);
  await f.api.primaryAction();assert.equal(f.requests.filter(r=>r.accion==='TARJETA').length,1);
  assert.equal(f.requests.filter(r=>r.accion==='FINALIZAR').length,1);f.stop();
});

test('una operación activa del mismo ticket bloquea las acciones y la salida',async()=>{
  const f=fixture(async()=>response('TARJETA_EN_CURSO'),undefined,true);
  await new Promise(setImmediate);
  f.props.terminalOperation={idTicket:12345,enCurso:true};await vue.nextTick();
  assert.equal(f.api.operationActive.value,true);assert.match(f.api.primaryLabel.value,/Esperando/);
  const antes=f.requests.length;await f.api.primaryAction();assert.equal(f.requests.length,antes);
  assert.equal(await f.api.leave(),false);
  f.props.terminalOperation={idTicket:999,enCurso:true};assert.equal(f.api.operationActive.value,false);f.stop();
});

test('una devolución mixta rechazada conserva el pago sin encolar otra devolución',async()=>{
  const f=fixture(async body=>body.accion==='CANCELAR'?{ok:false,devolucionNoRealizada:true,msg:'Devolución rechazada'}:response('EFECTIVO_PENDIENTE'));
  await f.api.recover(); assert.equal(await f.api.cancel(),false);
  assert.ok(!f.events.some(e=>e[0]==='cancelacionGuardada'));
  assert.equal(f.api.payment.value.cancelacionSolicitada,false);
  assert.match(f.api.error.value,/cargo original se mantiene/);f.stop();
});

test('salir de un cobro incierto conserva la venta sin solicitar devolución', async () => {
  const f=fixture(async body=>body.accion==='PENDIENTE'?response('TARJETA_INCIERTA'):response('TARJETA_INCIERTA'));
  await f.api.recover();
  assert.equal(await f.api.leave(),true);
  assert.ok(f.events.some(e=>e[0]==='salidaGuardada'));
  assert.ok(!f.requests.some(r=>r.accion==='CANCELAR'));
  assert.equal(f.api.payment.value,null); f.stop();
});

test('comprobar un mixto sin cargo no inicia tarjeta automáticamente', async () => {
  const f=fixture(async body=>response(body.accion==='ESTADO'?'PREPARADO':'TARJETA_INCIERTA'));
  await f.api.recover(); await f.api.check();
  assert.ok(f.requests.some(r=>r.accion==='ESTADO'));
  assert.ok(!f.requests.some(r=>r.accion==='TARJETA'));
  assert.equal(f.api.payment.value.estado,'PREPARADO'); f.stop();
});

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
    assert.deepEqual(f.requests.map((r) => r.accion), ['PENDIENTE', 'PREPARAR', 'EFECTIVO', 'TARJETA', 'FINALIZAR']);
    assert.equal(f.requests[1].pago.tarjeta, 6.03);
    assert.equal(f.requests[1].idTicket, 12345);
    assert.equal(f.confirmations.length, 0);
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
    assert.ok(f.confirmations.some(c => /Devuelve manualmente 6.03/.test(c.text)));
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

test('permite salir de un cobro incierto dejando la cancelación en el backend', async () => {
  const f = fixture(body => response('TARJETA_INCIERTA', body.accion === 'CANCELAR' ? { cancelacionSolicitada: true } : {}));
  try {
    await f.api.recover();
    assert.equal(await f.api.cancel(), true);
    assert.equal(f.api.payment.value, null);
    assert.equal(f.requests.filter(r => r.accion === 'CANCELAR').length, 1);
    assert.equal(f.requests.some(r => r.accion === 'TARJETA'), false);
    assert.equal(f.storage.size, 0);
  } finally { f.stop(); }
});

test('una cancelación sin conexión queda guardada y libera la cesta', async () => {
  const f = fixture(body => { if (body.accion === 'CANCELAR') throw new Error('sin red'); return response('TARJETA_INCIERTA'); });
  try {
    await f.api.recover();
    assert.equal(await f.api.cancel(), true);
    assert.equal(f.api.payment.value, null);
    assert.equal(f.events.filter(([name]) => name === 'cancelacionGuardada').length, 1);
    assert.equal(JSON.parse(f.storage.get('toc:pagoMixto:basket-1')).cancelacionSolicitada, true);
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

test('un pago finalizado al recuperar desaparece sin pedir continuar',async()=>{
  const f=fixture(()=>response('FINALIZADO'),{idPago:'payment-1234567890'});
  try {await f.api.recover(); assert.equal(f.api.payment.value,null); assert.equal(f.api.visible.value,false);
    assert.equal(f.events.filter(([name])=>name==='resolved').length,1);
    assert.equal(f.requests.some(r=>r.accion==='TARJETA'),false);
  } finally {f.stop();}
});
test('un cobro resuelto desde otro dispositivo retira el panel sin alterar los artículos nuevos',async()=>{
  const f=fixture(()=>response('TARJETA_INCIERTA'));
  try {await f.api.recover(); f.props.basket.lista=[{nombre:'nuevo artículo'}];
    f.handlers['cobro:resuelto'](response('FINALIZADO'));
    assert.equal(f.api.payment.value,null); assert.equal(f.props.basket.lista[0].nombre,'nuevo artículo');
    assert.equal(f.events.filter(([name])=>name==='resolved').length,1);
  } finally {f.stop();}
});

test('volver de una sesión mixta rechazada no modifica ni encola la salida del otro dispositivo',async()=>{
  const guardado={idPago:'payment-1234567890',solicitud:{idTicket:12345}};
  const f=fixture(async()=>response('PREPARADO'),guardado,true,false,{sesion:async()=>{throw Error('Otra pantalla mantiene el cobro');}});
  await new Promise(setImmediate);assert.equal(f.api.ready.value,false);
  assert.equal(await f.api.leave(),true);
  assert.ok(!f.events.some(e=>e[0]==='salidaGuardada'||e[0]==='cancelacionGuardada'));
  assert.ok(!f.requests.some(r=>r.accion==='CANCELAR'||r.accion==='DESVINCULAR'));
  assert.ok(f.storage.has('toc:pagoMixto:basket-1'));f.stop();
});
test('volver de una sesión normal bloqueada no encola anulación ni desvinculación',async()=>{
  const e=comprobadorTarjeta();e.context.estadoComprobacion.value='EN_USO';
  e.context.guardarSalidaCobro=()=>{throw Error('No debe modificar otro cobro');};
  const codigo=fs.readFileSync(require.resolve('../src/views/TicketView.vue'),'utf8');
  const inicio=codigo.indexOf('async function salirCobroActual() {'),fin=codigo.indexOf('\n    onMounted(',inicio);
  await vm.runInNewContext('('+codigo.slice(inicio,fin).trim()+')',e.context)();
  assert.equal(e.context.currentIdTicket.value,null);
  assert.equal(e.calls.filter(c=>c?.body).length,0);
});

test('mixto sin datáfono no prepara ticket ni confirma efectivo y libera la pantalla', async () => {
  const f = fixture(() => noPending, undefined, false, false, { disponibilidad: async () => { throw Error('Datáfono apagado'); } });
  try {
    await f.api.recover(); f.api.cash.value = 4;
    await f.api.run();
    assert.equal(f.api.payment.value, null);
    assert.equal(f.api.busy.value, false);
    assert.equal(f.api.error.value, "");
    assert.deepEqual(f.confirmations.at(-1), ["Datáfono no disponible", "Datáfono apagado", "warning"]);
    assert.deepEqual(f.requests.map(r => r.accion), ['PENDIENTE']);
    assert.equal(f.storage.size, 0);
  } finally { f.stop(); }
});

test('mixto cancelado conserva su ticket si el datáfono no está disponible al reintentar', async () => {
  const f = fixture(() => response('PREPARADO', {efectivoRecibido:true}), undefined, false, false,
    { disponibilidad: async () => { throw Error('Sin conexión'); } });
  try {
    await f.api.recover(); await f.api.run();
    assert.equal(f.api.payment.value.estado, 'PREPARADO');
    assert.equal(f.api.busy.value, false);
    assert.equal(f.api.error.value, "");
    assert.deepEqual(f.confirmations.at(-1), ["Datáfono no disponible", "Sin conexión", "warning"]);
    assert.equal(f.requests.some(r => ['TARJETA','EFECTIVO','CANCELAR'].includes(r.accion)), false);
  } finally { f.stop(); }
});

test('la disponibilidad no bloquea comprobar un mixto incierto ni finalizar uno cobrado', async () => {
  let disponible = 0;
  const f = fixture(body => response(body.accion === 'PENDIENTE' ? 'TARJETA_INCIERTA' : body.accion === 'ESTADO' ? 'EFECTIVO_PENDIENTE' : 'FINALIZADO', {efectivoRecibido:true}),
    undefined, false, false, { disponibilidad: async () => { disponible++; throw Error('Sin conexión'); } });
  try {
    await f.api.recover(); await f.api.primaryAction();
    assert.equal(disponible, 0);
    assert.equal(f.requests.some(r => r.accion === 'TARJETA'), false);
    assert.deepEqual(f.events.at(-1), ['paid',12345]);
  } finally { f.stop(); }
});

test('comprobación previa acotada rechaza apagado, timeout y respuestas no válidas', async () => {
  const text = fs.readFileSync(require.resolve('../src/services/sockets.js'),'utf8');
  const fn = text.match(/export async function comprobarDisponibilidadDatafono\(\) \{[\s\S]*?\n\}/)[0].replace('export ', '');
  for (const result of ['OFFLINE', undefined, Error('timeout'), 'ONLINE']) {
    const calls = [];
    const check = vm.runInNewContext('(' + fn + ')', {axios:{post:async (...args) => {
      calls.push(args); if (result instanceof Error) throw result; return {data:result};
    }}});
    if (result === 'ONLINE') await check(); else await assert.rejects(check(), /No se puede conectar/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'datafonoInt/comprobarDisponibilidad');
    assert.equal(calls[0][2].timeout, 7000);
    assert.equal(calls[0][2].headers["Content-Type"], "application/json");
  }
});

test('tarjeta normal sin datáfono no reserva ID ni crea ticket y permite volver', async () => {
  const text = fs.readFileSync(require.resolve('../src/views/TicketView.vue'),'utf8');
  const fn = text.slice(text.indexOf('async function cobrar(fm) {'), text.indexOf('    async function getProximoId(method) {')).trim();
  const calls = [];
  const context = {
    mixedBlocked:vue.ref(false), mixedBusy:vue.ref(false), paytefLoading:vue.ref(false),
    currentIdTicket:vue.ref(null), estadoComprobacion:vue.ref(''),
    store:{dispatch:()=>{}}, Swal:{fire:async (...args)=>calls.push(args)},
    comprobarDisponibilidadDatafono:async()=>{throw Error('Datáfono apagado');},
    getProximoId:async()=>calls.push('id'), cobrarConPaytef:async()=>calls.push('cargo'),
  };
  await vm.runInNewContext('(' + fn + ')', context)('DATAFONO_INTEGRADO');
  assert.equal(context.paytefLoading.value,false);
  assert.equal(context.currentIdTicket.value,null);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],'Datáfono no disponible');
});

test('comandero escucha resultados y errores con los nombres actuales del backend', () => {
  const text = fs.readFileSync(require.resolve('../src/services/sockets.js'),'utf8');
  const section = text.slice(text.indexOf('function recibirResultadoDatafono'),text.indexOf('socket.on("consultaPaytefRefund"'));
  const handlers={}, calls=[];
  vm.runInNewContext(section,{socket:{on:(event,fn)=>handlers[event]=fn},store:{dispatch:(...args)=>calls.push(args)}});
  handlers.consultaDatafonoInt({valid:false,lost:true});
  assert.deepEqual(calls.pop(),['Datafono/setEstado','PERDIDA']);
  handlers.consultaDatafonoInt({RespTransaccionDatafonoInt:true,aprobada:true});
  assert.deepEqual(calls.pop(),['Datafono/setEstado','APROBADA']);
  handlers.procesoDatafonoInt({proceso:'errorConexion'});
  assert.deepEqual(calls.pop(),['Datafono/setProceso','errorConexion']);
  handlers.errorConexionDatafonoInt();
  assert.deepEqual(calls.pop(),['Datafono/setProceso','resultadoIncierto']);
  assert.deepEqual(calls.pop(),['Datafono/setEstado','PERDIDA']);
});


test('la disponibilidad envía JSON con Axios real y evita el rechazo de Fastify', async () => {
  const text = fs.readFileSync(require.resolve('../src/services/sockets.js'),'utf8');
  const fn = text.match(/export async function comprobarDisponibilidadDatafono\(\) \{[\s\S]*?\n\}/)[0].replace('export ', '');
  const axiosReal = require('axios');
  let consultas = 0;
  const check = vm.runInNewContext('(' + fn + ')', {axios:{post: (url, data, config) =>
    axiosReal.post(url, data, {...config, adapter: async request => {
      consultas++;
      assert.equal(request.headers.get('Content-Type'), 'application/json');
      assert.equal(request.data, 'null');
      return {data:'ONLINE',status:200,statusText:'OK',headers:{},config:request};
    }})
  }});
  await check(); assert.equal(consultas, 1);
});
