// Catálogo de cafeterías: filtros, búsqueda y tarjetas
import { api } from "./api.js";
import { $, escapar, dibujarEstrellas } from "./ui.js";

let cafeterias = [];
let facultades = [];
let facultadSel = "";

export const getCafeterias = () => cafeterias;
const nombreFacultad = codigo => facultades.find(f => f.codigo === codigo)?.nombre ?? codigo;

export async function cargarCafeterias() {
  cafeterias = await api.cafeterias();
  mostrarCafeterias();
}

export function initFiltros(lista, { alCalificar, alVerResenas }) {
  facultades = lista;
  $("botonesFacultades").innerHTML = [{ codigo: "", nombre: "Todas las facultades" }, ...lista]
    .map(f => `<button type="button" class="chip" data-codigo="${escapar(f.codigo)}" title="${escapar(f.nombre)}">${escapar(f.codigo || "Todas")}</button>`)
    .join("");

  $("botonesFacultades").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (chip) seleccionar(chip.dataset.codigo);
  });
  $("filtroFacultad").addEventListener("change", e => seleccionar(e.target.value));
  $("busqueda").addEventListener("input", mostrarCafeterias);

  $("listaCafeterias").addEventListener("click", e => {
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.accion === "calificar") alCalificar(id);
    else alVerResenas(id);
  });
  seleccionar("");
}

function seleccionar(codigo) {
  facultadSel = codigo;
  $("filtroFacultad").value = codigo;
  document.querySelectorAll("#botonesFacultades .chip")
    .forEach(chip => chip.classList.toggle("activo", chip.dataset.codigo === codigo));
  mostrarCafeterias();
}

const tarjeta = c => `
  <article class="tarjeta">
    <div class="tarjeta-cabecera"><span>🍽️</span><span class="etiqueta">${escapar(c.facultad)}</span></div>
    <div class="tarjeta-contenido">
      <h3>${escapar(c.nombre)}</h3>
      <p class="secundario">${escapar(nombreFacultad(c.facultad))}</p>
      <div class="estrellas">${dibujarEstrellas(c.promedio)}</div>
      <p><strong>${c.promedio === null ? "Sin calificaciones" : c.promedio.toFixed(1) + " / 5"}</strong>
         <span class="secundario">(${c.totalResenas} reseñas)</span></p>
      <button class="boton" data-accion="calificar" data-id="${c.id}">⭐ Calificar</button>
      <button class="boton" data-accion="ver" data-id="${c.id}">Ver reseñas</button>
    </div>
  </article>`;

function mostrarCafeterias() {
  const q = $("busqueda").value.trim().toLowerCase();
  const filtradas = cafeterias.filter(c =>
    (!facultadSel || c.facultad === facultadSel) &&
    `${c.nombre} ${nombreFacultad(c.facultad)}`.toLowerCase().includes(q));

  $("listaCafeterias").innerHTML = filtradas.length
    ? filtradas.map(tarjeta).join("")
    : `<div class="vacio"><div style="font-size:42px">🍽️</div><h3>No encontramos cafeterías</h3><p>Prueba con otra búsqueda o facultad.</p></div>`;

  $("totalFacultades").textContent = facultades.length;
  $("totalCafeterias").textContent = cafeterias.length;
  $("totalResenas").textContent = cafeterias.reduce((total, c) => total + c.totalResenas, 0);
}
