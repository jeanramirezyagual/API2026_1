import express from 'express';
import cors from 'cors';
import path from 'path';
import clientesRoutes from './routes/clientes.routes.js';
import productosRoutes from './routes/productos.routes.js';
import pedidosRouter from './routes/pedidos.routes.js';
import { login } from './controladores/authCtrl.js';

const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos para subidas
app.use('/uploads', express.static(path.resolve('src/uploads')));

// Enrutamiento principal de la API
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRouter);

// Exponer endpoint directo de login para compatibilidad con frontend
app.post('/api/login', login);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint not found'
    });
});

// Middleware de manejo de errores (captura errores y devuelve JSON)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

export default app;