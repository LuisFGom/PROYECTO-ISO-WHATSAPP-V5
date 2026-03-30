# 🔧 Guía de Diagnóstico - Error HTTP 400 en Videollamadas

## El Problema
```
❌ No se pudo obtener la sala: Request failed with status code 400
```

## Causas Posibles

### 1️⃣ **API Key Inválido o Expirado** (MÁS COMÚN)
```
backend/.env
DAILY_API_KEY=5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f
```

**Cómo verificar:**
```bash
# En la carpeta backend
npm run test:daily
# o
node test-daily-complete.js
```

**Si falla:**
1. Ve a https://dashboard.daily.co/developers
2. Copia tu API key completo (sin truncar)
3. Actualiza `.env` con la nueva clave
4. Reinicia el backend

### 2️⃣ **Nombre de Sala con Caracteres Inválidos**

Daily.co acepta SOLO estos caracteres:
- ✅ Letras: a-z, A-Z
- ✅ Números: 0-9
- ✅ Guiones: `-`
- ✅ Guiones bajos: `_`

❌ NO acepta:
- Espacios
- Caracteres especiales: `@`, `#`, `!`, `(`, `)`, etc.
- Acentos: `á`, `é`, `ñ`, etc.

**Solución:** El backend ahora sanitiza automáticamente el nombre:
```typescript
const sanitizedName = roomName
  .replace(/[^a-zA-Z0-9-_]/g, '-')
  .toLowerCase();
```

### 3️⃣ **Rate Limiting o Límite de Salas**

Daily.co tiene límites según tu plan:
- **Plan Free**: 1 sala activa a la vez
- **Plan Pro**: 100 salas activas
- **Rate Limit**: 50 solicitudes/minuto

**Solución:** Espera 30 segundos antes de crear nueva sala

### 4️⃣ **Problema de Red o Conectividad**

Si el error ocurre esporádicamente, puede ser:
- Conexión inestable
- Timeout de la API
- Problema temporal de Daily.co

**Solución:** El código ya intenta reconectar automáticamente

## Paso a Paso: Diagnosticar el Problema

### Paso 1: Verifica que el Backend está corriendo
```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Server running on port 3001
✅ Database connected successfully
```

### Paso 2: Ejecuta el test de Daily.co
```bash
cd backend
node test-daily-complete.js
```

**Resultados esperados:**
```
✅ TEST 1: Verificar variables de entorno ✅
✅ TEST 2: Validar API key ✅
✅ TEST 3: Crear sala de prueba ✅
✅ TEST 4: Obtener sala ✅
✅ TEST 5: Eliminar sala ✅
✅ TEST 6: Crear sala con nombre típico ✅

✅ TODOS LOS TESTS PASARON EXITOSAMENTE
```

Si alguno falla, aquí están las soluciones:

#### Error en TEST 1: Variables no configuradas
```
Solución: Abre backend/.env y asegúrate que tiene:
DAILY_API_KEY=tu_api_key_aqui
DAILY_DOMAIN=whatsappp.daily.co
```

#### Error en TEST 2: API key inválido
```
Status: 401 Unauthorized

Solución:
1. Ve a https://dashboard.daily.co/developers
2. Copia el API key completo
3. Actualiza backend/.env
4. Guarda y reinicia backend
```

#### Error en TEST 3: 400 Bad Request
```
Error Type: invalid-parameters

Soluciones:
1. Verifica que usas el URL correcto: https://api.daily.co/v1
2. Verifica que el payload esté bien formado
3. Prueba con un nombre más simple: "test-room-1"
```

### Paso 3: Verifica los logs del backend durante una llamada

Cuando inicies una videollamada desde el frontend, deberías ver en la terminal:

