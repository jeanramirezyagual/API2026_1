import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

const router = Router();

router.get('/productos', getProductos);
router.post('/productos', upload.single('prod_imagen'), createProducto);
router.put('/productos/:id', upload.single('prod_imagen'), updateProducto);
router.delete('/productos/:id', deleteProducto);

export default router;