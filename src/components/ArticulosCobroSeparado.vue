<template>
  <div class="borrador">
    <div class="borrador-paneles" :class="{ 'viendo-lista': revisando }">
      <section class="catalogo" aria-label="Catálogo">
        <div class="catalogo-cabecera">
          <label class="buscador">
            <span class="visually-hidden">Buscar artículos</span>
            <MDBIcon icon="search" aria-hidden="true" />
            <input v-model="busqueda" type="search" placeholder="Buscar artículos" :disabled="ocupado" />
          </label>
        </div>
        <nav v-if="!busqueda.trim() && grupos.length" class="categorias" aria-label="Categorías">
          <button v-for="(grupo, i) in grupos" :key="i" type="button" class="categoria" :aria-pressed="grupoActivo === i"
            :disabled="ocupado" @click="grupoActivo = i">{{ grupo.nombre }}</button>
        </nav>
        <div class="catalogo-scroll">
          <p v-if="!articulos.length" class="text-muted">No hay artículos disponibles.</p>
          <div v-else class="productos">
            <button v-for="articulo in articulos" :key="articulo.idArticle" type="button"
              class="producto" :disabled="ocupado" @click="elegir(articulo)">
              <span class="producto-nombre">{{ articulo.nombreArticulo }}</span>
              <span v-if="articulo.precioConIva != null" class="producto-precio">{{ precioCatalogo(articulo.precioConIva) }}</span>
              <small v-if="articulo.esMenu" class="producto-menu">Menú</small>
            </button>
          </div>
        </div>
      </section>
      <section class="resumen" aria-label="Por añadir">
        <header class="resumen-cabecera">
          <h5><MDBIcon icon="shopping-basket" class="me-2" aria-hidden="true" />Por añadir</h5>
          <span class="resumen-cantidad">{{ cantidad }}</span>
        </header>
        <div class="catalogo-scroll">
          <p v-if="!filas.length" class="text-muted">Elige artículos del catálogo.</p>
          <ul v-else class="list-unstyled mb-0">
            <li v-for="fila in filas" :key="fila.clave" class="fila">
              <div class="fila-nombre">
                <strong><span class="fila-unidades">{{ fila.unidades }} ×</span> {{ fila.datos.nombre }}</strong>
                <small v-if="detalleArticulo(fila.datos)" class="d-block text-muted">{{ detalleArticulo(fila.datos) }}</small>
                <small v-if="fila.intento" class="d-block text-muted">Guardado por comprobar</small>
              </div>
              <div class="d-flex gap-1">
                <button type="button" class="btn btn-outline-dark cantidad" :disabled="ocupado || !!fila.intento"
                  :aria-label="'Quitar ' + fila.datos.nombre" @click="quitar(fila)">−</button>
                <button type="button" class="btn btn-outline-dark cantidad" :disabled="ocupado || !!fila.intento"
                  :aria-label="'Añadir ' + fila.datos.nombre" @click="fila.unidades++">+</button>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
    <footer class="acciones">
      <p v-if="error" class="borrador-error text-danger mb-0" role="alert">{{ error }}</p>
      <span class="borrador-contador" :class="{ 'visually-hidden': revisando }" aria-live="polite">
        <MDBIcon icon="shopping-basket" aria-hidden="true" /> Por añadir: {{ cantidad }}
      </span>
      <div class="botones">
        <MDBBtn outline="dark" class="volver" :disabled="ocupado" @click="$emit('volver')">
          <MDBIcon icon="arrow-left" aria-hidden="true" /> Volver
        </MDBBtn>
        <MDBBtn outline="primary" class="revisar" :disabled="ocupado" @click="revisando = !revisando">
          {{ revisando ? "Seguir buscando" : "Revisar" }}
        </MDBBtn>
        <MDBBtn color="success" class="guardar" :disabled="ocupado || (!cantidad && !pendienteActualizar)" @click="guardar">
          <MDBIcon :icon="cantidad ? 'cart-plus' : 'sync-alt'" aria-hidden="true" />
          {{ guardando ? "Guardando…" : (cantidad ? "Añadir a la cesta" : "Actualizar") }}
        </MDBBtn>
      </div>
    </footer>
  </div>
  <Teleport to="body">
    <SuplementosModal v-model="suplementosAbiertos" class="catalogo-suplementos"
      :supl-article="opciones" @confirmarSuplementos="preparar({ arraySuplementos: $event })" />
    <MDBModal v-model="menuAbierto" staticBackdrop :keyboard="false" size="lg" class="catalogo-menu" aria-label="Configurar menú">
      <MenuModal v-if="menuAbierto" v-model="menuAbierto" :menu-selected="elegido"
        :supl-by-family="opcionesPorFamilia" suplementos-en-portal @confirmarMenu="confirmarMenu" />
    </MDBModal>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { MDBBtn, MDBIcon, MDBModal } from "mdb-vue-ui-kit";
