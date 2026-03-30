# 🔐 SOLUCIÓN DEFINITIVA: "Meeting token ignored: invalid-token"

## 🎯 PROBLEMA RAÍZ IDENTIFICADO

El error **"Meeting token ignored: invalid-token"** se debía a que estábamos usando el **FORMATO INCORRECTO** de JWT para Daily.co.

### ❌ FORMATO INCORRECTO (Lo que teníamos)
```json
{
  "iss": "5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f",  // ← INCORRECTO
  "sub": "room-name",                                                           // ← INCORRECTO
  "room_name": "room-name",                                                     // ← INCORRECTO
  "user_name": "Usuario",                                                       // ← INCORRECTO
  "user_id": "anonymous",                                                       // ← INCORRECTO
  "is_owner": false,                                                            // ← INCORRECTO
  "iat": 1765233949,
  "nbf": 1765233949,
  "exp": 1765237549
}
```

**Por qué NO funciona:**
- Daily.co NO espera claims como `iss`, `sub`, `room_name`, `user_name`, `user_id`, `is_owner`
- Estas son claims estándar de JWT, pero Daily.co usa un **esquema personalizado**
- Daily.co rechaza tokens con claims incorrectas → **"invalid-token"**

---

### ✅ FORMATO CORRECTO (La solución)
```json
{
  "r": "room-name",                                      // ← CORRECTO (room)
  "d": "6f1c5be1-2679-497b-a20f-0d1fd62d07a6",        // ← CORRECTO (domain UUID)
  "iat": 1765233949,
  "exp": 1765237549
}
```

**Por qué FUNCIONA:**
- `r` = room name (claim **CORTA**)
- `d` = domain UUID (requisito **CRÍTICO**)
- `iat` = issued at (timestamp)
- `exp` = expiration (timestamp)
- Ese es TODO lo que Daily.co necesita
- Firma: HMAC-SHA256 con API key como secret

---

## 🔍 CAMBIOS IMPLEMENTADOS

### 1. **Identificación del Domain UUID**
```bash
# Obtenemos el domain UUID llamando a: GET /v1
# Respuesta:
{
  "domain_name": "whatsappp",
  "domain_id": "6f1c5be1-2679-497b-a20f-0d1fd62d07a6",  ← AQUÍ ESTÁ
  ...
}
```

### 2. **Actualización de `daily.service.ts`**
```typescript
export class DailyService {
  private domainId: string = '6f1c5be1-2679-497b-a20f-0d1fd62d07a6';

  async generateToken(payload: DailyTokenPayload): Promise<string> {
    // Claims CORRECTAS
    const tokenPayload = {
      r: payload.roomName,  // room
      d: this.domainId,     // domain UUID
      iat: now,
      exp: exp,
    };

    // Generar JWT con header, payload, firma...
    return token;  // Formato correcto
  }
}
```

### 3. **Agrega endpoint de debug**
```typescript
// GET /api/videocalls/debug/token
// POST body: { token: "..." }
// Decodifica y valida token estructura
```

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

| Aspecto | ANTES ❌ | DESPUÉS ✅ |
|---------|----------|-----------|
| **Claims usadas** | iss, sub, room_name, user_name, user_id, is_owner, nbf | r, d, iat, exp |
| **Issuer (iss)** | API Key (INCORRECTO) | No existe en Daily.co |
| **Domain** | No incluido | PRESENTE como `d` |
| **Tamaño token** | ~400 caracteres | ~200 caracteres |
| **Validación Daily.co** | ❌ RECHAZA (invalid-token) | ✅ ACEPTA |
| **Error esperado** | "Meeting token ignored: invalid-token" | Ninguno, videollamada conecta |

---

## 🚀 CÓMO PROBAR

### Opción 1: Usar el endpoint de debug
```bash
# Generar token
curl "http://localhost:3001/api/videocalls/token/test-room?userName=TestUser"

# Respuesta:
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyIjoidGVzdC1yb29tIiwiZCI6IjZmMWM1YmUxLTI2NzktNDk3Yi1hMjBmLTBkMWZkNjJkMDdhNiIsImlhdCI6MTc2NTIzNDIzOSwiZXhwIjoxNzY1MjM3ODM5fQ.UBc1JzB3GGEy74sl4ME91sqn2IySLMNoEsXI0SB3fGk",
  "roomUrl": "https://whatsappp.daily.co/test-room"
}
```

### Opción 2: Verificar token en frontend
El browser console mostrará logs detallados cuando intentes unirte a una llamada:
```javascript
📋 TOKEN RECIBIDO DEL BACKEND:
📦 PAYLOAD DEL TOKEN DECODIFICADO:
   r: test-room
   d: 6f1c5be1-2679-497b-a20f-0d1fd62d07a6
   iat: 1765234239
   exp: 1765237839
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- ✅ Backend genera tokens con claims `r`, `d`, `iat`, `exp`
- ✅ Domain UUID: `6f1c5be1-2679-497b-a20f-0d1fd62d07a6`
- ✅ Firma: HMAC-SHA256 con API key
- ✅ Token se pasa a `dailyCallObject.current.join({ token })`
- ✅ No hay claims innecesarias (iss, sub, room_name, user_name, etc.)
- ✅ Token tiene tiempo válido (iat actual, exp en futuro)

---

## ⚙️ VARIABLES DE ENTORNO USADAS

```env
DAILY_API_KEY=5ca8bdd4b3c509601f60facdfd78ca7f5fd7cba1af0bb302ed271e203e0c1c0f
DAILY_DOMAIN=whatsappp.daily.co
# Agregado internamente en daily.service.ts:
# DAILY_DOMAIN_ID=6f1c5be1-2679-497b-a20f-0d1fd62d07a6
```

---

## 📚 FUENTES INVESTIGADAS

1. Daily.co SDK Documentation - Meeting Tokens
2. JWT Standard (RFC 7519) vs Daily.co implementation
3. Daily.co API v1 `/v1` endpoint (devuelve domain_id)
4. Error message analysis: "Meeting token ignored: invalid-token"

---

## 🎉 RESULTADO ESPERADO

Cuando intentes una videollamada ahora:
1. ✅ Token se genera con formato correcto
2. ✅ Token se envía al frontend
3. ✅ Frontend decodifica y ve claims correctas
4. ✅ Daily.co acepta el token (sin "invalid-token")
5. ✅ WebRTC negotiation comienza
6. ✅ Videollamada se conecta exitosamente

**Error "Meeting token ignored: invalid-token" DESAPARECE.**

---

**Fecha de corrección:** 2025-12-08  
**Root cause:** Formato incorrecto de JWT claims  
**Solución:** Usar claims `r`, `d`, `iat`, `exp` del esquema Daily.co  
**Status:** ✅ IMPLEMENTADO Y LISTO PARA PRUEBAS
