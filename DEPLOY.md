# 🚀 Pasos para desplegar tu Bot de Discord

## ✅ Lo que ya está hecho:

1. ✅ Código del worker actualizado para enviar notificaciones a Discord
2. ✅ Lógica para detectar cuando alcanzas nivel 400
3. ✅ Sistema de memoria (KV Storage) para evitar notificaciones duplicadas
4. ✅ Mensaje especial con @everyone cuando llegas a nivel 400
5. ✅ Documentación completa

## 📋 Lo que TÚ necesitas hacer:

### Paso 1: Crear el Webhook de Discord (5 minutos)

1. Abre Discord
2. Ve a tu servidor
3. Haz clic derecho en el canal donde quieres las notificaciones
4. **"Editar Canal"** → **"Integraciones"** → **"Webhooks"**
5. **"Crear Webhook"**
6. Dale un nombre: "MU Level Checker"
7. **COPIA LA URL** (algo como: `https://discord.com/api/webhooks/123.../abc...`)
8. Guarda

### Paso 2: Configurar el webhook localmente (para probar)

Edita el archivo `.dev.vars` y pega tu webhook:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/TU_WEBHOOK_AQUI
```

### Paso 3: Probar localmente (opcional pero recomendado)

```bash
npm run test:discord
```

Esto enviará una notificación de prueba a tu canal de Discord.

### Paso 4: Crear el KV Storage en Cloudflare

```bash
npx wrangler kv:namespace create MU_STORAGE
```

Te dará algo como:
```
{ binding = "MU_STORAGE", id = "abc123def456..." }
```

Copia ese ID y reemplázalo en `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MU_STORAGE"
id = "abc123def456..."  # <-- Pega aquí el ID que te dio
```

### Paso 5: Configurar secrets en Cloudflare

```bash
# Usuario de MU Origen
npx wrangler secret put MU_USERNAME
# → Ingresa: naikelin

# Contraseña de MU Origen
npx wrangler secret put MU_PASSWORD
# → Ingresa: tu_contraseña

# Webhook de Discord
npx wrangler secret put DISCORD_WEBHOOK_URL
# → Pega: https://discord.com/api/webhooks/...
```

### Paso 6: Desplegar 🚀

```bash
npm run deploy
```

### Paso 7: Verificar que funciona

```bash
# Ver logs en tiempo real
npm run tail
```

Deberías ver algo como:
```
✅ Personaje: Antiferna, Nivel: 201, Master Resets: 92
```

---

## 🎯 ¿Qué pasará ahora?

- El bot revisará tu nivel cada 10 minutos
- Cuando llegues a **nivel 400** (o superior):
  - 🎉 Se enviará un mensaje especial a Discord
  - 📢 Mencionará @everyone
  - 🏆 Solo se enviará UNA VEZ (gracias al KV Storage)

## 🧪 ¿Quieres probar antes de llegar a nivel 400?

Puedes forzar el envío de la notificación con tu nivel actual:

```bash
# Después de desplegar, visita:
https://mu-level-checker.TU-SUBDOMAIN.workers.dev/?force=true
```

O localmente:
```bash
npm run test:discord
```

---

## 📞 ¿Dudas?

- Revisa el README.md para más detalles
- Usa `npm run tail` para ver logs en tiempo real
- El bot registrará cada check en los logs de Cloudflare

¡Éxito llegando a nivel 400! 🎮🚀