import axios from "axios";
import MenuModal from "./MenuModal.vue";
import SuplementosModal from "./SuplementosModal.vue";
import { articulosPorUnidad, claveConfiguracion, contieneInstancia, detalleArticulo } from "@/composables/cobroSeparadoArticulos";

const props = defineProps({
  idCesta: { type: [String, Number], required: true },
  trabajador: { type: Object, default: null },
  antesDeGuardar: { type: Function, required: true },
  actualizarMesa: { type: Function, required: true },
});
const emit = defineEmits(["volver", "confirmado"]);
const store = useStore();
const busqueda = ref("");
const grupoActivo = ref(0);
const filas = ref([]);
const cantidad = computed(() => filas.value.reduce((total, fila) => total + fila.unidades, 0));
const revisando = ref(false);
const guardando = ref(false);
const pendienteActualizar = ref(false);
const cargandoOpciones = ref(false);
const suplementosAbiertos = ref(false);
const menuAbierto = ref(false);
const ocupado = computed(() => guardando.value || cargandoOpciones.value || suplementosAbiertos.value || menuAbierto.value);
const error = ref("");
const elegido = ref(null);
const opciones = ref([]);
const opcionesPorFamilia = computed(() => opciones.value.reduce((grupos, opcion) => {
  const familia = opcion.familia || "Sin familia";
  (grupos[familia] ||= []).push(opcion);
  return grupos;
}, Object.create(null)));
// Lee las categorías del teclado del comandero y aplica el mismo filtro a sus submenús.
const grupos = computed(() => store.state.Categories.arrayCategories.flatMap((categoria) => {
  const submenus = (categoria.arraySubmenus || []).map((submenu) => ({
    nombre: categoria.nombre + " · " + submenu.nombre,
    articulos: articulosPorUnidad(submenu.arrayTeclas),
  }));
  return [{ nombre: categoria.nombre, articulos: articulosPorUnidad(categoria.arrayTeclas) }, ...submenus];
}).filter((grupo) => grupo.articulos.length));

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
// Formatea el precio del teclado y omite importes inválidos.
function precioCatalogo(precio) {
  const importe = Number(precio);
  return Number.isFinite(importe) ? moneda.format(importe) : "";
}

// Quita tildes y diferencias de mayúsculas para que no afecten a la búsqueda.
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
// Busca en todas las categorías y muestra una sola tarjeta por artículo.
const articulos = computed(() => {
  const consulta = normalizar(busqueda.value);
  const lista = consulta
    ? grupos.value.flatMap((grupo) => grupo.articulos).filter((item) => normalizar(item.nombreArticulo).includes(consulta))
    : (grupos.value[grupoActivo.value] ?? grupos.value[0])?.articulos || [];
  return [...new Map(lista.map((item) => [item.idArticle, item])).values()]
    .sort((a, b) => a.nombreArticulo.localeCompare(b.nombreArticulo, "es", { sensitivity: "base" }));
});

