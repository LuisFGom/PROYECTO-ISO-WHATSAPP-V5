// backend/src/infrastructure/database/migrations/migrate.ts
// Sistema de migraciones para crear la base de datos automáticamente

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

interface MigrationConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const config: MigrationConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'whatsapp_db',
};

// =====================================================
// DEFINICIÓN DE TODAS LAS TABLAS (MIGRACIONES)
// =====================================================

const migrations = [
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`avatar_url\` varchar(255) DEFAULT NULL,
        \`status\` enum('online','offline','away') DEFAULT 'offline',
        \`about\` varchar(255) DEFAULT 'Hey there! I am using WhatsApp Clone',
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`last_seen\` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`username_unique\` (\`username\`),
        UNIQUE KEY \`email_unique\` (\`email\`),
        KEY \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `users`;'
  },
  {
    name: '002_create_groups_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`groups\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`description\` varchar(255) DEFAULT NULL,
        \`avatar_url\` varchar(255) DEFAULT NULL,
        \`admin_user_id\` int NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_admin_user_id\` (\`admin_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `groups`;'
  },
  {
    name: '003_create_contacts_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`contacts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`contact_user_id\` int NOT NULL,
        \`nickname\` varchar(100) NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_contact_user_id\` (\`contact_user_id\`),
        UNIQUE KEY \`unique_contact\` (\`user_id\`, \`contact_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `contacts`;'
  },
  {
    name: '004_create_messages_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`sender_id\` int NOT NULL,
        \`receiver_id\` int NOT NULL,
        \`encrypted_content\` text NOT NULL,
        \`iv\` varchar(32) NOT NULL,
        \`timestamp\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`is_read\` tinyint(1) DEFAULT '0',
        \`deleted_by_sender\` tinyint(1) DEFAULT '0',
        \`deleted_by_receiver\` tinyint(1) DEFAULT '0',
        \`edited_at\` timestamp NULL DEFAULT NULL,
        \`is_deleted_for_all\` tinyint(1) DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`idx_sender_id\` (\`sender_id\`),
        KEY \`idx_receiver_id\` (\`receiver_id\`),
        KEY \`idx_timestamp\` (\`timestamp\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `messages`;'
  },
  {
    name: '005_create_conversations_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`conversations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user1_id\` int NOT NULL,
        \`user2_id\` int NOT NULL,
        \`last_message_id\` int DEFAULT NULL,
        \`last_message_at\` timestamp NULL DEFAULT NULL,
        \`unread_count_user1\` int DEFAULT '0',
        \`unread_count_user2\` int DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user1_id\` (\`user1_id\`),
        KEY \`idx_user2_id\` (\`user2_id\`),
        KEY \`idx_last_message_id\` (\`last_message_id\`),
        UNIQUE KEY \`unique_conversation\` (\`user1_id\`, \`user2_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `conversations`;'
  },
  {
    name: '006_create_group_messages_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_messages\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`group_id\` int NOT NULL,
        \`sender_id\` int NOT NULL,
        \`encrypted_content\` text NOT NULL,
        \`iv\` varchar(32) NOT NULL,
        \`timestamp\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`edited_at\` timestamp NULL DEFAULT NULL,
        \`is_deleted_for_all\` tinyint(1) DEFAULT '0',
        \`deleted_at\` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_group_id\` (\`group_id\`),
        KEY \`idx_sender_id\` (\`sender_id\`),
        KEY \`idx_is_deleted_for_all\` (\`is_deleted_for_all\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_messages`;'
  },
  {
    name: '007_create_group_members_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_members\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`group_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`joined_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`left_at\` timestamp NULL DEFAULT NULL,
        \`added_by_user_id\` int DEFAULT NULL,
        \`is_admin\` tinyint(1) DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`idx_group_id\` (\`group_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_added_by_user_id\` (\`added_by_user_id\`),
        UNIQUE KEY \`unique_member\` (\`group_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_members`;'
  },
  {
    name: '008_create_calls_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`calls\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`caller_id\` int NOT NULL,
        \`receiver_id\` int NOT NULL,
        \`call_type\` enum('audio','video') NOT NULL DEFAULT 'video',
        \`status\` enum('missed','answered','rejected','ended') NOT NULL DEFAULT 'missed',
        \`started_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`ended_at\` timestamp NULL DEFAULT NULL,
        \`duration\` int DEFAULT '0',
        \`room_name\` varchar(255) DEFAULT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_caller_id\` (\`caller_id\`),
        KEY \`idx_receiver_id\` (\`receiver_id\`),
        KEY \`idx_started_at\` (\`started_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `calls`;'
  },
  {
    name: '009_create_group_calls_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_calls\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`group_id\` int NOT NULL,
        \`started_by_user_id\` int NOT NULL,
        \`call_type\` enum('audio','video') NOT NULL DEFAULT 'video',
        \`started_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`ended_at\` timestamp NULL DEFAULT NULL,
        \`duration\` int DEFAULT '0',
        \`room_name\` varchar(255) DEFAULT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_group_id\` (\`group_id\`),
        KEY \`idx_started_by_user_id\` (\`started_by_user_id\`),
        KEY \`idx_started_at\` (\`started_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_calls`;'
  },
  {
    name: '010_create_group_call_participants_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_call_participants\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`group_call_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`joined_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`left_at\` timestamp NULL DEFAULT NULL,
        \`duration\` int DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`idx_group_call_id\` (\`group_call_id\`),
        KEY \`idx_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_call_participants`;'
  },
  {
    name: '011_create_group_message_reads_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_message_reads\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`group_message_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`read_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_group_message_id\` (\`group_message_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        UNIQUE KEY \`unique_read\` (\`group_message_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_message_reads`;'
  },
  {
    name: '012_create_group_messages_deleted_for_user_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_messages_deleted_for_user\` (
        \`user_id\` int NOT NULL,
        \`message_id\` int NOT NULL,
        \`deleted_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`user_id\`, \`message_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_messages_deleted_for_user`;'
  },
  {
    name: '013_create_groups_hidden_for_user_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`groups_hidden_for_user\` (
        \`group_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`hidden_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`group_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `groups_hidden_for_user`;'
  },
  {
    name: '014_create_typing_indicators_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`typing_indicators\` (
        \`user_id\` int NOT NULL,
        \`chat_with_user_id\` int NOT NULL,
        \`is_typing\` tinyint(1) DEFAULT '0',
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`user_id\`, \`chat_with_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `typing_indicators`;'
  },
  {
    name: '015_create_group_typing_indicators_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`group_typing_indicators\` (
        \`group_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`is_typing\` tinyint(1) DEFAULT '0',
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`group_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `group_typing_indicators`;'
  },
  {
    name: '016_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS \`_migrations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`executed_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_migration\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    down: 'DROP TABLE IF EXISTS `_migrations`;'
  }
];

