const jwt = require("jsonwebtoken");

function leerToken(req) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Exige sesión iniciada
function requireAuth(req, res, next) {
  req.user = leerToken(req);
  if (!req.user) return res.status(401).json({ error: "Inicia sesión para continuar" });
  next();
}

// Si hay sesión llena req.user; si no, sigue como visitante
function authOpcional(req, _res, next) {
  req.user = leerToken(req);
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user?.esAdmin) return res.status(403).json({ error: "Solo administradores" });
  next();
}

module.exports = { requireAuth, authOpcional, requireAdmin };