// Carga las opciones antes de abrir el modal de menú o de suplementos.
async function elegir(articulo) {
  if (ocupado.value) return;
  elegido.value = articulo;
  error.value = "";
  if (!articulo.suplementos?.length) {
    preparar();
    return;
  }
  cargandoOpciones.value = true;
  try {
    const { data } = await axios.post("articulos/getSuplementos", { arrayIdSuplementos: articulo.suplementos });
    if (!Array.isArray(data)) throw new Error();
    opciones.value = data;
    if (articulo.esMenu) menuAbierto.value = true;
    else suplementosAbiertos.value = true;
  } catch {
    error.value = "No se pudieron cargar las opciones de este artículo.";
  } finally {
    cargandoOpciones.value = false;
  }
}

// Convierte las opciones agrupadas por familia en la lista que recibe el servidor.
function confirmarMenu(seleccion) {
  preparar({ articulosMenu: Object.values(seleccion).flat().filter(Boolean) });
}

// Agrupa únicamente configuraciones idénticas en «Por añadir», a la espera de confirmar.
function preparar(configuracion = {}) {
  const articulo = elegido.value;
  const datos = { idArticulo: articulo.idArticle, nombre: articulo.nombreArticulo, gramos: 0, ...configuracion };
  const clave = claveConfiguracion(datos);
  const previa = filas.value.find((fila) => fila.clave === clave);
  if (previa) previa.unidades++;
  else filas.value.push({ clave, datos, unidades: 1, intento: null });
  suplementosAbiertos.value = false;
  menuAbierto.value = false;
}

// Descuenta una unidad del borrador y retira la línea cuando queda vacía.
function quitar(fila) {
  if (--fila.unidades === 0) filas.value.splice(filas.value.indexOf(fila), 1);
}

