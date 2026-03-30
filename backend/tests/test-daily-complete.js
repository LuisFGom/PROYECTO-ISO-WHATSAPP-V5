#!/usr/bin/env node
// Test completo de Daily.co configuración

const axios = require('axios');
require('dotenv').config();

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST COMPLETO DE CONFIGURACIÓN DAILY.CO');
  console.log('='.repeat(70));

  const apiKey = process.env.DAILY_API_KEY;
  const domain = process.env.DAILY_DOMAIN;
  const apiUrl = 'https://api.daily.co/v1';

  // Test 1: Verificar que las variables están configuradas
  console.log('\n📋 TEST 1: Verificar variables de entorno');
  console.log('-'.repeat(70));
  
  if (!apiKey) {
    console.error('❌ DAILY_API_KEY no está configurado en .env');
    process.exit(1);
  }
  if (!domain) {
    console.error('❌ DAILY_DOMAIN no está configurado en .env');
    process.exit(1);
  }

  console.log(`✅ DAILY_API_KEY: ${apiKey.substring(0, 15)}...`);
  console.log(`✅ DAILY_DOMAIN: ${domain}`);

  // Test 2: Verificar que el API key es válido
  console.log('\n📋 TEST 2: Validar API key con Daily.co');
  console.log('-'.repeat(70));

  try {
    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`🔗 Conectando a: ${apiUrl}`);
    const listResponse = await client.get('/rooms?limit=1');
    console.log(`✅ API key es VÁLIDO`);
    console.log(`📊 Salas en el sistema: ${listResponse.data.total_count}`);
  } catch (error) {
    console.error(`❌ API key NO es válido`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.response?.data?.error?.message || error.message}`);
    process.exit(1);
  }

  // Test 3: Intentar crear una sala de prueba
  console.log('\n📋 TEST 3: Crear sala de prueba');
  console.log('-'.repeat(70));

  try {
    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const testRoomName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔨 Nombre de sala: ${testRoomName}`);
    console.log(`📤 Enviando payload...`);

    const payload = {
      name: testRoomName,
      privacy: 'public',
    };

    console.log(`Payload:`, JSON.stringify(payload, null, 2));

    const createResponse = await client.post('/rooms', payload);
    
    console.log(`✅ Sala CREADA exitosamente`);
    console.log(`📍 Room Name: ${createResponse.data.name}`);
    console.log(`📍 Room ID: ${createResponse.data.id}`);
    console.log(`📍 Room URL: ${createResponse.data.url}`);
    console.log(`🔐 Privacy: ${createResponse.data.privacy}`);

    // Test 4: Obtener la sala que creamos
    console.log('\n📋 TEST 4: Obtener sala creada');
    console.log('-'.repeat(70));

    const getResponse = await client.get(`/rooms/${testRoomName}`);
    console.log(`✅ Sala OBTENIDA exitosamente`);
    console.log(`📍 Room Name: ${getResponse.data.name}`);

    // Test 5: Eliminar la sala de prueba
    console.log('\n📋 TEST 5: Eliminar sala de prueba');
    console.log('-'.repeat(70));

    await client.delete(`/rooms/${testRoomName}`);
    console.log(`✅ Sala ELIMINADA exitosamente`);

    // Test 6: Crear sala con el nombre sanitizado
    console.log('\n📋 TEST 6: Crear sala con nombre típico del proyecto');
    console.log('-'.repeat(70));

    const projectRoomName = `call-${Date.now()}-abc123xyz`;
    console.log(`🔨 Nombre de sala: ${projectRoomName}`);

    const projectPayload = {
      name: projectRoomName,
      privacy: 'public',
    };

    const projectResponse = await client.post('/rooms', projectPayload);
    console.log(`✅ Sala CREADA exitosamente`);
    console.log(`📍 Room URL: ${projectResponse.data.url}`);

    // Limpiar
    await client.delete(`/rooms/${projectRoomName}`);
    console.log(`✅ Sala de prueba eliminada`);

  } catch (error) {
    console.error(`\n❌ ERROR CREANDO SALA`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Status Text: ${error.response?.statusText}`);
    console.error(`Error Type: ${error.response?.data?.error?.type}`);
    console.error(`Error Message: ${error.response?.data?.error?.message}`);
    console.error(`Full Error Data:`, JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.error('\n💡 SOLUCIONES PARA ERROR 400:');
      console.error('1. Verifica que el nombre de la sala sea válido (a-z, 0-9, -, _)');
      console.error('2. Verifica que no uses caracteres especiales');
      console.error('3. Verifica que el API key sea correcto');
      console.error('4. Intenta con un nombre más simple: "test-room-1"');
    }
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
  console.log('='.repeat(70));
  console.log('\n🎉 Daily.co está configurado correctamente y funcionando');
  process.exit(0);
}

runTests().catch(error => {
  console.error('❌ Error inesperado:', error);
  process.exit(1);
});
