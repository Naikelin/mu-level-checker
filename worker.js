/**
 * MU Origen Level Checker - Discord Bot
 * Se ejecuta cada 10 minutos y envía notificaciones a Discord
 */

export default {
  /**
   * Handler para peticiones HTTP (opcional - para probar manualmente)
   */
  async fetch(request, env) {
    const result = await checkMULevel(env.MU_USERNAME, env.MU_PASSWORD);
    
    // Opción para forzar el envío de notificación (para testing)
    const url = new URL(request.url);
    const forceNotify = url.searchParams.get('force') === 'true';
    
    if (result.success && env.DISCORD_WEBHOOK_URL) {
      if (forceNotify || result.level >= 400) {
        await sendDiscordLevel400Notification(env.DISCORD_WEBHOOK_URL, result);
      }
    }
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Handler para eventos programados (cron)
   * Se ejecuta automáticamente cada 10 minutos
   */
  async scheduled(event, env, ctx) {
    const result = await checkMULevel(env.MU_USERNAME, env.MU_PASSWORD);
    
    console.log('MU Level Check Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Personaje: ${result.character}, Nivel: ${result.level}, Master Resets: ${result.master_resets}`);
      
      // Verificar si el personaje llegó a nivel 400
      if (result.level >= 400) {
        // Obtener el estado previo para ver si ya enviamos la notificación
        const previousData = await env.MU_STORAGE?.get('character_data', { type: 'json' });
        
        // Solo enviar si es la primera vez que alcanza nivel 400 o más
        // o si el nivel previo era menor a 400
        if (!previousData || previousData.level < 400) {
          if (env.DISCORD_WEBHOOK_URL) {
            await sendDiscordLevel400Notification(env.DISCORD_WEBHOOK_URL, result);
            console.log('🎉 ¡Notificación de nivel 400 enviada a Discord!');
          }
        }
      }
      
      // Guardar datos actuales para la próxima comparación
      if (env.MU_STORAGE) {
        await env.MU_STORAGE.put('character_data', JSON.stringify(result));
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
      
      // Opcional: Enviar error a Discord
      if (env.DISCORD_WEBHOOK_URL) {
        await sendDiscordError(env.DISCORD_WEBHOOK_URL, result.error);
      }
    }
  },
};

/**
 * Realiza login y obtiene información del personaje
 */
async function checkMULevel(username, password) {
  const baseUrl = 'https://origen.enterprise.net.ar';
  
  try {
    // Step 0: Obtener cookie inicial visitando la página de login
    const initialResponse = await fetch(`${baseUrl}/login/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    const initialCookie = initialResponse.headers.get('set-cookie');
    let initialPhpsessid = null;
    
    if (initialCookie) {
      const match = initialCookie.match(/PHPSESSID=([^;]+)/);
      if (match) {
        initialPhpsessid = match[1];
      }
    }
    
    // Step 1: Login con la cookie inicial
    const loginResponse = await fetch(`${baseUrl}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Referer': `${baseUrl}/`,
        'Origin': baseUrl,
        ...(initialPhpsessid && { 'Cookie': `PHPSESSID=${initialPhpsessid}` }),
      },
      body: `webengineLogin_user=${encodeURIComponent(username)}&webengineLogin_pwd=${encodeURIComponent(password)}&webengineLogin_submit=submit`,
      redirect: 'manual', // NO seguir redirecciones
    });

    // Verificar que hubo redirección (login exitoso)
    if (loginResponse.status !== 302) {
      return {
        success: false,
        error: `Login falló con status ${loginResponse.status}`,
      };
    }
    
    // Extraer la cookie de sesión autenticada
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    
    if (!setCookieHeaders) {
      return {
        success: false,
        error: 'No se recibió cookie de sesión después del login',
      };
    }

    // Extraer todas las PHPSESSID y usar la última (la más reciente)
    const phpSessionMatches = setCookieHeaders.matchAll(/PHPSESSID=([^;]+)/g);
    const sessions = Array.from(phpSessionMatches);
    
    if (sessions.length === 0) {
      return {
        success: false,
        error: 'No se pudo extraer PHPSESSID',
      };
    }

    const phpsessid = sessions[sessions.length - 1][1];

    // Step 2: Obtener información del personaje
    const infoResponse = await fetch(`${baseUrl}/usercp/resetmaster`, {
      method: 'GET',
      headers: {
        'Cookie': `PHPSESSID=${phpsessid}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Referer': `${baseUrl}/usercp/`,
      },
    });

    const html = await infoResponse.text();
    
    // Verificar que la sesión está autenticada
    if (html.includes('webengineLogin_user')) {
      return {
        success: false,
        error: 'La sesión no está autenticada',
      };
    }

    // Extraer información del personaje usando regex
    // Busca: <td>Nombre</td><td>Nivel</td><td>Zen</td><td>Master Resets</td><td><button
    const pattern = /<td>([A-Za-z0-9]+)<\/td><td>(\d+)<\/td><td>([0-9,]+)<\/td><td>(\d+)<\/td><td><button/;
    const match = html.match(pattern);

    if (match) {
      return {
        success: true,
        character: match[1],
        level: parseInt(match[2]),
        zen: match[3],
        master_resets: parseInt(match[4]),
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        error: 'No se pudo extraer información del personaje',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Envía una notificación especial a Discord cuando el personaje alcanza nivel 400
 */
async function sendDiscordLevel400Notification(webhookUrl, data) {
  const embed = {
    title: '🎉🎊 ¡NIVEL 400 ALCANZADO! 🎊🎉',
    description: `**${data.character}** ha llegado al nivel **400**!\n\n` +
                 `¡Felicitaciones por este increíble logro! 🏆`,
    color: 0xFFD700, // Dorado
    fields: [
      {
        name: '👤 Personaje',
        value: data.character,
        inline: true,
      },
      {
        name: '⚡ Nivel',
        value: `**${data.level}** ✨`,
        inline: true,
      },
      {
        name: '🔄 Master Resets',
        value: `${data.master_resets}`,
        inline: true,
      },
      {
        name: '💰 Zen',
        value: data.zen,
        inline: false,
      },
    ],
    thumbnail: {
      url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    },
    timestamp: data.timestamp,
    footer: {
      text: 'MU Origen Level Checker',
      icon_url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    },
  };
  
  const payload = {
    username: 'MU Level Checker',
    avatar_url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    content: '@everyone 🎉 **¡ALGUIEN LLEGÓ A NIVEL 400!** 🎉', // Mención a todos
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
      console.error('Error enviando a Discord:', response.status, await response.text());
    } else {
      console.log('✅ Notificación de nivel 400 enviada a Discord');
    }
  } catch (error) {
    console.error('Error al enviar a Discord:', error.message);
  }
}

/**
 * Envía un mensaje de error a Discord
 */
async function sendDiscordError(webhookUrl, errorMessage) {
  const embed = {
    title: '❌ Error en MU Level Checker',
    description: `**Error:** ${errorMessage}`,
    color: 0xff0000, // Rojo
    timestamp: new Date().toISOString(),
    footer: {
      text: 'MU Origen Level Checker',
    },
  };
  
  const payload = {
    username: 'MU Level Checker',
    avatar_url: 'https://origen.enterprise.net.ar/templates/arena/img/white-logo.png',
    embeds: [embed],
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error al enviar error a Discord:', error.message);
  }
}