// Aplica la comprobación del ticket activo antes de enviar el borrador y refresca la mesa al terminar.
async function guardar() {
  if (ocupado.value) return;
  const trabajador = props.trabajador;
  if (!trabajador) {
    error.value = "Selecciona un trabajador para añadir productos.";
    return;
  }
  guardando.value = true;
  error.value = "";
  try {
    if (filas.value.length && !(await props.antesDeGuardar())) return;
    while (filas.value.length) {
      const fila = filas.value[0];
      // Comprueba si el intento anterior llegó al servidor antes de volver a enviar esa unidad.
      if (fila.intento && contieneInstancia(await props.actualizarMesa(), fila.intento)) {
        fila.intento = null;
        quitar(fila);
        continue;
      }
      fila.intento ||= globalThis.crypto?.randomUUID?.() || `comandero-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      pendienteActualizar.value = true;
      const { data } = await axios.post("teclado/clickTeclaArticulo", {
        ...fila.datos,
        idCesta: props.idCesta,
        unidades: 1,
        menu: "COMANDERO",
        instancia: { instanceId: fila.intento, printed: false },
      }, {
        headers: {
          "X-Source-Program": "COMANDERO",
          article: encodeURIComponent(fila.datos.nombre),
          worker: encodeURIComponent(trabajador.nombre),
        },
      });
      if (!data) throw new Error();
      fila.intento = null;
      quitar(fila);
    }
  } catch {
    error.value = "No se completó el guardado. Puedes reintentar los artículos que quedan.";
  } finally {
    try {
      if (pendienteActualizar.value) {
        await props.actualizarMesa();
        pendienteActualizar.value = false;
      }
      if (!error.value && !filas.value.length) emit("confirmado");
    } catch {
      error.value = "No se pudo actualizar la mesa. Vuelve a intentarlo.";
    } finally {
      guardando.value = false;
    }
  }
}
</script>

<style scoped>
.catalogo-menu { z-index: 1056; }
.catalogo-suplementos { z-index: 1057; }

.borrador {
  --borde: #e2e8f0;
  --texto: #172033;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: .75rem;
  height: min(68dvh, 650px);
  color: var(--texto);
}

.borrador-paneles {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: .75rem;
  min-height: 0;
}

.catalogo, .resumen {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--borde);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, .04);
}

.catalogo-cabecera, .resumen-cabecera {
  padding: .65rem .75rem;
  border-bottom: 1px solid var(--borde);
}

.catalogo-cabecera { background: #eff6ff; }
.buscador { position: relative; display: block; }
.buscador i { position: absolute; top: 50%; left: .8rem; transform: translateY(-50%); color: #1d4ed8; }
.buscador input {
  width: 100%;
  min-height: 44px;
  padding: .45rem .75rem .45rem 2.25rem;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #fff;
  color: var(--texto);
  font-size: 1rem;
}

.resumen-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  background: #ecfdf5;
  color: #047857;
}
.resumen-cabecera h5 { margin: 0; font-size: 1rem; font-weight: 800; }
.resumen-cantidad {
  display: grid;
  min-width: 34px;
  height: 28px;
  padding-inline: .3rem;
  place-items: center;
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
}

.categorias { display: flex; gap: .4rem; overflow-x: auto; padding: .6rem .75rem .4rem; flex-shrink: 0; }
.categoria {
  flex: 0 0 auto;
  min-height: 44px;
  max-width: 100%;
  padding: .35rem .8rem;
  border: 1px solid var(--borde);
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
}
.categoria[aria-pressed="true"] { border-color: #bfdbfe; background: #e8f0fe; color: #1d4ed8; }

.catalogo-scroll { overflow: auto; flex: 1; min-height: 0; padding: .7rem .75rem; overscroll-behavior: contain; }
.productos { display: grid; gap: .55rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.producto {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: space-between;
  align-items: baseline;
  gap: .35rem;
  padding: .65rem .7rem;
  min-height: 72px;
  border: 1px solid var(--borde);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  box-shadow: 0 2px 4px rgba(15, 23, 42, .06);
}
.producto:not(:disabled):hover { border-color: #93c5fd; background: #f8fbff; }
.producto:not(:disabled):active { background: #eff6ff; }
.producto-nombre { flex: 1 1 6rem; color: #343a40; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
.producto-precio { color: #1a7a4a; font-weight: 800; white-space: nowrap; }
.producto-menu { padding: .1rem .35rem; border-radius: 6px; background: #dbeafe; color: #1e40af; font-weight: 700; }

.fila { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem 0; border-bottom: 1px dashed var(--borde); }
.fila-nombre { min-width: 0; overflow-wrap: anywhere; }
.fila-unidades { color: #047857; white-space: nowrap; }
.cantidad { min-width: 44px; min-height: 44px; padding-inline: .25rem; border: 1px solid var(--borde); border-radius: 9px; color: #334155; background: #f8fafc; }

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  align-items: center;
  justify-content: space-between;
  padding: .55rem .65rem max(.55rem, env(safe-area-inset-bottom));
  border: 1px solid var(--borde);
  border-radius: 12px;
  background: #fff;
}
.botones { display: flex; flex-wrap: wrap; gap: .45rem; align-items: stretch; flex: 1; }
.borrador-error { flex-basis: 100%; }
.borrador-contador { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; white-space: nowrap; }
.botones .btn { min-height: 44px; border-radius: 10px; font-weight: 800; text-transform: none; }
.botones .volver { margin-inline-end: auto; }
.botones .revisar { display: none; }
.botones .guardar { border: 1px solid #b8e6d0; background: #e6f7ef; color: #1a7a4a; }
.botones .guardar:not(:disabled):hover { border-color: #8fd4b4; background: #d4f0e2; }
.producto:disabled, .categoria:disabled { opacity: .6; }

@media (max-width: 959.98px) {
  .productos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 767.98px) {
  .borrador-paneles { grid-template-columns: minmax(0, 1fr); }
  .borrador-paneles:not(.viendo-lista) .resumen, .borrador-paneles.viendo-lista .catalogo { display: none; }
  .borrador-contador { position: static; width: auto; height: auto; clip-path: none; overflow: visible; color: #047857; font-weight: 800; }
  .botones { flex-basis: 100%; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); }
  .botones .revisar { display: block; }
  .botones .volver { grid-row: 2; grid-column: 1 / -1; margin-inline-end: 0; }
  .botones .btn { padding-inline: .35rem; white-space: normal; }
}

@media (max-width: 576px) {
  .borrador { height: 100%; gap: .45rem; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .borrador { height: 73dvh; }
}
</style>
