import { conmysql } from '../db.js';

export const getProductos = async (req, res) => {
    try {
        const [result] = await conmysql.query('SELECT * FROM productos');
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al consultar productos' });
    }
};

export const createProducto = async (req, res) => {
    try {
        console.log("BODY RECIBIDO:", req.body);
        console.log("FILES RECIBIDOS:", req.files); // Para monitoreo en consola

        const {
            prod_codigo,
            prod_nombre,
            prod_stock,
            prod_precio,
            prod_activo
        } = req.body;

        // Validar campos requeridos
        if (!prod_codigo || !prod_nombre || prod_stock === undefined || !prod_precio) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['prod_codigo', 'prod_nombre', 'prod_stock', 'prod_precio']
            });
        }

        // --- CORRECCIÓN: Capturar la URL de Cloudinary desde req.files ---
        let urlImagen = null;
        if (req.files && req.files['prod_imagen'] && req.files['prod_imagen'][0]) {
            // Cloudinary con Multer suele inyectar la URL final en .path o .secure_url
            urlImagen = req.files['prod_imagen'][0].path || req.files['prod_imagen'][0].secure_url;
        }

        const [result] = await conmysql.query(
            `INSERT INTO productos
            (prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo, prod_imagen)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                prod_codigo,
                prod_nombre,
                prod_stock,
                prod_precio,
                prod_activo || 1,
                urlImagen // Guardamos la URL de Cloudinary
            ]
        );

        // --- CORRECCIÓN FRONTEND: Estructurar la respuesta como espera Ionic ---
        res.json({
            message: 'Producto creado correctamente',
            producto: {
                prod_id: result.insertId,
                prod_codigo,
                prod_nombre,
                prod_stock,
                prod_precio,
                prod_activo: prod_activo || 1,
                prod_imagen: urlImagen
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al insertar producto',
            error: error.message
        });
    }
};

export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            prod_codigo,
            prod_nombre,
            prod_stock,
            prod_precio,
            prod_activo
        } = req.body;

        // Verificar que el producto existe
        const [producto] = await conmysql.query(
            'SELECT prod_imagen FROM productos WHERE prod_id = ?',
            [id]
        );

        if (producto.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        // --- CORRECCIÓN: Verificar si se subió una nueva imagen a Cloudinary ---
        let imagenFinal = producto[0].prod_imagen; // Dejar la anterior por defecto
        
        if (req.files && req.files['prod_imagen'] && req.files['prod_imagen'][0]) {
            imagenFinal = req.files['prod_imagen'][0].path || req.files['prod_imagen'][0].secure_url;
        }

        const [result] = await conmysql.query(
            `UPDATE productos SET
            prod_codigo=?,
            prod_nombre=?,
            prod_stock=?,
            prod_precio=?,
            prod_activo=?,
            prod_imagen=?
            WHERE prod_id=?`,
            [
                prod_codigo,
                prod_nombre,
                prod_stock,
                prod_precio,
                prod_activo,
                imagenFinal,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: 'No se pudo actualizar el producto'
            });
        }

        // --- CORRECCIÓN FRONTEND: Estructurar la respuesta como espera Ionic ---
        res.json({
            message: 'Producto actualizado correctamente',
            producto: {
                prod_id: Number(id),
                prod_codigo,
                prod_nombre,
                prod_stock,
                prod_precio,
                prod_activo,
                prod_imagen: imagenFinal
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

export const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        await conmysql.query(
            'DELETE FROM productos WHERE prod_id=?',
            [id]
        );

        res.json({ message: 'Producto eliminado correctamente' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
};