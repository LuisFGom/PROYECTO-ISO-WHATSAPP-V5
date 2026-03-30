#!/usr/bin/env node

/**
 * SCRIPT DE DEBUG - PRUEBA VIDEOLLAMADA CON LOGGING
 * Este script simula lo que hace el frontend cuando intenta una videollamada
 * Captura todos los logs para diagnosticar el error "invalid-token"
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  try {
    log(colors.cyan + colors.bright, '\n' + '='.repeat(100));
    log(colors.cyan + colors.bright, '🧪 TEST DE VIDEOLLAMADA CON DEBUG DETALLADO');
    log(colors.cyan + colors.bright, '='.repeat(100));

    // PASO 1: Obtener/crear sala
    log(colors.blue, '\n📍 PASO 1: Crear o obtener sala de videollamada');
    log(colors.blue, '  GET /api/videocalls/room/test-debug-room');
    
    const roomRes = await makeRequest('GET', '/api/videocalls/room/test-debug-room');
    log(colors.green, '  ✅ Respuesta:', JSON.stringify(roomRes.data, null, 2));
    
    if (!roomRes.data.success) {
      log(colors.red, '  ❌ Error creating room');
      process.exit(1);
    }

    // PASO 2: Generar token
    log(colors.blue, '\n📍 PASO 2: Generar token JWT para la sala');
    log(colors.blue, '  GET /api/videocalls/token/test-debug-room?userName=TestUser');
    
    const tokenRes = await makeRequest('GET', '/api/videocalls/token/test-debug-room?userName=TestUser');
    log(colors.green, '  ✅ Respuesta recibida');
    
    if (!tokenRes.data.success || !tokenRes.data.token) {
      log(colors.red, '  ❌ Error generating token');
      log(colors.red, JSON.stringify(tokenRes.data, null, 2));
      process.exit(1);
    }

    const token = tokenRes.data.token;
    log(colors.yellow, '  🔐 Token generado (primeros 50 chars):');
    log(colors.yellow, '  ', token.substring(0, 50) + '...');
    log(colors.yellow, '  Longitud total:', token.length);

    // PASO 3: Decodificar token manualmente
    log(colors.blue, '\n📍 PASO 3: Decodificar token (análisis frontend)');
    
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        log(colors.green, '  ✅ Payload decodificado:');
        log(colors.green, '  ', JSON.stringify(payload, null, 2));
      }
    } catch (e) {
      log(colors.red, '  ❌ Error decodificando token:', e.message);
    }

    // PASO 4: Llamar endpoint de debug con el token
    log(colors.blue, '\n📍 PASO 4: Llamar endpoint de debug para análisis detallado');
    log(colors.blue, '  POST /api/videocalls/debug/token');
    
    const debugRes = await makeRequest('POST', '/api/videocalls/debug/token', { token });
    
    if (debugRes.data.success) {
      log(colors.green, '  ✅ Análisis del token:');
      log(colors.green, JSON.stringify(debugRes.data.decoded, null, 2));
      
      const valid = debugRes.data.decoded.valid;
      log(colors.yellow, '\n  📊 VALIDACIÓN:');
      log(valid.signatureMatch ? colors.green : colors.red, '    Firma válida:', valid.signatureMatch);
      log(valid.notExpired ? colors.green : colors.red, '    No expirado:', valid.notExpired);
      log(valid.issuerMatch ? colors.green : colors.red, '    Issuer correcto:', valid.issuerMatch);
    } else {
      log(colors.red, '  ❌ Error en debug endpoint');
    }

    // PASO 5: Mostrar URL de la sala
    log(colors.blue, '\n📍 PASO 5: URL de la sala');
    log(colors.yellow, '  ', tokenRes.data.roomUrl);

    // RESUMEN
    log(colors.cyan + colors.bright, '\n' + '='.repeat(100));
    log(colors.cyan + colors.bright, '✅ TEST COMPLETADO');
    log(colors.cyan + colors.bright, '='.repeat(100));
    log(colors.green, '\n✓ Sala creada exitosamente');
    log(colors.green, '✓ Token generado exitosamente');
    log(colors.green, '✓ Token pasado a endpoint de debug');
    
    log(colors.yellow, '\n🔑 TOKEN PARA USAR EN FRONTEND:');
    log(colors.yellow, token);
    
    log(colors.yellow, '\n🌐 DATOS PARA UNIRSE:');
    log(colors.yellow, '  roomUrl:', tokenRes.data.roomUrl);
    log(colors.yellow, '  token:', token.substring(0, 50) + '...');
    log(colors.yellow, '  userName: TestUser');

  } catch (error) {
    log(colors.red, '\n❌ ERROR:', error.message);
    log(colors.red, error.stack);
    process.exit(1);
  }
}

main();
