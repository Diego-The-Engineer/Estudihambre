const jwt = require("jsonwebtoken");


//verifica que el token generado sea el mismo que la variable de entorno JWT_SECRET
function leerToken(req) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// exige sesión iniciada
function requireAuth(req, res, next) {
  req.user = leerToken(req);
  if (!req.user) return res.status(401).json({ error: "Inicia sesión para continuar" });
  next();
}

// si hay sesión llena req.user; si no, sigue como visitante
function authOpcional(req, _res, next) {
  req.user = leerToken(req);
  next();
}


//exporta las funiones 
module.exports = { requireAuth, authOpcional };
