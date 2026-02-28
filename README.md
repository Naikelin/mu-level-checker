# MU Origen Level Checker - Discord Bot

Bot de Discord que monitorea tu personaje en MU Origen y **envía una notificación especial cuando alcances nivel 400**! 🎉

## 🚀 Características

- **Serverless**: Corre en Cloudflare Workers (gratis)
- **Automático**: Se ejecuta cada 10 minutos con cron triggers
- **Discord Integration**: Envía notificación con @everyone cuando llegas a nivel 400
- **Smart Detection**: Solo notifica la primera vez que alcanzas nivel 400
- **Sin servidor**: No necesitas mantener ningún servidor corriendo

## 📋 Requisitos previos

1. Cuenta de Cloudflare (gratis)
2. Servidor de Discord donde tengas permisos de administrador
3. Node.js instalado en tu computadora

## 📁 Estructura del proyecto

```
MU-Automatization/
├── worker.js          # Cloudflare Worker principal
├── wrangler.toml      # Configuración y cron schedule
├── test-worker.js     # Script de prueba local
├── package.json       # Dependencias de Node.js
├── .dev.vars          # Variables de entorno locales (no subir a git)
└── README.md          # Este archivo
```

## 🛠️ Instalación y configuración

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Naikelin/mu-level-checker.git
cd mu-level-checker
npm install
```

### 2. Crear Webhook de Discord

1. Abre Discord y ve a tu servidor
2. Haz clic derecho en el canal donde quieres las notificaciones
3. Selecciona **"Editar Canal"**
4. Ve a **"Integraciones" → "Webhooks"**
5. Haz clic en **"Crear Webhook"**
6. Dale un nombre (ejemplo: "MU Level Checker")
7. **Copia la URL del Webhook** (algo como: `https://discord.com/api/webhooks/123456789/abc...`)
8. Guarda los cambios

### 3. Configurar variables locales para testing

Edita el archivo `.dev.vars` y agrega tu webhook:

```bash
MU_USERNAME=tu_usuario
MU_PASSWORD=tu_contraseña
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/TU_WEBHOOK_AQUI
```

### 4. Probar localmente

```bash
npm run test:discord
```

Esto enviará una notificación de prueba a Discord para verificar que todo funciona.

### 5. Autenticarse con Cloudflare

```bash
npx wrangler login
```

### 6. Crear KV Storage

El bot necesita KV Storage para recordar si ya envió la notificación de nivel 400:

```bash
npx wrangler kv:namespace create MU_STORAGE
```

Copia el `id` que te da y reemplázalo en `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MU_STORAGE"
id = "tu_id_aqui"  # Reemplaza con el ID que te dio el comando anterior
```

### 7. Configurar secrets en Cloudflare

```bash
npx wrangler secret put MU_USERNAME
# Ingresa tu usuario

npx wrangler secret put MU_PASSWORD
# Ingresa tu contraseña

npx wrangler secret put DISCORD_WEBHOOK_URL
# Pega la URL del webhook de Discord
```

### 8. Desplegar a producción

```bash
npm run deploy
```

¡Listo! El bot se ejecutará automáticamente cada 10 minutos y te notificará cuando alcances nivel 400.

## 🎮 ¿Cómo funciona?

1. **Cada 10 minutos** el bot hace login en MU Origen
2. **Consulta** el nivel de tu personaje
3. **Compara** con el nivel anterior guardado en KV Storage
4. **Si alcanzaste nivel 400** (y es la primera vez):
   - 🎉 Envía un mensaje especial a Discord
   - 📢 Menciona @everyone en el canal
   - 🏆 Muestra tu personaje, nivel, resets y zen

## 📊 Ejemplo de notificación en Discord

Cuando alcances nivel 400, recibirás un mensaje como este:

```
@everyone 🎉 ¡ALGUIEN LLEGÓ A NIVEL 400! 🎉

🎉🎊 ¡NIVEL 400 ALCANZADO! 🎊🎉
Antiferna ha llegado al nivel 400!

¡Felicitaciones por este increíble logro! 🏆

👤 Personaje: Antiferna
⚡ Nivel: 400 ✨
🔄 Master Resets: 92
💰 Zen: 1,400,881,387
```

## 📝 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm test` | Prueba el checker localmente (sin Discord) |
| `npm run test:discord` | Prueba el envío a Discord |
| `npm run dev` | Ejecuta el worker en modo desarrollo |
| `npm run deploy` | Despliega a producción |
| `npm run tail` | Ver logs en tiempo real |

## ⚙️ Configuración avanzada

### Cambiar el nivel de notificación

Si quieres recibir notificaciones en un nivel diferente (por ejemplo, nivel 350), edita `worker.js`:

```javascript
// Busca esta línea:
if (result.level >= 400) {

// Y cámbiala por:
if (result.level >= 350) {
```

### Cambiar la frecuencia de chequeo

Para cambiar cada cuánto tiempo se ejecuta el bot, edita `wrangler.toml`:

```toml
[triggers]
crons = ["*/10 * * * *"]  # Cada 10 minutos
```

Otros ejemplos:
- `*/5 * * * *` - Cada 5 minutos
- `*/15 * * * *` - Cada 15 minutos
- `0 * * * *` - Cada hora

### Testear con tu nivel actual

Si quieres probar que el bot funciona antes de llegar a nivel 400, puedes forzar el envío:

```bash
# En local:
npm run test:discord

# O hacer una petición HTTP al worker desplegado:
curl "https://mu-level-checker.TU-SUBDOMAIN.workers.dev/?force=true"
```

## 🔒 Seguridad

- ✅ Las credenciales se guardan como **secrets encriptados** en Cloudflare
- ✅ El archivo `.dev.vars` está en `.gitignore` (no se sube a git)
- ✅ Las credenciales nunca se exponen en el código

## 🌐 Probar manualmente

Una vez desplegado, puedes hacer una petición HTTP para probar el worker:

```bash
curl https://mu-level-checker.YOUR-SUBDOMAIN.workers.dev
```

Reemplaza `YOUR-SUBDOMAIN` con tu subdominio de Cloudflare Workers.

## 📈 Próximas mejoras

Ideas para extender la funcionalidad:

- Guardar histórico de niveles en KV Storage
- Enviar notificaciones a Discord/Telegram cuando sube de nivel
- Crear un dashboard web para visualizar el progreso
- Comparar con otros jugadores del ranking

## 🆘 Troubleshooting

**Error: "DISCORD_WEBHOOK_URL no está configurado"**
- Asegúrate de haber creado el webhook en Discord
- Verifica que copiaste la URL completa
- Para testing local, edita `.dev.vars`
- Para producción, usa `wrangler secret put DISCORD_WEBHOOK_URL`

**No recibo notificaciones en Discord**
- Verifica que el webhook esté activo en Discord
- Revisa los logs con `npm run tail`
- Prueba manualmente con `npm run test:discord`
- Asegúrate de que tu personaje esté en nivel 400 o superior

**El bot envía notificaciones duplicadas**
- Esto no debería pasar gracias al KV Storage
- Verifica que el KV Storage esté configurado correctamente en `wrangler.toml`

**Error: "No se recibió cookie de sesión"**
- Verifica que las credenciales sean correctas
- Puede ser un problema temporal del servidor MU Origen

## 📄 Licencia

Este proyecto es de uso personal. MU Origen no está afiliado con este proyecto.
