CREATE TABLE facultad (
  id_facultad SERIAL PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL
);

CREATE TABLE estudiante (
  matricula     INT PRIMARY KEY,
  id_facultad   INT NOT NULL REFERENCES facultad(id_facultad),
  nombre        VARCHAR(45) NOT NULL,
  es_admin      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cafeteria (
  id_cafeteria SERIAL PRIMARY KEY,
  nombre       VARCHAR(45) NOT NULL,
  id_facultad  INT NOT NULL REFERENCES facultad(id_facultad)
);

CREATE TYPE estado_resena AS ENUM ('pendiente', 'publicada', 'rechazada', 'eliminada');

CREATE TABLE resena (
  id_resena       SERIAL PRIMARY KEY,
  matricula       INT NOT NULL REFERENCES estudiante(matricula),
  id_cafeteria    INT NOT NULL REFERENCES cafeteria(id_cafeteria),
  rating_sabor    SMALLINT NOT NULL CHECK (rating_sabor    BETWEEN 1 AND 5),
  rating_precio   SMALLINT NOT NULL CHECK (rating_precio   BETWEEN 1 AND 5),
  rating_limpieza SMALLINT NOT NULL CHECK (rating_limpieza BETWEEN 1 AND 5),
  rating_atencion SMALLINT NOT NULL CHECK (rating_atencion BETWEEN 1 AND 5),
  comentario      TEXT,
  autor           VARCHAR(45),
  publicacion     DATE NOT NULL DEFAULT CURRENT_DATE,
  estado          estado_resena NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_resena_cafeteria_estado ON resena (id_cafeteria, estado);

-- Datos iniciales
INSERT INTO facultad (codigo, nombre) VALUES
  ('FARQ',   'Facultad de Arquitectura'),
  ('FCFM',   'Facultad de Ciencias Físico Matemáticas'),
  ('FCQ',    'Facultad de Ciencias Químicas'),
  ('FACPYA', 'Facultad de Contaduría Pública y Administración'),
  ('FACDYC', 'Facultad de Derecho y Criminología'),
  ('FFYL',   'Facultad de Filosofía y Letras'),
  ('FIC',    'Facultad de Ingeniería Civil'),
  ('FIME',   'Facultad de Ingeniería Mecánica y Eléctrica'),
  ('FOD',    'Facultad de Organización Deportiva'),
  ('FTSYDH', 'Facultad de Trabajo Social y Desarrollo Humano'),
  ('FCB',    'Facultad de Ciencias Biológicas');

INSERT INTO cafeteria (nombre, id_facultad)
SELECT 'Cafetería de ' || codigo, id_facultad FROM facultad;

