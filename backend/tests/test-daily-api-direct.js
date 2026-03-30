#!/usr/bin/env node

/**
 * TEST HTTP DIRECTO - Llamar Daily.co API para crear token y ver error exacto
 */

const https = require('https');

const API_KEY = '5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f';
const DOMAIN = 'whatsappp.daily.co';

// Token de prueba que generamos
const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1Y2E4YmRkNGIzYzUwOTYwMWY2MGZhY2RmZDc4Y2E3ZjVmZDdjYmExYWYwYmIzMDJlZDI3MWUyMDNlMGMxYzBmIiwic3ViIjoidGVzdC1yb29tIiwicm9vbV9uYW1lIjoidGVzdC1yb29tIiwidXNlcl9uYW1lIjoiVGVzdFVzZXIiLCJ1c2VyX2lkIjoidGVzdC11c2VyLTEiLCJpc19vd25lciI6ZmFsc2UsImlhdCI6MTc2NTIzMzk0OSwibmJmIjoxNzY1MjMzOTQ5LCJleHAiOjE3NjUyMzc1NDl9.ocyDut-JE2JKxJ-QD3TMxPLipmwUcljEjrndVa1feZs';

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
    console.log('🔍 TEST DIRECTO - LLAMAR DAILY.CO API');
    console.log('='.repeat(100));

    // PASO 1: Crear sala
    console.log('\n📍 PASO 1: Crear sala de prueba');
    const roomRes = await makeRequest(
      'POST',
      '/v1/rooms',
      { 'Authorization': `Bearer ${API_KEY}` },
      { name: 'debug-test-room-' + Date.now() }
    );

    console.log('Status:', roomRes.status);
    console.log('Response:', JSON.stringify(roomRes.data, null, 2));

    if (roomRes.status !== 200) {
      console.error('❌ Error creando sala');
      return;
    }

    const roomName = roomRes.data.name;
    console.log('✅ Sala creada:', roomName);

    // PASO 2: Intentar validar el token con Daily.co API
    console.log('\n📍 PASO 2: Intentar validar token (si existe endpoint)');
    console.log('Token a validar:', testToken.substring(0, 50) + '...');

    // Intentar obtener información del token (si Daily.co lo permite)
    // Este endpoint podría no existir, pero intentaremos
    const tokenRes = await makeRequest(
      'GET',
      `/v1/rooms/${roomName}`,
      { 'Authorization': `Bearer ${API_KEY}` }
    );

    console.log('Información de la sala:');
    console.log(JSON.stringify(tokenRes.data, null, 2));

    // PASO 3: Intentar crear token via API
    console.log('\n📍 PASO 3: Intentar generar token via Daily.co API');
    const tokenCreateRes = await makeRequest(
      'POST',
      `/v1/rooms/${roomName}/tokens`,
      { 'Authorization': `Bearer ${API_KEY}` },
      {
        user_name: 'TestUser',
        user_id: 'test-user-1',
        is_owner: false
      }
    );

    console.log('Status:', tokenCreateRes.status);
    console.log('Response:', JSON.stringify(tokenCreateRes.data, null, 2));

    if (tokenCreateRes.status === 200 || tokenCreateRes.status === 201) {
      const generatedToken = tokenCreateRes.data.token;
      console.log('\n✅ Token generado por Daily.co API:');
      console.log('Token:', generatedToken.substring(0, 50) + '...');

      // Decodificar token para ver estructura
      try {
        const parts = generatedToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('\n📦 PAYLOAD del token de Daily.co:');
        console.log(JSON.stringify(payload, null, 2));
      } catch (e) {
        console.error('Error decodificando:', e.message);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(100));
}

main();
