import { Router } from 'express';
import { guardarPedido, getPedidos, getPedidoById, getPedidoPdf, testPushNotification } from '../controladores/pedidosCtrl.js';

const router = Router();

// 1. RUTAS FIJAS (Siempre van arriba del todo)
router.post('/test-push', testPushNotification); // <-- Quitamos el '/pedidos' duplicado y lo subimos
router.post('/', guardarPedido);
router.get('/', getPedidos);

// 2. RUTAS DINÁMICAS (Siempre van abajo del todo)
router.get('/:id/pdf', getPedidoPdf);
router.get('/:id', getPedidoById);

export default router;