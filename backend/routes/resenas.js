const router = require("express").Router();
const pool = require("../db");
const { requireAuth, requireAdmin, authOpcional } = require("../middleware/auth");

const SELECT = `
  SELECT r.id_resena AS id, c.nombre AS cafeteria,
         r.rating_sabor AS sabor, r.rating_precio AS precio,
         r.rating_limpieza AS limpieza, r.rating_atencion AS atencion,
         r.comentario,
         COALESCE(NULLIF(r.autor, ''), 'Hambre anónima') AS autor,
         to_char(r.publicacion, 'DD/MM/YYYY') AS fecha,
         (r.matricula = $1) AS propia
  FROM resena r JOIN cafeteria c ON c.id_cafeteria = r.id_cafeteria`;


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

// COLA (FIFO): reseñas pendientes, la más antigua primero. Solo admin.
router.get("/pendientes", requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE r.estado = 'pendiente' ORDER BY r.id_resena ASC`, [req.user.matricula]);
  res.json(rows);
});

async function resolverSiguiente(estado, res) {
  const { rows } = await pool.query(
    `UPDATE resena SET estado = $1
     WHERE id_resena = (SELECT id_resena FROM resena WHERE estado = 'pendiente'
                        ORDER BY id_resena LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING id_resena AS id`, [estado]);
  if (!rows.length) return res.status(404).json({ error: "No hay reseñas por revisar" });
  res.json(rows[0]);
}
router.post("/pendientes/publicar-siguiente", requireAuth, requireAdmin, (_req, res) => resolverSiguiente("publicada", res));
router.post("/pendientes/descartar-siguiente", requireAuth, requireAdmin, (_req, res) => resolverSiguiente("rechazada", res));

// Nueva reseña: entra como "pendiente"
router.post("/", requireAuth, async (req, res) => {
  const { cafeteriaId, sabor, precio, limpieza, atencion, comentario, autor } = req.body;
  const ratings = [sabor, precio, limpieza, atencion].map(Number);
  if (!Number.isInteger(Number(cafeteriaId)) || ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) {
    return res.status(400).json({ error: "Datos de la reseña inválidos" });
  }
  const { rows } = await pool.query(
    `INSERT INTO resena (matricula, id_cafeteria, rating_sabor, rating_precio, rating_limpieza, rating_atencion, comentario, autor)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_resena AS id`,
    [req.user.matricula, Number(cafeteriaId), ...ratings, String(comentario || "").slice(0, 500), String(autor || "").slice(0, 35)]);
  res.status(201).json(rows[0]);
});

// Eliminar = borrado lógico (permite "deshacer"). Dueño o admin.
router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const { rowCount } = await pool.query(
    `UPDATE resena SET estado = 'eliminada'
     WHERE id_resena = $1 AND estado = 'publicada' AND (matricula = $2 OR $3::boolean)`,
    [id, req.user.matricula, req.user.esAdmin]);
  if (!rowCount) return res.status(404).json({ error: "Reseña no encontrada" });
  res.json({ ok: true });
});

router.post("/:id/restaurar", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const { rowCount } = await pool.query(
    `UPDATE resena SET estado = 'publicada'
     WHERE id_resena = $1 AND estado = 'eliminada' AND (matricula = $2 OR $3::boolean)`,
    [id, req.user.matricula, req.user.esAdmin]);
  if (!rowCount) return res.status(404).json({ error: "Nada que restaurar" });
  res.json({ ok: true });
});

module.exports = router;
