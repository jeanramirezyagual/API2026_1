import express from 'express';
import cors from 'cors';
import path from 'path';
import clientesRoutes from './routes/clientes.routes.js';
import productosRoutes from './routes/productos.routes.js';
import pedidosRouter from './routes/pedidos.routes.js';

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

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint not found'
    });
});

export default app;