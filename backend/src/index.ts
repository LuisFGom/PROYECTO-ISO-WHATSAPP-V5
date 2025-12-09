// backend/src/index.ts - ARCHIVO COMPLETO Y CORREGIDO
import express from 'express';
import cors, { CorsOptions } from 'cors'; // Importamos CorsOptions
import { createServer } from 'http';
import { config } from './config/environment';
import { database } from './infrastructure/database/mysql/connection';
import routes from './presentation/routes';
import { errorMiddleware } from './presentation/middlewares/error.middleware';
import { initializeSocket } from './infrastructure/socket/socket';

const app = express();

// 🔥 Crear servidor HTTP para Socket.IO
const httpServer = createServer(app);

// 🌟 CONFIGURACIÓN DE CORS (SOLUCIÓN CON EXPRESIÓN REGULAR Y TYPING CORREGIDO) 🌟

// Expresión Regular para permitir cualquier IP de tus redes locales (192.168.x.x y 10.79.x.x) en el puerto 5173
const localNetworkRegex = /^http:\/\/(?:192\.168\.\d{1,3}\.\d{1,3}|10\.79\.\d{1,3}\.\d{1,3}):5173$/;

// Lista de orígenes fijos (ej: localhost, ngrok)
const fixedOrigins: (string | undefined)[] = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    config.cors.origin, // Esto puede ser '*' o cualquier valor de tu .env
    'https://specifically-semihumanistic-maria.ngrok-free.dev',
];

const corsOptions: CorsOptions = { // Tipamos la variable corsOptions
    // 💡 SOLUCIÓN AL ERROR: Tipamos 'origin' como string | undefined y 'callback'
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // 1. Permitir peticiones sin 'origin' (navegadores en la misma máquina, Postman)
        if (!origin) return callback(null, true);

        // 2. Verificar si es un origen fijo (localhost, ngrok)
        if (fixedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // 3. Verificar si coincide con la Expresión Regular de red local
        if (localNetworkRegex.test(origin)) {
            console.log(`✅ CORS: Origen ${origin} permitido por Regex de Red Local.`);
            return callback(null, true);
        }

        // Si no está permitido
        console.error(`❌ CORS: Origen ${origin} NO permitido.`);
        callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    optionsSuccessStatus: 200,
};

// 🌟 LOG DE DIAGNÓSTICO:
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        console.log(`📡 Recibida petición OPTIONS (Preflight) desde Origin: ${req.headers.origin}`);
    } else if (req.url === '/api/health') {
        console.log(`✅ Recibida petición GET /api/health desde Origin: ${req.headers.origin}`);
    } else if (req.url.startsWith('/api/groups')) {
        // 🔥 NUEVO: Log específico para rutas de grupos
        console.log(`🔥 [GROUPS] ${req.method} ${req.url} desde Origin: ${req.headers.origin}`);
    }
    next();
});
// 🌟 FIN DEL LOG DE DIAGNÓSTICO

app.use(cors(corsOptions)); // Aplica la configuración de CORS

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Ruta para probar conexión a DB (ruta original /health, ahora /api/health)
app.get('/api/health', async (req, res) => {
    try {
        await database.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// API Routes
app.use('/api', routes);

// Error handler middleware (debe ir al final)
app.use(errorMiddleware);

// 🔥 Inicializar Socket.IO
const socketService = initializeSocket(httpServer);
console.log('🔌 Socket.IO inicializado');

// 🔥 Iniciar servidor con HTTP (para Socket.IO)
httpServer.listen(config.port, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📍 http://localhost:${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔌 Socket.IO ready`);
    console.log('📡 Rutas API disponibles:');
    console.log(`   - GET  /api/health`);
    console.log(`   - POST /api/auth/login`);
    console.log(`   - POST /api/auth/register`);
    console.log(`   - GET  /api/contacts`);
    console.log(`   - GET  /api/conversations`);
    console.log(`   - GET  /api/groups 🔥 NUEVO`);
    console.log(`   - POST /api/groups 🔥 NUEVO`);
    console.log('🚀 ========================================');
    console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});