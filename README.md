# 📱 WhatsApp Clone - Aplicación de Mensajería con Videollamadas

Aplicación de mensajería en tiempo real con soporte para chat individual, grupos y videollamadas, construida con arquitectura limpia.

## 🚀 Características

- ✅ Chat individual en tiempo real
- ✅ Chat grupal
- ✅ Videollamadas 1-a-1 y grupales (Daily.co)
- ✅ Indicador de "escribiendo..."
- ✅ Estados de conexión (online/offline)
- ✅ Mensajes encriptados
- ✅ Edición y eliminación de mensajes
- ✅ Reconexión automática

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior → [Descargar](https://nodejs.org/)
- **MySQL** v8 o superior → [Descargar](https://dev.mysql.com/downloads/)
- **Git** → [Descargar](https://git-scm.com/)

## ⚡ Instalación Rápida (5 minutos)

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd PROYECTO-ISO-WHATSAPP-V4-VIDEOLLAMADAS
```

### Paso 2: Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

### Paso 3: ⚠️ IMPORTANTE - Configurar la Base de Datos

Abre el archivo `backend/.env` y **cambia la contraseña de MySQL**:

```env
# Busca esta línea y pon TU contraseña de MySQL
DB_PASSWORD=TU_CONTRASEÑA_DE_MYSQL
```

**Ejemplo:** Si tu contraseña de MySQL es `MiPassword123`, el archivo debe quedar:

```env
DB_PASSWORD=MiPassword123
```

### Paso 4: Crear la Base de Datos (Migraciones)

```bash
# Estando en la carpeta backend, ejecuta:
npm run db:migrate
```

Este comando:
- ✅ Crea la base de datos `whatsapp_db` automáticamente
- ✅ Crea todas las tablas necesarias (15 tablas)
- ✅ Registra las migraciones ejecutadas

**Resultado esperado:**
```
🚀 ====== SISTEMA DE MIGRACIONES ======

✅ Conexión a MySQL establecida.
📦 Creando base de datos "whatsapp_db" si no existe...
✅ Base de datos "whatsapp_db" lista.

⏳ Ejecutando: 001_create_users_table...
   ✅ 001_create_users_table - Completado
...
🎉 ¡15 migraciones ejecutadas exitosamente!

✅ ====== MIGRACIONES COMPLETADAS ======
```

### Paso 5: Configurar el Frontend

```bash
# Volver a la raíz y entrar al frontend
cd ../frontend

# Instalar dependencias
npm install
```

### Paso 6: Iniciar la Aplicación

Necesitas **2 terminales**:

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

### Paso 7: ¡Listo! 🎉

Abre tu navegador en: **http://localhost:5173**

---

## 📂 Estructura del Proyecto

```
PROYECTO-ISO-WHATSAPP-V4-VIDEOLLAMADAS/
├── backend/                    # Servidor Node.js + Express
│   ├── src/
│   │   ├── application/        # Casos de uso
│   │   ├── config/             # Configuraciones
│   │   ├── domain/             # Entidades y repositorios
│   │   ├── infrastructure/     # Implementaciones (DB, Socket, etc.)
│   │   │   ├── database/
│   │   │   │   ├── migrations/ # 🔥 Sistema de migraciones
│   │   │   │   └── mysql/      # Conexión a MySQL
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── socket/         # Socket.IO
│   │   ├── presentation/       # Controladores y rutas
│   │   └── shared/             # Utilidades compartidas
│   ├── .env                    # ⚠️ Configuración (NO subir a Git)
│   └── .env.example            # Plantilla de configuración
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── application/        # Casos de uso
│   │   ├── infrastructure/     # API y Socket
│   │   ├── presentation/       # Componentes y páginas
│   │   └── shared/             # Utilidades
│   └── vite.config.ts
│
└── docs/                       # Documentación adicional
```

---

## 🗄️ Comandos de Base de Datos

Todos los comandos se ejecutan desde la carpeta `backend/`:

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Ejecuta todas las migraciones pendientes |
| `npm run db:rollback` | Revierte todas las migraciones (¡borra datos!) |
| `npm run db:reset` | Rollback + Migrate (reinicia la BD) |
| `npm run setup` | Instala dependencias + ejecuta migraciones |

---

## 🔧 Configuración Detallada

### Archivo `backend/.env`

```env
# ----- SERVIDOR -----
PORT=3001                        # Puerto del backend
NODE_ENV=development             # Entorno (development/production)

# ----- BASE DE DATOS MYSQL -----
DB_HOST=localhost                # Host de MySQL
DB_PORT=3306                     # Puerto de MySQL
DB_USER=root                     # Usuario de MySQL
DB_PASSWORD=TU_CONTRASEÑA        # ⚠️ Tu contraseña de MySQL
DB_NAME=whatsapp_db              # Nombre de la base de datos

# ----- JWT -----
JWT_SECRET=clave_secreta_unica   # Clave para tokens
JWT_EXPIRES_IN=7d                # Duración del token

# ----- DAILY.CO (Videollamadas) -----
DAILY_API_KEY=tu_api_key         # API Key de Daily.co
DAILY_DOMAIN=tu_dominio.daily.co # Tu dominio de Daily.co
```

### ¿Dónde cambio la contraseña de MySQL?

**Archivo:** `backend/.env`  
**Línea:** `DB_PASSWORD=`

---

## ❓ Solución de Problemas

### Error: "Access denied for user 'root'"
```
❌ Error durante la migración: Access denied for user 'root'@'localhost'
```
**Solución:** Tu contraseña de MySQL es incorrecta. Edita `backend/.env` y corrige `DB_PASSWORD`.

### Error: "ECONNREFUSED"
```
❌ Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solución:** MySQL no está ejecutándose. Inicia el servicio:
- **Windows:** Servicios → MySQL → Iniciar
- **Linux:** `sudo systemctl start mysql`
- **Mac:** `brew services start mysql`

### Error: "Database 'whatsapp_db' doesn't exist"
**Solución:** Ejecuta las migraciones:
```bash
cd backend
npm run db:migrate
```

---

## 📹 Configurar Videollamadas (Opcional)

Para habilitar videollamadas necesitas una cuenta en [Daily.co](https://www.daily.co/):

1. Crea una cuenta gratuita en https://dashboard.daily.co/
2. Copia tu API Key desde "Developers"
3. Edita `backend/.env`:
   ```env
   DAILY_API_KEY=tu_api_key_aqui
   DAILY_DOMAIN=tu_dominio.daily.co
   ```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js + Express
- TypeScript
- Socket.IO (tiempo real)
- MySQL + mysql2
- JWT (autenticación)
- bcrypt (encriptación)

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Socket.IO Client
- Daily.co (videollamadas)

---

## 👥 Contribuir

1. Haz fork del proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
