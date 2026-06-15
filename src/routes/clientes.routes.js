import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { login } from '../controladores/authCtrl.js';

import { getClientes, getClientesxid, postInsertarCliente, putCliente, pathCliente, deleteCliente } from '../controladores/clientesCtrl.js';
import { crearUsuario } from '../controladores/usuariosCtrl.js';
const router = Router();

// 1. Ruta pública para que cualquiera pueda intentar loguearse
router.post('/login', login);
router.post('/usuarios', crearUsuario);
// 2. Rutas protegidas (si no envían token válido, Express las rebota antes de llegar al controlador)
router.get('/clientes', verificarToken, getClientes);
router.get('/clientes/:id', verificarToken, getClientesxid);
router.post('/clientes', postInsertarCliente);
router.put('/clientes/:id', putCliente);
router.patch('/clientes/:id', pathCliente);
router.delete('/clientes/:id', deleteCliente);

export default router;