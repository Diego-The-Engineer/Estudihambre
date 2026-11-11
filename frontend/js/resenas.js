// Reseñas publicadas, pila de eliminadas (LIFO) y cola de moderación (FIFO)
import { api } from "./api.js";
import { $, escapar, dibujarEstrellas } from "./ui.js";
import { usuarioActual } from "./auth.js";

const pilaEliminadas = [];       // PILA (LIFO): ids para "deshacer"
let cafeteriaFiltro = null;
let alCambiar = async () => {};

export const limpiarPila = () => { pilaEliminadas.length = 0; };

// Ejecuta una acción y refresca toda la pantalla
async function accion(fn) {
  try { await fn(); await alCambiar(); }
  catch (err) { alert(err.message); }
}

export function initResenas(refrescar) {
  alCambiar = refrescar;

  $("listaResenas").addEventListener("click", e => {
    const btn = e.target.closest("[data-eliminar]");
    if (!btn) return;
    const id = btn.dataset.eliminar;
    accion(async () => { await api.eliminarResena(id); pilaEliminadas.push(id); });
  });

  $("btnDeshacer").addEventListener("click", () => {
    const id = pilaEliminadas.at(-1);
    if (id) accion(async () => { await api.restaurarResena(id); pilaEliminadas.pop(); });
  });

  $("btnTodas").addEventListener("click", () => { cafeteriaFiltro = null; alCambiar(); });
  $("btnPublicar").addEventListener("click", () => accion(() => api.publicarSiguiente()));
  $("btnDescartar").addEventListener("click", () => accion(() => api.descartarSiguiente()));
}

export async function verResenas(cafeteriaId) {
  cafeteriaFiltro = cafeteriaId;
  await cargarResenas();
  $("resenas").scrollIntoView({ behavior: "smooth" });
}

const promedio = r => (r.sabor + r.precio + r.limpieza + r.atencion) / 4;
const detalle = r => `Sabor ${r.sabor} · Precio ${r.precio} · Limpieza ${r.limpieza} · Atención ${r.atencion}`;

const tarjeta = r => `
  <article class="resena">
    <div class="estrellas">${dibujarEstrellas(promedio(r))}</div>
    <strong>${escapar(r.cafeteria)}</strong>
    <p class="secundario">${detalle(r)}</p>
    ${r.comentario ? `<p>${escapar(r.comentario)}</p>` : ""}
    <p class="secundario">${escapar(r.autor)} · ${r.fecha}</p>
    ${r.propia || usuarioActual()?.esAdmin ? `<button class="boton" data-eliminar="${r.id}">🗑️ Eliminar</button>` : ""}
  </article>`;

export async function cargarResenas() {
  const lista = await api.resenas(cafeteriaFiltro);
  $("listaResenas").innerHTML = lista.length
    ? lista.map(tarjeta).join("")
    : '<div class="vacio">Aún no hay reseñas publicadas.</div>';
  $("btnTodas").hidden = !cafeteriaFiltro;
  $("subtituloResenas").textContent = cafeteriaFiltro && lista.length
    ? `Mostrando reseñas de ${lista[0].cafeteria}.`
    : "Las opiniones más recientes de los estudiantes.";
  $("totalPila").textContent = pilaEliminadas.length;
}

// Panel de moderación: solo para administradores
export async function cargarCola() {
  const admin = usuarioActual()?.esAdmin;
  $("panelCola").hidden = !admin;
  if (!admin) return;
  const pendientes = await api.pendientes();
  $("totalCola").textContent = pendientes.length;
  $("listaPendientes").innerHTML = pendientes.map((r, i) => `
    <div class="pendiente">
      <strong>${i === 0 ? "▶ Siguiente: " : ""}${escapar(r.cafeteria)}</strong><br>
      <span class="secundario">${detalle(r)}</span><br>
      ${escapar(r.comentario || "Sin comentario")}<br>
      <span class="secundario">${escapar(r.autor)}</span>
    </div>`).join("");
}
