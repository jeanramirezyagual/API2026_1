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

        console.log("BODY RECIBIDO:");
        console.log(req.body);

        const {
            prod_codigo,
            prod_nombre,
            prod_stock,
            prod_precio,
            prod_activo,
            prod_imagen
        } = req.body;

        // Validar campos requeridos
        if (!prod_codigo || !prod_nombre || prod_stock === undefined || !prod_precio) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['prod_codigo', 'prod_nombre', 'prod_stock', 'prod_precio']
            });
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
                prod_imagen || null
            ]
        );

        res.json({
            message: 'Producto creado correctamente',
            id: result.insertId
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
            prod_activo,
            prod_imagen
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

        const imagenFinal =
            prod_imagen || producto[0].prod_imagen;

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

        res.json({
            message: 'Producto actualizado correctamente'
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