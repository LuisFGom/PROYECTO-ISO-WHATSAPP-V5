#!/usr/bin/env node
// backend/test-daily-api.js - Script para probar Daily.co API

const axios = require('axios');
require('dotenv').config();

async function testDailyAPI() {
  console.log('🧪 PRUEBA DE CONFIGURACIÓN DAILY.CO\n');
  console.log('═'.repeat(60));

  const apiKey = process.env.DAILY_API_KEY;
  const domain = process.env.DAILY_DOMAIN;
  const apiUrl = 'https://api.daily.co/v1';

  console.log('📋 Configuración:');
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : '❌ NO CONFIGURADO'}`);
  console.log(`   Domain: ${domain || '❌ NO CONFIGURADO'}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log('═'.repeat(60) + '\n');

  if (!apiKey) {
    console.error('❌ ERROR: DAILY_API_KEY no está configurado en .env');
    process.exit(1);
  }

  if (!domain) {
    console.error('❌ ERROR: DAILY_DOMAIN no está configurado en .env');
    process.exit(1);
  }

  try {
    // Test 1: Verificar que el API key es válido
    console.log('📡 Test 1: Verificando API key...');
    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const listResponse = await client.get('/rooms');
    console.log(`✅ API Key VÁLIDO`);
    console.log(`   Salas existentes: ${listResponse.data.data ? listResponse.data.data.length : 0}`);
    console.log('');

    // Test 2: Intentar crear una sala de prueba
    console.log('📡 Test 2: Intentando crear sala de prueba...');
    const testRoomName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const roomPayload = {
      name: testRoomName,
      privacy: 'private',
    };

    console.log(`   Nombre de sala: ${testRoomName}`);
    console.log(`   Payload:`, JSON.stringify(roomPayload, null, 2));

    const createResponse = await client.post('/rooms', roomPayload);
    
    console.log(`✅ Sala CREADA exitosamente`);
    console.log(`   Room Name: ${createResponse.data.name}`);
    console.log(`   Room URL: ${createResponse.data.url}`);
    console.log(`   Room ID: ${createResponse.data.id}`);
    console.log('');

    // Test 3: Obtener la sala que creamos
    console.log('📡 Test 3: Obteniendo sala creada...');
    const getResponse = await client.get(`/rooms/${testRoomName}`);
    console.log(`✅ Sala OBTENIDA exitosamente`);
    console.log(`   Room Name: ${getResponse.data.name}`);
    console.log('');

    // Test 4: Eliminar la sala de prueba
    console.log('📡 Test 4: Eliminando sala de prueba...');
    await client.delete(`/rooms/${testRoomName}`);
    console.log(`✅ Sala ELIMINADA exitosamente`);
    console.log('');

    console.log('═'.repeat(60));
    console.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
    console.log('═'.repeat(60));
    console.log('\n🎉 Daily.co está configurado correctamente y funcionando');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR DURANTE EL TEST');
    console.error('Status Code:', error.response?.status);
    console.error('Error Message:', error.response?.data?.error?.message || error.message);
    console.error('Error Data:', error.response?.data);
    console.error('');
    console.error('📋 CAUSAS POSIBLES:');
    console.error('   1. API Key es incorrecto o expiró');
    console.error('   2. API Key no tiene permisos suficientes');
    console.error('   3. Daily.co API está en mantenimiento');
    console.error('   4. Hay un firewall/proxy bloqueando la conexión');
    console.error('');
    console.error('🔧 SOLUCIONES:');
    console.error('   1. Verifica que DAILY_API_KEY en .env es correcto');
    console.error('   2. Genera un nuevo API key en https://dashboard.daily.co');
    console.error('   3. Verifica tu conexión a internet');
    process.exit(1);
  }
}

testDailyAPI();
