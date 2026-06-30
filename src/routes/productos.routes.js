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
    '/',
    uploadImagenFlexible,
    createProducto
);

router.put(
  '/:id',
  uploadImagenFlexible,
  updateProducto
);
router.get('/', getProductos);
router.delete('/:id', deleteProducto);

export default router;