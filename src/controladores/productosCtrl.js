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
        // Extraemos los campos de texto normales desde req.body
        const {
            prod_codigo,
            prod_nombre,
            prod_stock,
            prod_precio,
            prod_activo
        } = req.body;

        // Validamos si efectivamente viene un archivo en la petición
        let rutaImagen = null;
        if (req.file) {
            // Guarda el formato exacto que tienes en tu BD: /uploads/nombre-archivo.jpg
            rutaImagen = `/uploads/${req.file.filename}`;
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
                rutaImagen // Pasamos la ruta construida del archivo físico
            ]
        );

        res.json({
            message: 'Producto creado correctamente',
            id: result.insertId,
            prod_imagen: rutaImagen
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

        // Si suben una nueva imagen en la edición, la procesamos. 
        // Si no suben nada, mantenemos la que pasen por texto o puedes optimizar la query según necesites.
        let rutaImagen = req.body.prod_imagen; 
        if (req.file) {
            rutaImagen = `/uploads/${req.file.filename}`;
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

        res.json({ message: 'Producto actualizado correctamente' });

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