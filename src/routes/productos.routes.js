import { Router } from 'express';
import { upload, uploadImagenFlexible } from '../middlewares/upload.js';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controladores/productosCtrl.js';

const router = Router();

router.post(
    '/productos',
    uploadImagenFlexible,
    createProducto
);

router.put(
  '/productos/:id',
  uploadImagenFlexible,
  updateProducto
);
router.get('/productos', getProductos);
router.delete('/productos/:id', deleteProducto);

export default router;