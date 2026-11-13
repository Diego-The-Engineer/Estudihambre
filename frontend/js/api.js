import { API_URL } from "./config.js";
import { getSesion, cerrarSesion } from "./session.js";

//Hace una peticion del token para hacer una sesion y verificar si el tiempo de la sesion es valida o ya expiró
async function peticion(ruta, { method = "GET", body } = {}) {
  const sesion = getSesion();
  const res = await fetch(API_URL + ruta, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sesion && { Authorization: `Bearer ${sesion.token}` })
    },
    body: body && JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && sesion) {   // token vencido o inválido
    cerrarSesion();
    window.dispatchEvent(new Event("sesion-expirada"));
  }
  if (!res.ok) throw new Error(data.error || "Error de servidor");
  return data;
}

export const api = {
  registro: datos => peticion("/auth/registro", { method: "POST", body: datos }),
  login: datos => peticion("/auth/login", { method: "POST", body: datos }),
  facultades: () => peticion("/facultades"),
  cafeterias: () => peticion("/cafeterias"),
  resenas: cafeteriaId => peticion("/resenas" + (cafeteriaId ? `?cafeteriaId=${cafeteriaId}` : "")),
  crearResena: datos => peticion("/resenas", { method: "POST", body: datos }),
  eliminarResena: id => peticion(`/resenas/${id}`, { method: "DELETE" }),
  restaurarResena: id => peticion(`/resenas/${id}/restaurar`, { method: "POST" }),
  pendientes: () => peticion("/resenas/pendientes"),
  publicarSiguiente: () => peticion("/resenas/pendientes/publicar-siguiente", { method: "POST" }),
  descartarSiguiente: () => peticion("/resenas/pendientes/descartar-siguiente", { method: "POST" })
};
