# SQLify – Backend

Backend de **SQLify**, una API que:

- Recibe una **pregunta en lenguaje natural** sobre una base de datos.
- Genera una **consulta SQL** usando Gemini.
- **ejecuta** la consulta contra la base de datos MariaDB.
- Devuelve el **la query SQL** y los **resultados** (o mensaje de error).

Este proyecto está pensado para ser consumido por el frontend de SQLify.

> ⚠️ **Nota:** Este README es solo del **backend**. ver el README del frontend para ver su funcionamiento.

---

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Base de datos:** MariaDB
- **Librerías clave:**
  - `dotenv` para variables de entorno
  - Cliente HTTP o SDK para Gemini (en `src/utils/gemini.js`)

---

## Requisitos

- **Node.js** v20 o superior
- **MySQL / MariaDB** corriendo local o remoto
- Clave de API de **Gemini** 

---

## Puesta en marcha

### 1. Clonar el repo

```bash
git clone https://github.com/reemeerie/generador-consultas-sql.git
cd backend
npm install

npm run dev
```

## Estructura del proyecto

```js
src/
  controllers/   # Manejo del endpoint que consume el front
  db/            # Conexion con la db, creacion de tablas y dump.sql
  spotify/       # Conexion con la api de spotify para carga de datos
  utils/         # Conexion con gemini, normalizacion de SQL y validacion de consultas

```

