const router = require("express").Router();
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

function sesion(u) {
  const usuario = { matricula: u.matricula, nombre: u.nombre, esAdmin: u.es_admin };
  const token = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, usuario };
}

router.post("/registro", async (req, res) => {
  const { matricula, nombre, facultad } = req.body;
  if (!/^\d{5,9}$/.test(String(matricula)) || !nombre?.trim() || !facultad) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const fac = await pool.query("SELECT id_facultad FROM facultad WHERE codigo = $1", [facultad]);
  if (!fac.rows.length) return res.status(400).json({ error: "Facultad no válida" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO estudiante (matricula, id_facultad, nombre)
       VALUES ($1, $2, $3) RETURNING matricula, nombre, es_admin`,
      [matricula, fac.rows[0].id_facultad, nombre.trim().slice(0, 45)]
    );
    res.status(201).json(sesion(rows[0]));
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Esa matrícula ya está registrada" });
    throw err;
  }
});

// Login con matrícula + facultad. Las cuentas de administrador además exigen ADMIN_PASSWORD.
router.post("/login", async (req, res) => {
  const { matricula, facultad, clave } = req.body;
  const { rows } = await pool.query(
    `SELECT e.matricula, e.nombre, e.es_admin
     FROM estudiante e JOIN facultad f ON f.id_facultad = e.id_facultad
     WHERE e.matricula = $1 AND f.codigo = $2`,
    [Number(matricula) || 0, String(facultad || "")]
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: "Matrícula o facultad incorrecta" });
  if (u.es_admin && (!process.env.ADMIN_PASSWORD || clave !== process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }
  res.json(sesion(u));
});

router.get("/me", requireAuth, (req, res) => {
  const { matricula, nombre, esAdmin } = req.user;
  res.json({ matricula, nombre, esAdmin });
});

module.exports = router;
