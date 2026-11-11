// Guarda la sesión (token + datos del usuario) en el navegador
const CLAVE = "hambre_sesion";

export function getSesion() {
  try { return JSON.parse(localStorage.getItem(CLAVE)); }
  catch { return null; }
}
export const guardarSesion = sesion => localStorage.setItem(CLAVE, JSON.stringify(sesion));
export const cerrarSesion = () => localStorage.removeItem(CLAVE);
