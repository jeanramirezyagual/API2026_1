import express from 'express';
import cors from 'cors';
import path from 'path';
// 📌 RUTAS
import clientesRoutes from './routes/clientes.routes.js';
import productosRoutes from './routes/productos.routes.js';

const app = express();

export default app;

// =========================
// 🔐 CONFIGURACIÓN CORS
// =========================
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));


// =========================
// 📦 MIDDLEWARE
// =========================
app.use(express.json());


// =========================
// 🖼️ ARCHIVOS ESTÁTICOS
// =========================
app.use('/uploads', express.static(path.resolve('src/uploads')));


// =========================
// 🌐 RUTAS API
// =========================
app.use('/api', clientesRoutes);
app.use('/api', productosRoutes);


// =========================
// ❌ ENDPOINT NO ENCONTRADO
// =========================
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint no found'
    });
});