// =====================================================
// FUNCIONES DE MIGRACIÓN
// =====================================================

async function createDatabase(connection: mysql.Connection): Promise<void> {
  console.log(`\n📦 Creando base de datos "${config.database}" si no existe...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${config.database}\``);
  console.log(`✅ Base de datos "${config.database}" lista.`);
}

async function getExecutedMigrations(connection: mysql.Connection): Promise<string[]> {
  try {
    const [rows] = await connection.query('SELECT name FROM `_migrations` ORDER BY id');
    return (rows as any[]).map(row => row.name);
  } catch (error) {
    // La tabla de migraciones no existe aún
    return [];
  }
}

async function recordMigration(connection: mysql.Connection, name: string): Promise<void> {
  await connection.query('INSERT INTO `_migrations` (name) VALUES (?)', [name]);
}

async function runMigrations(): Promise<void> {
  console.log('\n🚀 ====== SISTEMA DE MIGRACIONES ======\n');
  console.log('📋 Configuración:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Puerto: ${config.port}`);
  console.log(`   Usuario: ${config.user}`);
  console.log(`   Base de datos: ${config.database}`);
  
  let connection: mysql.Connection | null = null;

  try {
    // Conectar sin especificar base de datos primero
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });

    console.log('\n✅ Conexión a MySQL establecida.');

    // Crear la base de datos
    await createDatabase(connection);

    // Primero ejecutar la migración de la tabla _migrations
    const migrationTableMigration = migrations.find(m => m.name === '016_create_migrations_table');
    if (migrationTableMigration) {
      try {
        await connection.query(migrationTableMigration.up);
      } catch (error: any) {
        // Ignorar si ya existe
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Obtener migraciones ya ejecutadas
    const executedMigrations = await getExecutedMigrations(connection);
    console.log(`\n📊 Migraciones ya ejecutadas: ${executedMigrations.length}`);

    // Ejecutar migraciones pendientes
    let migrationsRun = 0;
    for (const migration of migrations) {
      if (migration.name === '016_create_migrations_table') continue; // Ya la ejecutamos
      
      if (!executedMigrations.includes(migration.name)) {
        console.log(`\n⏳ Ejecutando: ${migration.name}...`);
        try {
          await connection.query(migration.up);
          await recordMigration(connection, migration.name);
          console.log(`   ✅ ${migration.name} - Completado`);
          migrationsRun++;
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️ ${migration.name} - Tabla ya existe, registrando...`);
            await recordMigration(connection, migration.name);
          } else {
            throw error;
          }
        }
      }
    }

    if (migrationsRun === 0) {
      console.log('\n✅ La base de datos ya está actualizada. No hay migraciones pendientes.');
    } else {
      console.log(`\n🎉 ¡${migrationsRun} migraciones ejecutadas exitosamente!`);
    }

    console.log('\n✅ ====== MIGRACIONES COMPLETADAS ======\n');

  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 SOLUCIÓN: Verifica tu contraseña de MySQL en el archivo backend/.env');
      console.error('   DB_PASSWORD=tu_contraseña_de_mysql');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUCIÓN: Asegúrate de que MySQL esté ejecutándose');
      console.error('   Windows: Revisa en Servicios > MySQL');
      console.error('   Linux/Mac: sudo systemctl start mysql');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function rollbackMigrations(): Promise<void> {
  console.log('\n🔄 ====== ROLLBACK DE MIGRACIONES ======\n');
  
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true,
    });

    // Ejecutar rollback en orden inverso
    for (const migration of [...migrations].reverse()) {
      console.log(`⏳ Revirtiendo: ${migration.name}...`);
      try {
        await connection.query(migration.down);
        console.log(`   ✅ ${migration.name} - Revertido`);
      } catch (error: any) {
        console.log(`   ⚠️ ${migration.name} - ${error.message}`);
      }
    }

    console.log('\n✅ ====== ROLLBACK COMPLETADO ======\n');

  } catch (error: any) {
    console.error('\n❌ Error durante el rollback:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// =====================================================
// EJECUCIÓN
// =====================================================

const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigrations();
} else {
  runMigrations();
}
