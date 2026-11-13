const router = require("express").Router();
const pool = require("../db");
const { requireAuth, authOpcional } = require("../middleware/auth");
const { contieneGroserias } = require("../utils/groserias");

// Datos de una reseña. $1 = matrícula de quien consulta (0 si es visitante)
const SELECT = `
  SELECT r.id_resena AS id, c.nombre AS cafeteria,
         r.rating_sabor AS sabor, r.rating_precio AS precio,
         r.rating_limpieza AS limpieza, r.rating_atencion AS atencion,
         r.comentario,
         COALESCE(NULLIF(r.autor, ''), 'Hambre anónima') AS autor,
         to_char(r.publicacion, 'DD/MM/YYYY') AS fecha,
         (r.matricula = $1) AS propia
  FROM resena r JOIN cafeteria c ON c.id_cafeteria = r.id_cafeteria`;

// Reseñas publicadas, de la más reciente a la más antigua, LIFO
router.get("/", authOpcional, async (req, res) => {
  const params = [req.user?.matricula ?? 0];
  let filtro = "";
  if (req.query.cafeteriaId) {
    const id = Number(req.query.cafeteriaId);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
    params.push(id);
    filtro = "AND r.id_cafeteria = $2";
  }
  const { rows } = await pool.query(
    `${SELECT} WHERE r.estado = 'publicada' ${filtro} ORDER BY r.id_resena DESC LIMIT 50`, params);
  res.json(rows);
});

// Nueva reseña
router.post("/", requireAuth, async (req, res) => {
  const { cafeteriaId, sabor, precio, limpieza, atencion, comentario, autor } = req.body;

  //Validar datos 
  const ratings = [sabor, precio, limpieza, atencion].map(Number);
  if (!Number.isInteger(Number(cafeteriaId)) || ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) {
    return res.status(400).json({ error: "Datos de la reseña inválidos" });
  }

  // detectar si hay palabrotas, el metodo filter de javascript permite ver si hay una groseria de acuerdo al dataset de malas palabras, entonces si encuentra una con el metodo filter(), modifica el arreglo y como ya no está vacío, entonces hay una grosería en el texto, seria lo mismo que un ciclo for checando los indices de acuerdo al string y ver si en una posicion i, hay una mala palabra
  const campos = { nombreUsuario: req.user.nombre, autor: autor || "", comentario: comentario || "" };
  const camposInvalidos = Object.keys(campos).filter(c => contieneGroserias(String(campos[c])));
  if (camposInvalidos.length > 0) {
    return res.status(400).json({ error: "Se detectó lenguaje inapropiado.", campos: camposInvalidos });
  }

  // insertar reseña
  const { rows } = await pool.query(
    `INSERT INTO resena (matricula, id_cafeteria, rating_sabor, rating_precio,
                         rating_limpieza, rating_atencion, comentario, autor, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'publicada')
     RETURNING id_resena AS id`,
    [req.user.matricula, Number(cafeteriaId), ...ratings,
     String(comentario || "").slice(0, 500), String(autor || "").slice(0, 35)]);
  res.status(201).json(rows[0]);
});

// Eliminar 
router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const { rowCount } = await pool.query(
    `UPDATE resena SET estado = 'eliminada'
     WHERE id_resena = $1 AND estado = 'publicada' AND matricula = $2`,
    [id, req.user.matricula]);
  if (!rowCount) return res.status(404).json({ error: "Reseña no encontrada" });
  res.json({ ok: true });
});

// Restaurar la última eliminada 
router.post("/:id/restaurar", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const { rowCount } = await pool.query(
    `UPDATE resena SET estado = 'publicada'
     WHERE id_resena = $1 AND estado = 'eliminada' AND matricula = $2`,
    [id, req.user.matricula]);
  if (!rowCount) return res.status(404).json({ error: "Nada que restaurar" });
  res.json({ ok: true });
});

module.exports = router;