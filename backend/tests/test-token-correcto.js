#!/usr/bin/env node

/**
 * TEST - Generar token con FORMATO CORRECTO de Daily.co
 */

const crypto = require('crypto');

const API_KEY = '5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f';
const DOMAIN_ID = '6f1c5be1-2679-497b-a20f-0d1fd62d07a6';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createHmacSignature(message, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Crear header
const header = {
  typ: 'JWT',
  alg: 'HS256'
};

// Crear payload - FORMATO CORRECTO DAILY.CO
const now = Math.floor(Date.now() / 1000);
const exp = now + 3600;

const payload = {
  r: 'test-room',  // room name (claim corta!)
  d: DOMAIN_ID,    // domain id (claim corta!)
  iat: now,
  exp: exp,
};

console.log('\n' + '='.repeat(100));
console.log('✅ GENERANDO TOKEN - FORMATO CORRECTO DAILY.CO');
console.log('='.repeat(100));

console.log('\n📋 HEADER:');
console.log(JSON.stringify(header, null, 2));

console.log('\n📦 PAYLOAD (CLAIMS CORRECTAS):');
console.log(JSON.stringify(payload, null, 2));
console.log('\n   ⭐ Esto es DISTINTO a lo que teníamos antes!');
console.log('   - Antes: iss, sub, room_name, user_name, user_id, is_owner, nbf');
console.log('   - Ahora:  r, d, iat, exp  (claims CORTAS)');

// Codificar
const encodedHeader = base64UrlEncode(JSON.stringify(header));
const encodedPayload = base64UrlEncode(JSON.stringify(payload));

console.log('\n🔒 CODIFICADO:');
console.log('Header:', encodedHeader);
console.log('Payload:', encodedPayload);

// Crear firma
const messageToSign = `${encodedHeader}.${encodedPayload}`;
const signature = createHmacSignature(messageToSign, API_KEY);

console.log('\n✍️ FIRMA:');
console.log('Firma:', signature);

// Construir JWT
const token = `${encodedHeader}.${encodedPayload}.${signature}`;

console.log('\n🎟️ TOKEN JWT FINAL (CORRECTO):');
console.log(token);

console.log('\n✅ DIFERENCIAS IMPORTANTES:');
console.log('1. Token MÁS CORTO (menos datos en payload)');
console.log('2. Claims: r (room), d (domain_id), iat, exp');
console.log('3. NINGÚN user_name, user_id, is_owner (no son necesarios)');
console.log('4. Mismo algoritmo HS256, mismo API key como secret');

// Verificar decodificación
console.log('\n🔍 VERIFICACIÓN - DECODIFICANDO:');
try {
  const parts = token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  console.log('Payload decodificado:');
  console.log(JSON.stringify(decodedPayload, null, 2));
  console.log('✅ Token decodifica correctamente');
  
  // Verificar que no está expirado
  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = decodedPayload.exp < nowSec;
  console.log(`\n⏰ Expiración: ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`);
} catch (e) {
  console.error('❌ Error decodificando:', e.message);
}

console.log('\n' + '='.repeat(100));
console.log('✅ ESTE ES EL FORMATO QUE DAILY.CO ESPERA');
console.log('='.repeat(100) + '\n');
