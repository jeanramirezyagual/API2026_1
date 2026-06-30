import { Router } from 'express';
import { guardarPedido } from '../controladores/pedidosCtrl.js';

const router = Router();

router.post('/', guardarPedido);

export default router;
