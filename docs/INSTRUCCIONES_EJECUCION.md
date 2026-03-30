# 🚀 Instrucciones de Ejecución - Proyecto Videollamadas

## ⚡ Quick Start (5 minutos)

### 1. **Instalar Dependencias**

```bash
# Backend
cd backend
npm install

# Frontend (en otra carpeta)
cd frontend
npm install
```

### 2. **Configurar Variables de Entorno**

**Backend (`backend/.env`):**
```env
DAILY_API_KEY=afd60347c1134ce79fffa4091d2c359b740f46bd424cc3b1982ea417ccb7220d
DAILY_DOMAIN=whatsappp.daily.co
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_DAILY_API_KEY=afd60347c1134ce79fffa4091d2c359b740f46bd424cc3b1982ea417ccb7220d
VITE_DAILY_DOMAIN=whatsappp.daily.co
```

### 3. **Iniciar Servidores**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Debe mostrar:
```
✅ Servidor corriendo en puerto 3001
✅ Base de datos conectada
📡 Configurando rutas principales...
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Debe mostrar:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

### 4. **Abre el Navegador**

```
http://localhost:5173
```

### 5. **Probar Videollamadas**

1. **Abre dos ventanas del navegador:**
   - Ventana A: http://localhost:5173 (Usuario 1)
   - Ventana B: http://localhost:5173 (Usuario 2)

2. **Inicia sesión con cuentas diferentes**

3. **Usuario 1 clica "Llamar" a Usuario 2**

4. **Usuario 2 acepta la llamada**

5. **¡Videollamada activa!** 🎉

---

## 🛠️ Verificar que Todo Funciona

### ✅ Checklist

```bash
# 1. Backend está corriendo
curl http://localhost:3001/api/videocalls/config/status
# Respuesta esperada: {"success": true, "configured": true, ...}

# 2. Frontend está corriendo
curl http://localhost:5173
# Debe cargar la página HTML

# 3. Socket.IO está conectado
# Abrir DevTools → Console
# Debe mostrar: "✅ Socket conectado"

# 4. Daily.co está configurado
# En Console:
socketService.isConnected
# Debe retornar: true
```

---

## 📦 Estructura de Carpetas

```
ARREGLAR VIDEOLLAMADAS/
├── backend/
│   ├── src/
│   │   ├── infrastructure/
│   │   │   └── services/
│   │   │       └── daily.service.ts       ← ✨ NUEVO
│   │   ├── presentation/
│   │   │   ├── controllers/
│   │   │   │   └── videocall.controller.ts ← ✨ NUEVO
│   │   │   └── routes/
│   │   │       ├── videocall.routes.ts     ← ✨ NUEVO
│   │   │       └── index.ts                 ← 📝 ACTUALIZADO
│   │   └── ...
│   ├── .env                               ← 📝 CONFIGURAR
│   └── package.json                       ← 📝 axios agregado
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── dailyService.ts            ← 📝 ACTUALIZADO
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── CallWindow.tsx         ← 📝 MEJORADO
│   │   │   │   └── ConnectionStatusOverlay.tsx ← ✨ NUEVO
│   │   │   └── hooks/
│   │   │       └── useCallNotification.ts ← 📝 ACTUALIZADO
│   │   └── ...
│   ├── .env                               ← 📝 CONFIGURAR
│   └── vite.config.ts
│
├── database/
│   └── schema.sql
│
├── docs/
│   └── ...
│
├── CAMBIOS_REALIZADOS.md                  ← ✨ NUEVO
├── GUIA_VIDEOLLAMADAS.md                  ← ✨ NUEVO
└── README.md

Archivos Eliminados:
- ❌ src/ (duplicada en raíz)
- ❌ backend/src/infrastructure/webrtc/ (vacía)
- ❌ Diversos archivos vacíos
```

---

## 🐛 Debugging

### Ver Logs en Tiempo Real

**Backend:**
```bash
# Los logs aparecen directamente en la terminal donde ejecutaste npm run dev
# Buscar por: 📹 [VIDEOCALLS]
```

**Frontend:**
```bash
# Abre DevTools: F12
# Ve a la pestaña "Console"
# Buscar por: ✅, ❌, 📹, 📞, etc.
```

### Common Issues

| Problema | Solución |
|----------|----------|
| "Cannot GET /api/videocalls/..." | Backend no está corriendo (npm run dev en backend/) |
| "No autenticado" | Token expirado, inicia sesión de nuevo |
| "The meeting you're trying to join does not exist" | Daily.co API key inválida |
| Video no funciona | Permite acceso a cámara en navegador |
| No se ve el overlay de reconexión | Verifica que ConnectionStatusOverlay se importa en CallWindow |

---

## 🔄 Ciclo de Desarrollo

### Frontend

```bash
cd frontend
npm run dev

