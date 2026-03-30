# 🎬 Guía de Uso - Videollamadas con Daily.co

## 📋 Tabla de Contenidos
1. [Instalación y Setup](#instalación-y-setup)
2. [Estructura de Salas](#estructura-de-salas)
3. [Flujo de Llamadas](#flujo-de-llamadas)
4. [Manejo de Reconexión](#manejo-de-reconexión)
5. [Debugging](#debugging)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Instalación y Setup

### 1. Instalar Dependencias del Backend
```bash
cd backend
npm install
# Esto instalará axios automáticamente
```

### 2. Configurar Variables de Entorno

**`backend/.env`:**
```env
# Daily.co Configuration
DAILY_API_KEY=tu_api_key_aqui
DAILY_DOMAIN=whatsappp.daily.co
```

**Obtener API Key:**
1. Ve a https://dashboard.daily.co
2. Crea una cuenta o inicia sesión
3. Genera una API key en "Developer Settings"
4. Copia el API key a tu .env

### 3. Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📊 Estructura de Salas

### Formato de Room Name
```
call-<timestamp>-<random-id>
```

**Ejemplo:**
```
call-1764983238427-lgks0p6j9
```

### URL Completa de Sala
```
https://whatsappp.daily.co/call-1764983238427-lgks0p6j9
```

### Flujo de Creación de Salas

```
Usuario A clica "Llamar a Usuario B"
    ↓
Frontend genera roomName único
    ↓
Socket.IO emite 'call:invite' con roomName
    ↓
Backend guarda roomName
    ↓
Usuario B recibe invitación con roomName
    ↓
Usuario B abre CallWindow
    ↓
Frontend consulta: GET /api/videocalls/room/{roomName}
    ↓
Backend consulta Daily.co API
    ↓
Daily.co crea la sala automáticamente
    ↓
Backend retorna URL: https://whatsappp.daily.co/{roomName}
    ↓
CallWindow carga Daily.co iframe
    ↓
✅ Llamada activa
```

---

## 📞 Flujo de Llamadas

### 1. Iniciar Llamada 1-a-1

**Frontend:**
```typescript
const { startCall } = useCallNotification();

// Cliquear botón "Llamar"
await startCall(receiverId, 'video');
```

**Backend (Socket.IO):**
```
Evento: 'call:invite'
Datos: {
  receiverId: 5,
  roomName: 'call-1764983238427-lgks0p6j9',
  callType: 'video'
}
```

### 2. Aceptar Llamada

**Frontend:**
```typescript
const { acceptCall } = useCallNotification();

// Usuario recibe invitación
// Cliquea "Aceptar"
await acceptCall();
```

**Backend:**
```
Evento: 'call:answer'
Datos: { callId: 123 }
```

### 3. Crear Sala en Daily.co

**Cuando CallWindow se monta:**

```typescript
// Frontend
const roomUrl = await dailyService.getRoomUrl(roomName);

// Backend endpoint
GET /api/videocalls/room/call-1764983238427-lgks0p6j9
↓
// Respuesta
{
  "success": true,
  "roomName": "call-1764983238427-lgks0p6j9",
  "roomUrl": "https://whatsappp.daily.co/call-1764983238427-lgks0p6j9",
  "domain": "whatsappp.daily.co"
}
```

### 4. Finalizar Llamada

**Frontend:**
```typescript
const { endCall } = useCallNotification();

// Usuario clica "Colgar"
await endCall();
```

**Backend:**
```
Evento: 'call:end'
Datos: { callId: 123, duration: 300 }
```

---

## 🔄 Manejo de Reconexión

### Estados de Conexión

```
CONECTADO (✅ Verde)
    ↓
    [Pérdida de Internet/Red]
    ↓
RECONECTANDO (⚠️ Amarillo - Animación)
    ↓ (30 segundos)
    ├─→ Se recupera conexión → Vuelve a CONECTADO
    └─→ No se recupera → DESCONECTADO (❌ Rojo)
```

### Timeline de Reconexión

```
T=0s:  ❌ Conexión perdida
       ⏳ Daily.co muestra overlay "Problemas de conexión"
       ⏳ Intentando reconectar...

T=15s: 📡 Socket.IO intenta reconectar
       ⏳ Esperando reconexión... (15s restantes)

T=30s: ⏰ Timeout alcanzado
       📴 Llamada finalizada automáticamente
       💬 Mensaje en chat: "Llamada finalizada por problemas de conexión"
```

### Componente ConnectionStatusOverlay

```typescript
// Ubicación: frontend/src/presentation/components/ConnectionStatusOverlay.tsx

<ConnectionStatusOverlay
  status="reconnecting"  // 'connected' | 'reconnecting' | 'disconnected'
  isVisible={true}
  timeoutSeconds={30}
/>
```

---

## 🐛 Debugging

### Logs en Frontend

**Abre Console en DevTools (F12):**

```
✅ Información de conexión:
[TIMESTAMP] ✅ Socket conectado
[TIMESTAMP] 🔐 Autenticado: {userId: 4, socketId: 'xxx'}

📱 Información de llamada:
[TIMESTAMP] 🔵 Iniciando llamada con roomName: call-123-abc
[TIMESTAMP] 📍 URL completa de sala: https://whatsappp.daily.co/call-123-abc
[TIMESTAMP] ✅ Frame de Daily.co creado exitosamente

❌ Errores:
[TIMESTAMP] ❌ Error al iniciar llamada: [mensaje]
[TIMESTAMP] ❌ Error al finalizar llamada: [mensaje]
```

### Logs en Backend

```bash
npm run dev
```

**Buscar por:**
- `📹 [VIDEOCALLS]` - Rutas de videollamadas
- `🎨 Creando sala Daily.co` - Creación de salas
- `❌ Error creando sala Daily.co` - Errores

### Verificar Configuración

**Frontend:**
```javascript
// En Console:
socketService.isConnected
// Debe retornar: true
```

**Backend:**
```bash
# Probar endpoint
curl http://localhost:3001/api/videocalls/config/status
```

**Respuesta esperada:**
```json
{
  "success": true,
  "configured": true,
  "domain": "whatsappp.daily.co",
  "message": "✅ Daily.co configurado correctamente"
}
```

---

## 🛠️ Troubleshooting

### Error: "The meeting you're trying to join does not exist"

**Causa:** Backend no está creando salas en Daily.co

**Solución:**
1. Verificar que `DAILY_API_KEY` es válida
2. Verificar que `DAILY_DOMAIN` existe en Daily.co
3. Verificar que backend está corriendo
4. Consultar logs del backend

### Error: "No autenticado"

**Causa:** Token JWT expirado o no válido

**Solución:**
1. Recarga la página
2. Inicia sesión de nuevo
3. Verifica que JWT_SECRET en backend es correcto

### Llamada se desconecta después de 30 segundos

**Causa:** Timeout de reconexión activado

**Solución:**
1. Verifica conexión a internet
2. Verifica que backend está corriendo
3. Revisa logs de Socket.IO en backend
4. Aumenta timeout en `CallWindow.tsx` si es necesario:
```typescript
// Cambiar de 30000ms a 60000ms (60 segundos)
reconnectionTimerRef.current = window.setTimeout(() => {
  // ...
}, 60000);  // ← Aquí
```

### No veo el overlay de reconexión

**Causa:** Componente no se importó correctamente

**Solución:**
1. Verifica que `CallWindow.tsx` importa `ConnectionStatusOverlay`
2. Verifica que `connectionStatus` state se actualiza:
```typescript
setConnectionStatus('reconnecting');
```

### Daily.co no muestra video

**Causa:** Navegador bloqueó acceso a cámara

**Solución:**
1. Ve a configuración del navegador
2. Permite acceso a cámara/micrófono para localhost
3. Recarga la página

---

## 🔐 Seguridad

### Tokens JWT
- Se envían en header `Authorization: Bearer <token>`
- Se validan en middleware `authMiddleware`
- Expiran cada 7 días (configurable en `.env`)

### Salas de Daily.co
- Son privadas por defecto
- Se crean bajo demanda
- Se eliminan después de 24 horas (configurable)
- Soportan máximo 100 participantes (configurable)

### Encriptación
- Mensajes se encriptan con `ENCRYPTION_KEY`
- Socket.IO usa WebSocket seguro (WSS en producción)

---

## 📱 Testear Localmente

### Opción 1: Dos Navegadores
```bash
# Terminal 1
cd frontend
npm run dev

# Abre http://localhost:5173 en dos ventanas (usuario A y B)
# Login con cuentas diferentes
# Prueba llamadas
```

### Opción 2: Otro Dispositivo en Red Local

```bash
# Obtener IP local
ipconfig  # Windows
# o
ifconfig  # Linux/Mac

# En Vite config, permitir acceso externo:
# Editar frontend/vite.config.ts:
export default defineConfig({
  server: {
    host: '0.0.0.0',  // ← Agregar esto
    port: 5173,
  }
})

# Acceder desde otro dispositivo:
http://[tu-ip-local]:5173
```

---

## 📊 Monitoreo en Producción

### Verificar que Daily.co está activo:
```bash
curl -H "Authorization: Bearer <DAILY_API_KEY>" \
  https://api.daily.co/v1/rooms
```

### Ver uso de API:
https://dashboard.daily.co → "Usage"

### Alertas recomendadas:
- Alertar si tasa de fallos en creación de salas > 5%
- Alertar si timeout de reconexión se activa frecuentemente

---

## 🎯 Resumen de Endpoints

| Método | Ruta | Autenticado | Descripción |
|--------|------|-------------|-------------|
| GET | `/api/videocalls/room/:roomName` | ✅ | Obtener/crear sala |
| GET | `/api/videocalls/verify/:roomName` | ❌ | Verificar existencia |
| GET | `/api/videocalls/url/:roomName` | ❌ | Obtener URL |
| DELETE | `/api/videocalls/room/:roomName` | ✅ | Eliminar sala |
| GET | `/api/videocalls/config/status` | ❌ | Verificar config |

---

## 📚 Recursos Útiles

- 📖 [Documentación Daily.co](https://docs.daily.co)
- 🔑 [Dashboard Daily.co](https://dashboard.daily.co)
- 🚀 [Socket.IO Docs](https://socket.io/docs/)
- 💻 [React Docs](https://react.dev)

---

**Última actualización:** 8 de Diciembre, 2025
**Versión:** 1.0.0
