import { Router } from 'express';
import { guardarPedido, getPedidos, getPedidoById, getPedidoPdf } from '../controladores/pedidosCtrl.js';

const router = Router();

router.post('/', guardarPedido);
router.get('/', getPedidos);
router.get('/:id', getPedidoById);
router.get('/api/pedidos/:id/pdf', getPedidoPdf);
export default router;
