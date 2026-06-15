import { Router } from 'express';

import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

const router = Router();

router.get('/productos', getProductos);
router.post('/productos', createProducto);
router.put('/productos/:id', updateProducto);
router.delete('/productos/:id', deleteProducto);

export default router;