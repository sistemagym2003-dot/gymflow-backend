# GymFlow API (Backend)

Backend **solo API** para GymFlow, pensado para desplegar en **Render**. La base de datos está en **Supabase (Postgres)** y el frontend en **Vercel**.

## Requisitos

- Node.js 18+
- Cuenta en Supabase (Postgres) y variables de entorno configuradas

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores (sin subir `.env` al repo):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Postgres (Supabase: Project Settings → Database → Connection string URI) |
| `JWT_SECRET` | Clave secreta para firmar JWT (mínimo 32 caracteres) |
| `FRONTEND_URL` | Origen del frontend para CORS (ej. `https://tu-app.vercel.app` o `http://localhost:3000` en desarrollo) |
| `SMTP_HOST` | Host SMTP de Brevo (`smtp-relay.brevo.com`) |
| `SMTP_PORT` | Puerto SMTP (`587`) |
| `SMTP_SECURE` | `false` para Brevo SMTP estándar |
| `SMTP_USER` | Login SMTP entregado por Brevo |
| `SMTP_PASS` | SMTP key generada en Brevo |
| `MAIL_FROM_EMAIL` | Correo remitente |
| `MAIL_FROM_NAME` | Nombre del remitente |
| `MAIL_REPLY_TO` | Correo de respuesta |
| `SOCIO_APP_URL` | URL del login de la app de socios |

## Ejecución en local

```bash
npm run dev
```

La API queda en `http://localhost:4000`. El frontend debe llamar a esta URL en desarrollo y a la URL de Render en producción.

## Endpoints

### Autenticación

- **POST /api/auth/login**  
  Body: `{ "correo": "...", "contraseña": "...", "rol": "recepcion" }`  
  El frontend envía el `rol` según la pantalla de login (recepcion, gerencia, admin_ti, entrenador, socio).  
  Respuesta: `{ "token": "...", "usuario": { "id", "correo", "nombre_completo", "rol", ... } }`  
  El frontend debe guardar el token (por ejemplo en memoria o `localStorage`) y enviarlo en las peticiones protegidas en el header:  
  `Authorization: Bearer <token>`.

- **POST /api/auth/logout**  
  Cierre de sesión. El backend responde OK; la invalidación real se hace en el cliente (descartar el token). No se mantiene blacklist de tokens en el servidor.

### Socios (requieren autenticación)

- **PATCH /api/socios/:id**  
  Solo roles: `recepcion`, `gerencia`, `admin_ti`.  
  Body (todos opcionales): `sucursal_id`, `fecha_nacimiento`, `estado`, `observaciones`. Si el socio tiene `usuario_id`, también se pueden enviar `nombre_completo`, `correo`, `telefono` (se actualizan en la tabla `usuarios`).  
  Header: `Authorization: Bearer <token>`.

### Correos

- **POST /api/mail/send-test**  
  Body: `{ "to": "correo@ejemplo.com", "recipientName": "Nombre" }`

- **POST /api/mail/send-access-credentials**  
  Body: `{ "to": "correo@ejemplo.com", "recipientName": "Nombre", "gymName": "Prime Fitness", "temporaryPassword": "Clave1234*" }`

## Despliegue en Render

1. Crear un **Web Service** en Render.
2. Conectar el repositorio y configurar:
   - **Root Directory**: vacío si este backend es la raíz del repo; si está en una subcarpeta (ej. `backend/`), poner `backend`.
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
3. Añadir las variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`, `SOCIO_APP_URL`.
4. Desplegar. La URL base de la API será la que asigne Render (ej. `https://gymflow-api.onrender.com`). Esa misma URL se configura en el frontend como `NEXT_PUBLIC_API_URL` en Vercel.

## Notas

- Los usuarios **no se crean** en este backend; se gestionan en Supabase u otra herramienta.
- Las contraseñas en BD están hasheadas con bcrypt (pgcrypto `crypt(..., gen_salt('bf'))`). Este backend solo valida login y expone edición de socios.
