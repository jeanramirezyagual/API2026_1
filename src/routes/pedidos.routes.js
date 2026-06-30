import { Router } from 'express';
import { guardarPedido, getPedidos, getPedidoById } from '../controladores/pedidosCtrl.js';

const router = Router();

router.post('/', guardarPedido);
router.get('/', getPedidos);
router.get('/:id', getPedidoById);

export default router;
