// src/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    // Leemos el archivo JSON de credenciales de forma segura
    const keyPath = join(__dirname, '../firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('🛡️ Firebase Admin SDK inicializado correctamente.');
} catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error.message);
}

export const messaging = admin.messaging();