```
============================================================
🎬 SOLICITUD DE VIDEOLLAMADA
============================================================
📍 Room Name: call-1765212823256-uispaf5g6
🔐 Usuario ID: ANÓNIMO
🔑 API Key configurado: SÍ
🌐 Dominio: whatsappp.daily.co
🔄 Llamando a dailyService.getOrCreateRoom()...

============================================================
🔄 INICIANDO GET-OR-CREATE ROOM
============================================================
📍 Room Name solicitado: call-1765212823256-uispaf5g6
📝 Room Name sanitizado: call-1765212823256-uispaf5g6

📌 PASO 1: Buscando sala existente...
ℹ️ Sala no existe aún (404) - procederemos a crear

📌 PASO 2: Creando sala nueva...
🔨 Llamando a createRoom()...
✅ Sala creada exitosamente
📍 URL: https://whatsappp.daily.co/call-1765212823256-uispaf5g6
============================================================
```

### Paso 4: Si aún hay error 400, captura los logs detallados

Busca en la terminal del backend:
```
============================================================
❌ ERROR CREANDO SALA EN DAILY.CO
============================================================
❌ Room Name: ...
❌ Status code: 400
❌ Error Type: ...
❌ Error Message: ...
❌ Full Error Data: ...
============================================================
```

**Copia todo esto y analiza:**

| Error Type | Causa | Solución |
|-----------|-------|----------|
| `invalid-parameters` | Nombre inválido o payload malo | Verifica caracteres válidos |
| `unauthorized` | API key incorrecto | Actualiza `.env` |
| `invalid-api-key` | API key expirado o inválido | Obtén nuevo en dashboard |
| `forbidden` | No tienes permisos | Verifica plan de Daily.co |
| `rate-limit` | Demasiadas solicitudes | Espera y reintenta |

## Soluciones Rápidas

### Opción 1: Actualizar API Key
```bash
# 1. Ve a https://dashboard.daily.co/developers
# 2. Copia el API key
# 3. Edita backend/.env:
DAILY_API_KEY=NUEVO_API_KEY_AQUI

# 4. Guarda y reinicia
npm run dev
```

### Opción 2: Limpiar Salas Antiguas
A veces hay salas "fantasma" que bloquean.

En https://dashboard.daily.co/rooms, elimina salas antiguas que no uses.

### Opción 3: Cambiar Nombre de Sala
Si el nombre actual causa problemas, prueba con uno más simple:
```typescript
// Antes
const roomName = `call-${Date.now()}-${randomId}`;

// Después (temporalmente, para probar)
const roomName = `test-room-${Math.random().toString(36).substr(2, 5)}`;
```

### Opción 4: Resetear Todo
```bash
# 1. Detener backend
Ctrl+C

# 2. En Daily.co dashboard, eliminar TODAS las salas

# 3. Reiniciar backend
npm run dev

# 4. Probar nuevamente
```

## Checklist Final ✅

Antes de hacer una videollamada, verifica:

- [ ] Backend está corriendo: `npm run dev`
- [ ] Frontend está corriendo: `npm run dev`
- [ ] API key en `.env` es correcto
- [ ] `node test-daily-complete.js` pasa sin errores
- [ ] Logs del backend muestran "✅ Sala creada exitosamente"
- [ ] Chrome permite acceso a cámara/micrófono
- [ ] WebRTC no está bloqueado en navegador

## Debugging Avanzado

Si todavía hay problemas:

### Verificar Chrome permite WebRTC
```
chrome://settings/content/camera
chrome://settings/content/microphone
```

Asegúrate que:
- ✅ Cámara está permitida
- ✅ Micrófono está permitido
- ✅ Tu dominio/IP es permitido

### Verificar que no hay bloqueos WebRTC
```
chrome://flags/#enable-webrtc-hide-local-ips-with-mdns
```

Ponlo en **Disabled**.

### Test de WebRTC
Abre en Chrome:
```
https://test.webrtc.org/
```

Presiona "Start" - si falla, el problema es tu navegador/red.

## Contactar Soporte

Si nada funciona:

1. **Daily.co Support**: https://daily.co/contact
2. **Este proyecto**: Revisa los logs completos en backend terminal

---

**Última actualización:** Diciembre 8, 2025
**Estado:** Todas las mejoras aplicadas y probadas
