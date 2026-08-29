# SQLify – Frontend

Frontend de **SQLify**, una aplicación web que permite hacer preguntas en lenguaje natural sobre una base de datos y obtener la consulta SQL generada y sus resultados.

Este proyecto consume un backend en Node/Express que se conecta a MySQL y Gemini para generar las consultas.

> ⚠️ **Nota:** Este README es solo del **frontend**. ver el README del backend para leer la documentación de la API y la DB.

---

## Demo

![Web](./src/assets/docs/captura_sqlify.jpg)

---

## Stack

- **Framework:** React + TypeScript
- **Bundler:** Vite
- **Estilos:** CSS (archivos `App.css` e `index.css`)
- **Gestión de datos / API:** servicios HTTP en `src/service/appService.ts`

---

## Requisitos

- **Node.js** v20 o superior
- **npm** 

---

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/reemeerie/generador-consultas-sql.git
cd frontend
npm install

cp .env.example .env   # VITE_APP_API_URL = "http://158.69.212.87"

npm run dev
```

## Estructura del proyecto

```js
src/
  components/     # Tabla de resultados
  clases/         # Manejo de errores
  services/       # Llamadas a la API con axios
  models/         # Interfaces de dominio

```
