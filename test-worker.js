/**
 * Test script para probar el worker localmente
 * Ejecutar con: node test-worker.js
 */

// Importar el worker
const workerModule = require('./worker.js');

// Simular las variables de entorno
const env = {
  MU_USERNAME: 'naikelin',
  MU_PASSWORD: 'thana123',
};

// Simular un request
const request = new Request('http://localhost:8787/');

console.log('🧪 Probando MU Level Checker Worker...\n');

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
      console.log(`Timestamp:      ${result.timestamp}`);
      console.log('='.repeat(60));
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
