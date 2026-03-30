# 🔐 Cómo Obtener un Nuevo API Key de Daily.co

## El Problema
```
❌ Status Code: 401
❌ Error: 'authentication-error'
```

Tu API key actual es incorrecto o expiró. Necesitas generar uno nuevo.

---

## 📋 Pasos para Obtener un API Key Válido

### 1. **Abre el Dashboard de Daily.co**
```
Ve a: https://dashboard.daily.co
```

### 2. **Inicia Sesión**
- Si tienes cuenta: inicia sesión
- Si no tienes: crea una nueva cuenta (es gratis)

### 3. **Ve a Developer Settings**
En el menú de la izquierda:
```
Developers → API keys
```

O directamente: https://dashboard.daily.co/developers

### 4. **Ver tu API Key**
Deberías ver una pantalla como la del archivo adjunto:
```
API Key: afd60347c1134ce79fffa4091d2c359b740f46bd424cc3b1982ea417ccb7220d
Created At: 2025-12-03T01:27:08.000Z
```

### 5. **Copiar el API Key Completo**
⚠️ **IMPORTANTE: Copia TODO el API key, sin truncar**

Ejemplo correcto:
```
afd60347c1134ce79fffa4091d2c359b740f46bd424cc3b1982ea417ccb7220d
```

Ejemplo incorrecto (truncado):
```
afd60347c1134ce79fffa4091d2c359b740f46bd424cc3... ❌
```

---

## 🔧 Actualizar .env

Una vez que tengas el API key:

### 1. **Abre el archivo `.env`**
```
backend/.env
```

### 2. **Busca esta línea:**
```env
DAILY_API_KEY=afd60347c1134ce79fffa4091d2c359b740f46bd424cc3b1982ea417ccb7220d
```

### 3. **Reemplaza con tu nuevo API key**
```env
DAILY_API_KEY=<TU_NUEVO_API_KEY_AQUI>
```

Ejemplo:
```env
DAILY_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5
```

### 4. **Guarda el archivo**
- Ctrl+S (o Cmd+S en Mac)

---

## ✅ Verificar que Funciona

### 1. **Detén el backend (si está corriendo)**
```
En la terminal del backend, presiona Ctrl+C
```

### 2. **Ejecuta el test**
```bash
cd backend
node test-daily-api.js
```

### 3. **Deberías ver:**
```
✅ TODOS LOS TESTS PASARON EXITOSAMENTE
✅ Daily.co está configurado correctamente y funcionando
```

Si ves esto = ✅ **API key válido**

Si no = ❌ El API key sigue siendo inválido, verifica que lo copiaste completo

---

## 🚀 Reiniciar el Backend

Una vez que el test pase:

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Servidor corriendo en puerto 3001
```

---

## 🧪 Probar Videollamada

Después de reiniciar:

1. Abre el frontend: http://localhost:5173
2. Inicia sesión
3. Llama a otro usuario
4. Deberías ver: ✅ Videollamada activa (sin error 400)

---

## 📞 Troubleshooting

### Si el test sigue fallando:

**Opción 1: Generar nuevo API key**
1. Ve a https://dashboard.daily.co/developers
2. Clica "Create API key"
3. Se generará automáticamente uno nuevo
4. Cópialo completo (sin truncar)
5. Actualiza .env
6. Vuelve a correr: `node test-daily-api.js`

**Opción 2: Verificar que el API key es del dominio correcto**
1. Ve a https://dashboard.daily.co/rooms
2. Deberías ver tu dominio `whatsappp.daily.co`
3. Si no lo ves, contacta a Daily.co support

**Opción 3: Usar ngrok correctamente**
Si usas ngrok (para conectar desde otra red):
1. El backend debe estar en: `https://specifically-semihumanistic-maria.ngrok-free.dev`
2. El frontend debe apuntar a ese ngrok URL en .env
3. Daily.co no necesita cambios en la configuración

---

## ⚡ Paso Rápido

```bash
# 1. Abre https://dashboard.daily.co/developers
# 2. Copia tu API key completo
# 3. Abre backend/.env
# 4. Reemplaza DAILY_API_KEY=... con el nuevo
# 5. Guarda
# 6. Abre terminal en backend/
# 7. Ejecuta: node test-daily-api.js
# 8. Si ves ✅ PASÓ: npm run dev
# 9. Videollamadas funcionan ✅
```

---

## 🎯 Resumen

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Obtener API key de Daily.co | ✅ API key válido |
| 2 | Actualizar backend/.env | ✅ Configuración guardada |
| 3 | Ejecutar test | ✅ Test pasa |
| 4 | Reiniciar backend | ✅ Backend corriendo |
| 5 | Probar videollamada | ✅ Funciona |

---

**Una vez que hagas esto, vuelve a intentar la videollamada y debería funcionar correctamente.**
