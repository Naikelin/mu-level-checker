# MU Origen Level Checker

Cloudflare Worker que consulta automáticamente el nivel de tu personaje en MU Origen cada 10 minutos.

## 🚀 Características

- **Serverless**: Corre en Cloudflare Workers (gratis)
- **Automático**: Se ejecuta cada 10 minutos con cron triggers
- **Sin servidor**: No necesitas mantener ningún servidor corriendo
- **Logs**: Ve los resultados en tiempo real con Cloudflare Logs

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

### 1. Instalar dependencias

```bash
npm install
```

### 2. Autenticarse con Cloudflare

```bash
npx wrangler login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Cloudflare.

### 3. Configurar credenciales

Las credenciales se guardan como **secrets** encriptados en Cloudflare:

```bash
npx wrangler secret put MU_USERNAME
# Cuando te pregunte, ingresa tu usuario: naikelin

npx wrangler secret put MU_PASSWORD
# Cuando te pregunte, ingresa tu contraseña
```

### 4. Probar localmente

```bash
npm test
```

O ejecuta el worker en modo desarrollo:

```bash
npm run dev
```

Luego visita http://localhost:8787 en tu navegador para ver el resultado.

### 5. Desplegar a producción

```bash
npm run deploy
```

¡Listo! El worker se ejecutará automáticamente cada 10 minutos.

## 📊 Ver logs en tiempo real

Una vez desplegado, puedes ver los logs en tiempo real:

```bash
npm run tail
```

También puedes ver los logs en el Dashboard de Cloudflare:
- Ir a **Workers & Pages** → tu worker → **Logs**

## 📝 Ejemplo de respuesta

```json
{
  "success": true,
  "character": "Antiferna",
  "level": 196,
  "master_resets": 92,
  "zen": "1,400,881,387",
  "timestamp": "2026-02-28T21:36:50.217Z"
}
```

## 🔧 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm test` | Prueba el worker localmente con Node.js |
| `npm run dev` | Ejecuta el worker en modo desarrollo |
| `npm run deploy` | Despliega a producción |
| `npm run tail` | Ver logs en tiempo real |

## ⏱️ Configuración del cron

El worker está configurado para ejecutarse cada 10 minutos. Puedes cambiar esto en `wrangler.toml`:

```toml
[triggers]
crons = ["*/10 * * * *"]  # Cada 10 minutos
```

Otros ejemplos de cron:
- `*/5 * * * *` - Cada 5 minutos
- `*/15 * * * *` - Cada 15 minutos
- `0 * * * *` - Cada hora
- `0 */2 * * *` - Cada 2 horas

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

**Error: "No se recibió cookie de sesión"**
- Verifica que las credenciales sean correctas
- Asegúrate de haber configurado los secrets con `wrangler secret put`

**Error: "La sesión no está autenticada"**
- Puede ser un problema temporal del servidor
- El worker reintentará en 10 minutos automáticamente

**No veo los logs**
- Usa `npm run tail` para ver logs en tiempo real
- O revisa el Dashboard de Cloudflare → Workers → Logs

## 📄 Licencia

Este proyecto es de uso personal. MU Origen no está afiliado con este proyecto.
