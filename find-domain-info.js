#!/usr/bin/env node

/**
 * OBTENER DOMAIN UUID - Intentar diferentes endpoints
 */

const https = require('https');

const API_KEY = '5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f';

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.daily.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
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
    console.log('\n' + '='.repeat(100));
    console.log('🔍 INTENTANDO OBTENER INFORMACIÓN DEL API');
    console.log('='.repeat(100));

    // Intentar 1: /v1
    console.log('\n📍 Intento 1: GET /v1');
    let res = await makeRequest('GET', '/v1', { 'Authorization': `Bearer ${API_KEY}` });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2).substring(0, 500));

    // Intentar 2: /v1/accounts
    console.log('\n📍 Intento 2: GET /v1/accounts');
    res = await makeRequest('GET', '/v1/accounts', { 'Authorization': `Bearer ${API_KEY}` });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));

    // Intentar 3: Buscar uuid en documentación
    // El domain UUID usualmente está visible en el dashboard 
    // O puede generarse basado en el nombre del domain
    console.log('\n' + '='.repeat(100));
    console.log('ℹ️  NOTA: El Domain UUID generalmente se encuentra en el Dashboard de Daily.co');
    console.log('   Opción: Puede ser derivado del nombre del domain "whatsappp.daily.co"');
    console.log('   O estar en: Settings > API > Domain ID en el dashboard');
    console.log('='.repeat(100));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

main();
