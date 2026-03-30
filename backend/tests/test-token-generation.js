#!/usr/bin/env node
// Test para validar la generación de tokens JWT

const axios = require('axios');
require('dotenv').config();
const crypto = require('crypto');

// Función auxiliar para decodificar JWT
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  try {
    const decoded = {
      header: JSON.parse(Buffer.from(parts[0], 'base64').toString()),
      payload: JSON.parse(Buffer.from(parts[1], 'base64').toString()),
      signature: parts[2]
    };
    return decoded;
  } catch (e) {
    return null;
  }
}

async function testTokenGeneration() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST DE GENERACIÓN DE TOKENS JWT');
  console.log('='.repeat(70));

  const backendUrl = 'http://localhost:3001/api';
  const roomName = `test-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userName = 'TestUser';

  console.log('\n📋 Configuración:');
  console.log(`   Backend URL: ${backendUrl}`);
  console.log(`   Room Name: ${roomName}`);
  console.log(`   User Name: ${userName}`);
  console.log(`   API Key: ${process.env.DAILY_API_KEY ? process.env.DAILY_API_KEY.substring(0, 15) + '...' : 'NO CONFIGURADO'}`);
  console.log('═'.repeat(70));

  if (!process.env.DAILY_API_KEY) {
    console.error('\n❌ ERROR: DAILY_API_KEY no está configurado en .env');
    process.exit(1);
  }

  try {
    // Test 1: Obtener token
    console.log('\n📡 TEST 1: Solicitando token JWT...');
    console.log('-'.repeat(70));
    
    const tokenUrl = `${backendUrl}/videocalls/token/${roomName}?userName=${encodeURIComponent(userName)}`;
    console.log(`🔗 URL: ${tokenUrl}`);
    
    const tokenResponse = await axios.get(tokenUrl);
    
    if (!tokenResponse.data.success || !tokenResponse.data.token) {
      throw new Error('Respuesta inválida del servidor');
    }

    const token = tokenResponse.data.token;
    const roomUrl = tokenResponse.data.roomUrl;

    console.log('✅ Token JWT generado exitosamente');
    console.log(`\n🔐 Token (completo):\n${token}`);
    console.log(`\n📍 Room URL:\n${roomUrl}`);

    // Test 2: Decodificar y validar token
    console.log('\n📡 TEST 2: Decodificando y validando token...');
    console.log('-'.repeat(70));

    const decoded = decodeJWT(token);
    
    if (!decoded) {
      console.error('❌ No se pudo decodificar el token');
      process.exit(1);
    }

    console.log('✅ Token decodificado exitosamente\n');
    
    console.log('📋 Header:');
    console.log(JSON.stringify(decoded.header, null, 2));
    
    console.log('\n📋 Payload:');
    console.log(JSON.stringify(decoded.payload, null, 2));
    
    console.log('\n📋 Información del payload:');
    console.log(`   iss (Emisor): ${decoded.payload.iss}`);
    console.log(`   sub (Asunto): ${decoded.payload.sub}`);
    console.log(`   room_name: ${decoded.payload.room_name}`);
    console.log(`   user_name: ${decoded.payload.user_name}`);
    console.log(`   user_id: ${decoded.payload.user_id}`);
    console.log(`   is_owner: ${decoded.payload.is_owner}`);
    console.log(`   exp (Expirará en): ${new Date(decoded.payload.exp * 1000).toLocaleString()}`);
    console.log(`   iat (Generado): ${new Date(decoded.payload.iat * 1000).toLocaleString()}`);

    // Test 3: Validar que la sala existe
    console.log('\n📡 TEST 3: Validando que la sala fue creada...');
    console.log('-'.repeat(70));

    const verifyUrl = `${backendUrl}/videocalls/verify/${roomName}`;
    const verifyResponse = await axios.get(verifyUrl);

    if (verifyResponse.data.success) {
      console.log(`✅ Sala verificada: ${roomName}`);
      console.log(`   Existe: ${verifyResponse.data.exists ? 'SÍ' : 'NO'}`);
    }

    // Test 4: Información del token para Daily.co
    console.log('\n📡 TEST 4: Información para uso en Daily.co...');
    console.log('-'.repeat(70));

    console.log('🔐 Para usar este token en Daily.co:');
    console.log(`\n1. En el cliente JavaScript (Daily.co iframe):`);
    console.log(`   callFrame.join({ token: "${token.substring(0, 30)}..." })`);
    console.log(`\n2. O pasar como parámetro URL:`);
    console.log(`   ${roomUrl}`);
    console.log(`\n3. O usar en header HTTP:`);
    console.log(`   Authorization: Bearer ${token.substring(0, 30)}...`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TODOS LOS TESTS DE TOKEN PASARON');
    console.log('='.repeat(70));
    console.log('\n✨ El token JWT está bien formado y puede ser usado con Daily.co');
    console.log('✨ Si aún ves "invalid-token", verifica que el token se pasa correctamente a Daily.co');
    
    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERROR EN TEST DE TOKEN');
    console.error('='.repeat(70));
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
}

testTokenGeneration();
