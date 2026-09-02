# 🚀 Guía de Despliegue y Containerización: SQLify

Esta guía detalla la arquitectura de containerización con Docker y el flujo de despliegue en producción para la aplicación **SQLify**.

---

## 🏛️ Arquitectura de Despliegue

```
                               ┌─────────────────────────────┐
                               │       Vercel (Edge CDN)     │
                               │   Frontend SPA (React 19)   │
                               └──────────────┬──────────────┘
                                              │ HTTPS Requests
                                              │ (VITE_APP_API_URL)
                                              ▼
┌────────────────────────────────────────────────────────────┐
│          Plataforma de Contenedores / VPS Nube            │
│                                                            │
│  ┌─────────────────────────┐    ┌───────────────────────┐  │
│  │     Docker Container    │    │    Docker Container   │  │
│  │   Backend (Express API) │───▶│       MySQL 8.0       │  │
│  │        puerto 3001      │    │      puerto 3306      │  │
│  └─────────────────────────┘    └───────────────────────┘  │
│                                              │             │
│                                      [Volumen mysql_data]  │
└────────────────────────────────────────────────────────────┘
```

> **¿Por qué esta arquitectura?**
> - **Vercel** está optimizado para servir aplicaciones estáticas (SPA) y funciones serverless sin estado.
> - El **Backend** de SQLify requiere un proceso Node.js continuo con un pool de conexiones persistente hacia MySQL y control de tasa (*rate limit*) en memoria.
> - Por tanto, la mejor práctica de la industria consiste en desplegar el **Frontend en Vercel** y el **Backend + MySQL en una plataforma de contenedores** (Railway, Render, Fly.io o VPS con Docker Compose).

---

## 💻 1. Entorno de Desarrollo Local con Docker Compose

Docker Compose permite levantar la base de datos MySQL, el servidor API y el cliente React en cuestión de segundos, sin necesidad de instalar Node o MySQL localmente.

### Paso 1: Configurar Variables de Entorno
Copia la plantilla de entorno:
```bash
cp .env.docker.example .env
```
Edita `.env` e ingresa tu `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Paso 2: Iniciar los Servicios
```bash
# Construir y levantar contenedores en segundo plano
docker compose up --build -d
```

### Paso 3: Verificar Estado
```bash
# Ver estado de los contenedores
docker compose ps

# Comprobar logs del backend
docker compose logs -f backend

# Probar conectividad con la base de datos
curl http://localhost:3001/api/db-ping
# Respuesta esperada: {"db":true}
```

### Paso 4: Acceder a la Aplicación
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)
- **MySQL:** `localhost:3306` (usuario: `sqlify_user`, base: `SQLify`)

### Paso 5: Detener Contenedores
```bash
# Detener contenedores preservando los datos de la base
docker compose down

# Detener eliminando volúmenes (reset total de BD)
docker compose down -v
```

---

## 🌐 2. Despliegue en Producción

### Parte A: Desplegar Backend y Base de Datos (Cloud Containers)

Puedes desplegar el backend y la base de datos en cualquier proveedor que soporte Docker:

#### Opción 1: Railway / Render (Recomendada)
1. Crea un nuevo proyecto en [Railway](https://railway.app) o [Render](https://render.com).
2. Añade un servicio de **MySQL** gestionado.
3. Añade un servicio para el **Backend**:
   - Conecta el repositorio GitHub.
   - Directorio raíz: `backend/`.
   - Tipo de despliegue: `Dockerfile` (utilizará automáticamente la etapa `production`).
4. Configura las variables de entorno en el panel:
   - `PORT`: `3001`
   - `DB_HOST`: Host proporcionado por el servicio de MySQL.
   - `DB_PORT`: `3306`
   - `DB_USER`, `DB_PASS`, `DB_NAME`.
   - `GEMINI_API_KEY`: Tu clave de Google Gemini.
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`.
5. Obtendrás una URL pública segura (ej: `https://sqlify-api.up.railway.app`).

#### Opción 2: VPS con Docker Compose (Ubuntu / Debian)
En tu servidor remoto:
```bash
git clone https://github.com/JulianBarberis/SQLify.git
cd SQLify
cp .env.docker.example .env
# Configura las contraseñas seguras y API keys en .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

### Parte B: Desplegar Frontend en Vercel

1. Ve a [Vercel](https://vercel.com) y pulsa **Add New > Project**.
2. Importa tu repositorio `JulianBarberis/SQLify`.
3. Configuración del proyecto en Vercel:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (el archivo `vercel.json` en la raíz se encarga de compilar `frontend/`) o selecciona `frontend`.
   - **Build Command:** `pnpm --prefix frontend run build` (o automático si la raíz es `frontend`).
   - **Output Directory:** `frontend/dist` (o `dist`).
4. **Variables de Entorno en Vercel:**
   - Añade `VITE_APP_API_URL` con la URL HTTPS de tu backend en producción (ej. `https://sqlify-api.up.railway.app`).
5. Pulsa **Deploy**.

¡Tu frontend estará disponible en una URL global como `https://sqlify.vercel.app`!

---

## 🔒 Consideraciones de Seguridad y CORS

- El backend ya cuenta con soporte automático para admitir cualquier dominio `*.vercel.app` y la variable `FRONTEND_URL`.
- En producción, asegúrate de no exponer el puerto `3306` de MySQL a internet si el backend se encuentra en la misma red privada de contenedores.
