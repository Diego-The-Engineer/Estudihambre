require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
//se conecta con todas las funciones de la ruta /routes 
const origen = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
app.use(cors({ origin: origen || undefined }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/catalogo"));
app.use("/api/resenas", require("./routes/resenas"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`API lista en el puerto ${puerto}`));
