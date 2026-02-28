/**
 * MU Origen Level Checker - Cloudflare Worker
 * Se ejecuta cada 10 minutos automáticamente
 */

export default {
  /**
   * Handler para peticiones HTTP (opcional - para probar manualmente)
   */
  async fetch(request, env) {
    const result = await checkMULevel(env.MU_USERNAME, env.MU_PASSWORD);
    
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
    
    // Aquí puedes agregar lógica adicional como:
    // - Guardar en KV storage para mantener histórico
    // - Enviar notificación si el nivel cambió
    // - Enviar a webhook/Discord/Telegram
    
    if (result.success) {
      console.log(`✅ Personaje: ${result.character}, Nivel: ${result.level}, Master Resets: ${result.master_resets}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
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
