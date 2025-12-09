#!/usr/bin/env node

/**
 * TEST SIMPLE - Generar token y ver qué se crea
 */

const crypto = require('crypto');

// Usar la misma API key del .env
const API_KEY = '5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f';

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

// Crear payload
const now = Math.floor(Date.now() / 1000);
const exp = now + 3600;

const payload = {
  iss: API_KEY,  // ← API KEY como issuer
  sub: 'test-room',
  room_name: 'test-room',
  user_name: 'TestUser',
  user_id: 'test-user-1',
  is_owner: false,
  iat: now,
  nbf: now,
  exp: exp,
};

console.log('\n' + '='.repeat(80));
console.log('🔐 GENERANDO TOKEN - VERIFICACIÓN DETALLADA');
console.log('='.repeat(80));

console.log('\n📋 HEADER:');
console.log(JSON.stringify(header, null, 2));

console.log('\n📦 PAYLOAD:');
console.log(JSON.stringify(payload, null, 2));

// Codificar
const encodedHeader = base64UrlEncode(JSON.stringify(header));
const encodedPayload = base64UrlEncode(JSON.stringify(payload));

console.log('\n🔒 CODIFICADO:');
console.log('Header (base64url):', encodedHeader);
console.log('Payload (base64url):', encodedPayload);

// Crear firma
const messageToSign = `${encodedHeader}.${encodedPayload}`;
const signature = createHmacSignature(messageToSign, API_KEY);

console.log('\n✍️ FIRMA:');
console.log('Mensaje a firmar:', messageToSign);
console.log('Secret (API KEY):', API_KEY.substring(0, 20) + '...');
console.log('Firma generada:', signature);

// Construir JWT
const token = `${encodedHeader}.${encodedPayload}.${signature}`;

console.log('\n🎟️ TOKEN JWT FINAL:');
console.log(token);

console.log('\n📊 ESTADÍSTICAS:');
console.log('Longitud total:', token.length);
console.log('Partes:', token.split('.').length);

// Verificar decodificación
console.log('\n🔍 VERIFICACIÓN - DECODIFICANDO:');
try {
  const parts = token.split('.');
  const decodedHeader = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  console.log('Header decodificado:', JSON.stringify(decodedHeader, null, 2));
  console.log('Payload decodificado:', JSON.stringify(decodedPayload, null, 2));
  console.log('✅ Token decodifica correctamente');
} catch (e) {
  console.error('❌ Error decodificando:', e.message);
}

console.log('\n' + '='.repeat(80));
console.log('✅ TEST COMPLETADO');
console.log('='.repeat(80) + '\n');
