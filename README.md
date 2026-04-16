# Ring Rage — MVP

Timbre inteligente con verificación de empresas para proteger adultos mayores de estafas.

## Stack
- **Next.js 14** — frontend + API routes
- **Supabase** — base de datos PostgreSQL
- **Twilio** — notificaciones WhatsApp
- **Vercel** — hosting

---

## Deploy en 15 minutos

### 1. Supabase (base de datos)
1. Ir a [supabase.com](https://supabase.com) y crear un proyecto nuevo llamado `ringrage`
2. Ir a **SQL Editor** y pegar el contenido de `supabase-schema.sql` → ejecutar
3. Ir a **Settings > API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Twilio (WhatsApp)
1. Crear cuenta en [twilio.com](https://twilio.com)
2. Ir a **Messaging > Try it out > Send a WhatsApp message**
3. Seguir instrucciones del sandbox (enviar mensaje al número de Twilio)
4. Copiar desde **Console**:
   - `Account SID` → `TWILIO_ACCOUNT_SID`
   - `Auth Token` → `TWILIO_AUTH_TOKEN`
   - El número del sandbox → `TWILIO_WHATSAPP_FROM` (formato: `whatsapp:+14155238886`)

### 3. Vercel (deploy)
1. Subir este proyecto a un repositorio GitHub
2. En [vercel.com](https://vercel.com) → **Add New Project** → importar el repo
3. En **Environment Variables** agregar todas las variables de `.env.example`
4. Deploy → Vercel genera la URL automáticamente
5. Actualizar `NEXT_PUBLIC_BASE_URL` con la URL generada

---

## Cómo funciona

### Flujo del visitante
1. Escanea el QR pegado en la puerta → abre `ringrage.vercel.app/visita/{residenteId}`
2. Ingresa el código de su empresa (ej: `GAR-4872`)
3. El sistema evalúa el riesgo y notifica a los familiares por WhatsApp
4. El visitante ve confirmación con nivel de riesgo

### Flujo del familiar
1. Recibe WhatsApp con nombre de empresa, rubro, código y nivel de riesgo
2. Si hay video: recibe link para ver en vivo

### Pantalla del adulto mayor
- URL: `ringrage.vercel.app/residente`
- 3 botones: Hablar · Avisar · Emergencia 911
- Sin login, sin contraseña

---

## Generar QR para un residente

```
GET /api/qr?residenteId={uuid}
```

Retorna imagen PNG del QR listo para imprimir.

---

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/scan` | Se activa al escanear QR |
| POST | `/api/registro-empresa` | Registra empresa nueva |
| GET | `/api/qr?residenteId=` | Genera QR del residente |
