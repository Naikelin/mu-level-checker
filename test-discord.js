/**
 * Test script para probar el bot de Discord
 * Simula que el personaje está en nivel 400 para testear la notificación
 */

// Importar el worker
const workerModule = require('./worker.js');

// Leer variables de entorno
require('fs').readFileSync('.dev.vars', 'utf-8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });

// Simular las variables de entorno
const env = {
  MU_USERNAME: process.env.MU_USERNAME,
  MU_PASSWORD: process.env.MU_PASSWORD,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  MU_STORAGE: null, // KV Storage no está disponible en local
};

// Verificar que el webhook esté configurado
if (!env.DISCORD_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL.includes('YOUR_WEBHOOK')) {
  console.error('❌ Error: DISCORD_WEBHOOK_URL no está configurado en .dev.vars');
  console.log('\n📝 Para configurarlo:');
  console.log('1. Crea un webhook en Discord (ver README.md)');
  console.log('2. Edita .dev.vars y reemplaza YOUR_WEBHOOK_ID y YOUR_WEBHOOK_TOKEN');
  process.exit(1);
}

console.log('🧪 Probando MU Level Checker con Discord...\n');

// Simular un request con force=true para probar el envío a Discord
const testUrl = 'http://localhost:8787/?force=true';
const request = new Request(testUrl);

// Ejecutar el worker
workerModule.default.fetch(request, env)
  .then(response => response.json())
  .then(result => {
    console.log('✅ Resultado:\n');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('Información del Personaje');
      console.log('='.repeat(60));
      console.log(`Personaje:      ${result.character}`);
      console.log(`Nivel:          ${result.level}`);
      console.log(`Master Resets:  ${result.master_resets}`);
      console.log(`Zen:            ${result.zen}`);
      console.log('='.repeat(60));
      
      if (result.level >= 400) {
        console.log('\n🎉 ¡El personaje está en nivel 400 o superior!');
        console.log('📨 Se debería haber enviado una notificación a Discord.');
      } else {
        console.log(`\n📊 Nivel actual: ${result.level}`);
        console.log('ℹ️  La notificación solo se envía cuando el nivel es 400 o superior.');
        console.log('💡 Para forzar el envío, se usó el parámetro ?force=true');
      }
      
      console.log('\n✅ Revisa tu canal de Discord para ver el mensaje!');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
