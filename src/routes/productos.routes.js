import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

const router = Router();

router.post(
    '/productos',
    upload.single('imagen'),
    createProducto
);

router.put(
  '/productos/:id',
  upload.single('imagen'),
  updateProducto
);
router.get('/productos', getProductos);
router.delete('/productos/:id', deleteProducto);

export default router;