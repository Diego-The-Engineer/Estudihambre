const router = require("express").Router();
const pool = require("../db");

router.get("/facultades", async (_req, res) => {
  const { rows } = await pool.query("SELECT codigo, nombre FROM facultad ORDER BY codigo");
  res.json(rows);
});

// Cafeterías con promedio (de las 4 calificaciones) y total de reseñas publicadas
router.get("/cafeterias", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT c.id_cafeteria AS id,
           c.nombre,
           f.codigo AS facultad,
           ROUND(AVG((r.rating_sabor + r.rating_precio + r.rating_limpieza + r.rating_atencion) / 4.0), 1)::float AS promedio,
           COUNT(r.id_resena)::int AS "Resenas"
    FROM cafeteria c
    JOIN facultad f ON f.id_facultad = c.id_facultad
    LEFT JOIN resena r ON r.id_cafeteria = c.id_cafeteria AND r.estado = 'publicada'
    GROUP BY c.id_cafeteria, f.codigo
    ORDER BY promedio DESC NULLS LAST, c.nombre`);
  res.json(rows);
});

module.exports = router;
