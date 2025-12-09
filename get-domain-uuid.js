#!/usr/bin/env node

/**
 * OBTENER DOMAIN UUID - Necesario para generar tokens válidos
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
    console.log('🔍 OBTENIENDO DOMAIN UUID DE DAILY.CO');
    console.log('='.repeat(100));

    // Obtener información del dominio
    const res = await makeRequest(
      'GET',
      '/v1/domains',
      { 'Authorization': `Bearer ${API_KEY}` }
    );

    console.log('\nStatus:', res.status);
    console.log('\nResponse:');
    console.log(JSON.stringify(res.data, null, 2));

    if (res.data.data && res.data.data.length > 0) {
      const domain = res.data.data[0];
      console.log('\n✅ DOMAIN ENCONTRADO:');
      console.log('  Nombre:', domain.domain_name);
      console.log('  ID/UUID:', domain.id);
      console.log('  API Key Hash:', domain.api_key_hash);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(100));
}

main();
