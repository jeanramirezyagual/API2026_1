import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

const router = Router();

router.post('/productos', createProducto);
router.put('/productos/:id', updateProducto);
router.get('/productos', getProductos);
router.delete('/productos/:id', deleteProducto);

export default router;