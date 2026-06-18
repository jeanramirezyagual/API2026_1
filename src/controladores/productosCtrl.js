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
        const {
            prod_codigo,
            prod_nombre,
            prod_stock,
            prod_precio,
            prod_activo
        } = req.body;

        // CAMBIO AQUÍ: Cloudinary guarda el enlace completo de internet en path
        let rutaImagen = null;
        if (req.file) {
            rutaImagen = req.file.path; 
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
                prod_activo,
                rutaImagen
            ]
        );

        // RECOMENDACIÓN: Armamos el objeto final para pasárselo a Ionic completo
        const productoCreado = {
            prod_id: result.insertId,
            prod_codigo,
            prod_nombre,
            prod_stock: Number(prod_stock),
            prod_precio: Number(prod_precio),
            prod_activo: Number(prod_activo),
            prod_imagen: rutaImagen
        };

        res.json({
            message: 'Producto creado correctamente',
            producto: productoCreado // <-- Así Ionic actualiza la lista sin parpadear
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al insertar producto' });
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

        // CAMBIO AQUÍ: Si subió foto nueva, se toma req.file.path. Si no, conserva la que vino por body
        let rutaImagen = req.body.prod_imagen; 
        if (req.file) {
            rutaImagen = req.file.path;
        }

        await conmysql.query(
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
                rutaImagen,
                id
            ]
        );

        // Armamos el objeto modificado para responderle a Ionic
        const productoModificado = {
            prod_id: Number(id),
            prod_codigo,
            prod_nombre,
            prod_stock: Number(prod_stock),
            prod_precio: Number(prod_precio),
            prod_activo: Number(prod_activo),
            prod_imagen: rutaImagen
        };

        res.json({ 
            message: 'Producto actualizado correctamente',
            producto: productoModificado 
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al actualizar producto' });
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