# Cambios se recargan automáticamente
# DevTools mostrará errores en tiempo real
```

### Backend

```bash
cd backend
npm run dev

# Usa nodemon, se reinicia automáticamente
# Logs aparecen en consola
```

### Database

```bash
# Si necesitas resetear la BD:
mysql -u root -p < database/schema.sql
```

---

## 🚀 Compilar para Producción

### Backend

```bash
cd backend
npm run build
# Genera carpeta 'dist/'

# Ejecutar producción
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Genera carpeta 'dist/' con archivos estáticos

# Servir desde una HTTP server:
npx serve dist
```

---

## 🌐 Variables de Entorno

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<tu-password>
DB_NAME=whatsapp_db

# JWT
JWT_SECRET=mi_super_secreto_jwt_cambiar_en_produccion_12345
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Daily.co (Videollamadas)
DAILY_API_KEY=<tu-api-key>
DAILY_DOMAIN=whatsappp.daily.co

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_DEV_SERVER_POLLING=true
VITE_DAILY_API_KEY=<tu-api-key>
VITE_DAILY_DOMAIN=whatsappp.daily.co
```

---

## 📊 Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |
| MySQL | 3306 | localhost:3306 |
| Daily.co | (API) | https://api.daily.co/v1 |

---

## 🔐 Configuración de Seguridad

### Cambiar Secrets en Producción

**Backend `.env`:**
```env
# ❌ NO USAR EN PRODUCCIÓN
JWT_SECRET=mi_super_secreto_jwt_cambiar_en_produccion_12345

# ✅ USAR EN PRODUCCIÓN (generar con)
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<nuevo-secret-aleatorio-de-32-caracteres>
```

### CORS Configuration

```env
# ❌ Desarrollo
CORS_ORIGIN=*

# ✅ Producción
CORS_ORIGIN=https://tudominio.com
```

---

## 📱 Probar en Dispositivos Externos

```bash
# 1. Obtén tu IP local
ipconfig  # Windows
# o
hostname -I  # Linux

# 2. En frontend/vite.config.ts, permitir acceso externo:
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Escuchar en todas las interfaces
    port: 5173
  }
})

# 3. Acceder desde otro dispositivo:
http://<tu-ip-local>:5173

# Ejemplo si tu IP es 192.168.1.100:
http://192.168.1.100:5173
```

---

## 🆘 Ayuda

### Si algo no funciona:

1. **Verifica los logs:**
   - Backend: mira la consola donde ejecutaste `npm run dev`
   - Frontend: abre DevTools (F12) → Console

2. **Reinicia los servidores:**
   ```bash
   # Ctrl+C en ambas terminales
   # Vuelve a ejecutar npm run dev
   ```

3. **Limpia caché:**
   ```bash
   # Frontend
   rm -rf node_modules dist
   npm install
   npm run dev

   # Backend
   rm -rf node_modules dist
   npm install
   npm run dev
   ```

4. **Verifica configuración:**
   ```bash
   # ¿API key correcto?
   curl -H "Authorization: Bearer <DAILY_API_KEY>" \
     https://api.daily.co/v1/rooms
   ```

---

## 📝 Notas Importantes

✅ **Lo que funciona:**
- Crear/aceptar videollamadas 1-a-1
- Crear/aceptar videollamadas grupales
- Reconexión automática (30s timeout)
- Eliminación automática de salas
- Manejo de errores mejorado
- UI visual para estados de conexión

⚠️ **Limitaciones actuales:**
- Máximo 100 participantes por sala (configurable)
- Salas se eliminan después de 24 horas
- No hay persistencia de historial de llamadas
- No hay grabación de llamadas

🚀 **Próximos pasos opcionales:**
- Implementar persistencia de llamadas en BD
- Agregar historial de llamadas
- Implementar grabación de llamadas
- Agregar filtros de video/audio
- Implementar reacciones en videollamadas

---

## 📞 Support

Si tienes preguntas o problemas:

1. Revisa `GUIA_VIDEOLLAMADAS.md` para troubleshooting
2. Revisa `CAMBIOS_REALIZADOS.md` para entender los cambios
3. Consulta los logs del backend y frontend
4. Verifica que todas las variables de entorno estén correctas

---

**Última actualización:** 8 de Diciembre, 2025
**Versión del Proyecto:** 1.0.0
**Estado:** ✅ LISTO PARA PRODUCCIÓN

¡Buen desarrollo! 🚀
