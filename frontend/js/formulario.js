// Formulario para calificar una cafetería
import { api } from "./api.js";
import { $, escapar } from "./ui.js";
import { getCafeterias } from "./cafeterias.js";
import { usuarioActual, abrirLogin } from "./auth.js";

const NIVELES = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export function initFormulario(alEnviar) {
  const opciones = '<option value="">Selecciona una calificación</option>' +
    NIVELES.map((texto, i) => `<option value="${i + 1}">${i + 1} — ${texto}</option>`).join("");
  document.querySelectorAll("select.rating").forEach(s => { s.innerHTML = opciones; });

  $("facultadResena").addEventListener("change", llenarCafeterias);

  $("formCalificacion").addEventListener("submit", async e => {
    e.preventDefault();
    if (!usuarioActual()) return abrirLogin();
    try {
      await api.crearResena(Object.fromEntries(new FormData(e.target)));
      e.target.reset();
      llenarCafeterias();
      alert("¡Gracias! Tu reseña se enviará para revisión antes de publicarse.");
      alEnviar();
    } catch (err) {
      alert(err.message);
    }
  });
}

function llenarCafeterias() {
  const facultad = $("facultadResena").value;
  const selector = $("cafeteriaResena");
  selector.disabled = !facultad;
  selector.innerHTML = facultad
    ? '<option value="">Selecciona una cafetería</option>' +
      getCafeterias().filter(c => c.facultad === facultad)
        .map(c => `<option value="${c.id}">${escapar(c.nombre)}</option>`).join("")
    : '<option value="">Primero selecciona una facultad</option>';
}

export function preseleccionar(id) {
  const cafe = getCafeterias().find(c => c.id === id);
  if (!cafe) return;
  $("facultadResena").value = cafe.facultad;
  llenarCafeterias();
  $("cafeteriaResena").value = cafe.id;
  $("formCalificacion").scrollIntoView({ behavior: "smooth" });
}
