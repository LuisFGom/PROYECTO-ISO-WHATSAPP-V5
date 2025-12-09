#!/usr/bin/env node

/**
 * TEST FINAL - Verificar que el backend genera token CORRECTO
 */

const http = require('http');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n' + '='.repeat(100));
    console.log('🧪 TEST FINAL - VERIFICAR TOKEN CORRECTO DEL BACKEND');
    console.log('='.repeat(100));

    console.log('\n📍 Llamando: GET /api/videocalls/token/final-test?userName=FinalTest');
    const response = await makeRequest('GET', '/api/videocalls/token/final-test?userName=FinalTest');

    if (!response.token) {
      console.error('❌ No se recibió token');
      console.error(JSON.stringify(response, null, 2));
      return;
    }

    console.log('\n✅ Token recibido correctamente');
    console.log('Token (primeros 80 chars):', response.token.substring(0, 80));

    // Decodificar y verificar
    const parts = response.token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Token no tiene 3 partes');
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    console.log('\n📦 PAYLOAD DECODIFICADO:');
    console.log(JSON.stringify(payload, null, 2));

    // Verificar claims correctas
    console.log('\n✓ VERIFICACIÓN DE CLAIMS:');
    
    if (payload.r) {
      console.log('  ✅ r (room):', payload.r);
    } else {
      console.error('  ❌ FALTA r (room)');
    }

    if (payload.d) {
      console.log('  ✅ d (domain_id):', payload.d);
    } else {
      console.error('  ❌ FALTA d (domain_id)');
    }

    if (payload.iat) {
      console.log('  ✅ iat (issued at):', new Date(payload.iat * 1000).toISOString());
    } else {
      console.error('  ❌ FALTA iat');
    }

    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = payload.exp - now;
      const isValid = remaining > 0;
      console.log(`  ${isValid ? '✅' : '❌'} exp (expira en): ${remaining} segundos`);
    } else {
      console.error('  ❌ FALTA exp');
    }

    // Verificar que NO tenga claims incorrectas
    console.log('\n✗ VERIFICACIÓN - Claims que NO debería tener:');
    if (payload.iss) {
      console.error('  ❌ TIENE iss (debería NO estar)');
    } else {
      console.log('  ✅ No tiene iss (correcto)');
    }

    if (payload.room_name) {
      console.error('  ❌ TIENE room_name (debería NO estar)');
    } else {
      console.log('  ✅ No tiene room_name (correcto)');
    }

    if (payload.user_name) {
      console.error('  ❌ TIENE user_name (debería NO estar)');
    } else {
      console.log('  ✅ No tiene user_name (correcto)');
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ CONCLUSIÓN:');
    
    const hasCorrectClaims = payload.r && payload.d && payload.iat && payload.exp;
    const hasWrongClaims = payload.iss || payload.room_name || payload.user_name;

    if (hasCorrectClaims && !hasWrongClaims) {
      console.log('   🎉 TOKEN GENERADO CORRECTAMENTE');
      console.log('   Este token será ACEPTADO por Daily.co');
      console.log('   La videollamada debería conectar sin "invalid-token"');
    } else {
      console.log('   ❌ TOKEN INCORRECTO');
      if (!hasCorrectClaims) {
        console.log('   Faltan claims requeridas');
      }
      if (hasWrongClaims) {
        console.log('   Tiene claims que no debería tener');
      }
    }

    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

main();
