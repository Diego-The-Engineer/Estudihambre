// Utilidades de interfaz compartidas
export const $ = id => document.getElementById(id);

export function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, l => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[l]);
}

export function dibujarEstrellas(numero) {
  const n = Math.max(0, Math.min(5, Math.round(numero || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export const opcionesFacultades = (facultades, textoVacio) =>
  `<option value="">${textoVacio}</option>` +
  facultades.map(f => `<option value="${escapar(f.codigo)}">${escapar(f.codigo)} — ${escapar(f.nombre)}</option>`).join("");
