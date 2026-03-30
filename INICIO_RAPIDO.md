# ⚡ Guía de Inicio Rápido

## Requisitos
- Node.js v18+
- MySQL v8+

## Instalación en 3 Pasos

### 1️⃣ Backend
```bash
cd backend
npm install
```

### 2️⃣ Configurar Base de Datos

Edita `backend/.env` y cambia la contraseña de MySQL:

```env
DB_PASSWORD=TU_CONTRASEÑA_DE_MYSQL
```

Luego ejecuta las migraciones:
```bash
npm run db:migrate
```

### 3️⃣ Frontend
```bash
cd ../frontend
npm install
```

## Ejecutar

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

Abre: http://localhost:5173

---

## Comandos de Base de Datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Crear/actualizar tablas |
| `npm run db:rollback` | Eliminar todas las tablas |
| `npm run db:reset` | Reiniciar base de datos |

## ¿Problemas?

- **"Access denied"** → Contraseña incorrecta en `backend/.env`
- **"ECONNREFUSED"** → MySQL no está iniciado
- **"Database doesn't exist"** → Ejecuta `npm run db:migrate`
