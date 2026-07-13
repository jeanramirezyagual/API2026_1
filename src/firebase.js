// src/firebase.js
import { initializeApp, cert } from 'firebase-admin/app'; // <-- Importación directa desde el submódulo 'app'
import { getMessaging } from 'firebase-admin/messaging'; // <-- Importación directa desde el submódulo 'messaging'
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let messagingInstance = null;

try {
    // Leemos de forma segura el archivo JSON de credenciales en la raíz
    const keyPath = join(__dirname, '../firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

    // Inicializamos la app usando las funciones directas
    initializeApp({
        credential: cert(serviceAccount)
    });

    // Obtenemos la instancia de mensajería lista para exportar
    messagingInstance = getMessaging();

    console.log('🛡️ Firebase Admin SDK inicializado correctamente.');
} catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error.message);
}

export const messaging = messagingInstance;