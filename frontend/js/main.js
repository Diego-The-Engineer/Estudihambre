// Punto de entrada: conecta los módulos
import { api } from "./api.js";
import { $, opcionesFacultades } from "./ui.js";
import { initAuth } from "./auth.js";
import { initFiltros, cargarCafeterias } from "./cafeterias.js";
import { initFormulario, preseleccionar } from "./formulario.js";
import { initResenas, cargarResenas, cargarCola, verResenas, limpiarPila } from "./resenas.js";

const refrescar = () => Promise.all([cargarCafeterias(), cargarResenas(), cargarCola()]).catch(err => console.error(err));

async function iniciar() {
  try {
    const facultades = await api.facultades();
    $("filtroFacultad").innerHTML = opcionesFacultades(facultades, "Todas las facultades");
    $("facultadResena").innerHTML = opcionesFacultades(facultades, "Selecciona una facultad");
    $("authFacultad").innerHTML = opcionesFacultades(facultades, "Selecciona tu facultad");

    initAuth(() => { limpiarPila(); refrescar(); });
    initFiltros(facultades, { alCalificar: preseleccionar, alVerResenas: verResenas });
    initFormulario(refrescar);
    initResenas(refrescar);
    await refrescar();
  } catch (err) {
    console.error(err);
    $("listaCafeterias").innerHTML =
      '<div class="vacio"><h3>No pudimos conectar con el servidor</h3><p>Si es la primera visita del día, Render puede tardar ~1 minuto en despertar. Recarga la página.</p></div>';
  }
}

iniciar();
