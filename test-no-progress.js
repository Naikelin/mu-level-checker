/**
 * Script para probar la alerta de "sin progreso"
 * Simula que el personaje no ha subido de nivel
 */

import { config } from 'dotenv';
config();

// Función para enviar alerta de sin progreso
async function sendDiscordNoProgressAlert(webhookUrl, currentData, previousData, discordUserId, discordUsername) {
  // Construir la mención del usuario
  let userMention = '';
  if (discordUserId) {
    // Si tenemos el ID, usar mención directa (formato <@ID>)
    userMention = `<@${discordUserId}>`;
  } else if (discordUsername) {
    // Si solo tenemos username, mencionarlo sin garantía
    userMention = `@${discordUsername}`;
  }
  
  const embed = {
    title: '⚠️ Sin Progreso de Nivel',
    description: `**${currentData.character}** no ha subido de nivel desde la última verificación.\n\n` +
                 `El personaje sigue en nivel **${currentData.level}** (necesita llegar a 400).`,
    color: 0xFFA500, // Naranja
    fields: [
      {
        name: '👤 Personaje',
        value: currentData.character,
        inline: true,
      },
      {
        name: '⚡ Nivel Actual',
        value: `${currentData.level}`,
        inline: true,
      },
      {
        name: '🎯 Nivel Objetivo',
        value: '400',
        inline: true,
      },
      {
        name: '🔄 Master Resets',
        value: `${currentData.master_resets}`,
        inline: true,
      },
      {
        name: '💰 Zen',
        value: currentData.zen,
        inline: true,
      },
      {
        name: '📊 Progreso',
        value: `${Math.round((currentData.level / 400) * 100)}%`,
        inline: true,
      },
      {
        name: '⏰ Última Verificación',
        value: `<t:${Math.floor(new Date(previousData.timestamp).getTime() / 1000)}:R>`,
        inline: false,
      },
    ],
    thumbnail: {
      url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    },
    timestamp: currentData.timestamp,
    footer: {
      text: 'MU Origen Level Checker',
      icon_url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    },
  };
  
  const payload = {
    username: 'MU Level Checker',
    avatar_url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    content: `⚠️ ${userMention} **Alerta:** El personaje no ha subido de nivel`,
    embeds: [embed],
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Error enviando alerta a Discord:', response.status, await response.text());
    } else {
      console.log('✅ Alerta de sin progreso enviada a Discord');
    }
  } catch (error) {
    console.error('Error al enviar alerta a Discord:', error.message);
  }
}

// Datos de prueba
const previousData = {
  success: true,
  character: 'Antiferna',
  level: 278,
  zen: '1,400,746,787',
  master_resets: 92,
  timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutos atrás
};

const currentData = {
  success: true,
  character: 'Antiferna',
  level: 278, // Mismo nivel que antes
  zen: '1,400,746,787',
  master_resets: 92,
  timestamp: new Date().toISOString(),
};

console.log('🧪 Probando alerta de sin progreso...');
console.log('📊 Nivel anterior:', previousData.level);
console.log('📊 Nivel actual:', currentData.level);
console.log('👤 Usuario a mencionar:', process.env.DISCORD_USER_ID || process.env.DISCORD_USERNAME || 'Ninguno');
console.log('');

sendDiscordNoProgressAlert(
  process.env.DISCORD_WEBHOOK_URL, 
  currentData, 
  previousData,
  process.env.DISCORD_USER_ID,
  process.env.DISCORD_USERNAME
);
