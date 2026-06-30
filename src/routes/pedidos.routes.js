import { Router } from 'express';
import { crearPedido } from '../controladores/pedidosCtrl.js';

const router = Router();

router.post('/', crearPedido);

export default router;
