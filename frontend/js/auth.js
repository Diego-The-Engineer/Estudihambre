// Login / registro y estado de sesión en la cabecera
import { api } from "./api.js";
import { $, escapar } from "./ui.js";
import { getSesion, guardarSesion, cerrarSesion } from "./session.js";

let modo = "login";
let alCambiarSesion = () => {};

export const usuarioActual = () => getSesion()?.usuario ?? null;

export function abrirLogin() {
  cambiarModo("login");
  $("dialogoAuth").showModal();
}

function cambiarModo(nuevo) {
  modo = nuevo;
  const registro = nuevo === "registro";
  document.querySelectorAll(".solo-registro").forEach(campo => {
    campo.hidden = !registro;
    campo.querySelector("input, select").disabled = !registro; // los deshabilitados no se validan
  });
  document.querySelectorAll(".solo-login").forEach(campo => {
    campo.hidden = registro;
    campo.querySelector("input").disabled = registro;
  });
  $("tituloAuth").textContent = registro ? "Crear cuenta" : "Iniciar sesión";
  $("cambiarModo").textContent = registro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
  $("errorAuth").textContent = "";
}

function pintarSesion() {
  const u = usuarioActual();
  $("zonaSesion").innerHTML = u
    ? `<span>👋 ${escapar(u.nombre)}${u.esAdmin ? " (admin)" : ""}</span><button class="boton" data-sesion="salir">Salir</button>`
    : `<button class="boton" data-sesion="entrar">Iniciar sesión</button>`;
}

export function initAuth(alCambiar) {
  alCambiarSesion = alCambiar;
  cambiarModo("login");
  pintarSesion();

  $("zonaSesion").addEventListener("click", e => {
    const accion = e.target.dataset.sesion;
    if (accion === "entrar") abrirLogin();
    if (accion === "salir") { cerrarSesion(); pintarSesion(); alCambiarSesion(); }
  });

  $("cambiarModo").addEventListener("click", () => cambiarModo(modo === "login" ? "registro" : "login"));
  $("cancelarAuth").addEventListener("click", () => $("dialogoAuth").close());
  window.addEventListener("sesion-expirada", () => { pintarSesion(); alCambiarSesion(); });

  $("formAuth").addEventListener("submit", async e => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    try {
      const sesion = modo === "login"
        ? await api.login({ matricula: datos.matricula, facultad: datos.facultad, clave: datos.clave })
        : await api.registro(datos);
      guardarSesion(sesion);
      e.target.reset();
      $("dialogoAuth").close();
      pintarSesion();
      alCambiarSesion();
    } catch (err) {
      $("errorAuth").textContent = err.message;
    }
  });
}
