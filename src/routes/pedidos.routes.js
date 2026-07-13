import { Router } from 'express';
import { guardarPedido, getPedidos, getPedidoById, getPedidoPdf, testPushNotification } from '../controladores/pedidosCtrl.js';

const router = Router();

router.post('/', guardarPedido);
router.get('/', getPedidos);
router.get('/:id/pdf', getPedidoPdf);
router.get('/:id', getPedidoById);
// Dentro de pedidos.routes.js
router.post('/pedidos/test-push', testPushNotification);
export default router;
