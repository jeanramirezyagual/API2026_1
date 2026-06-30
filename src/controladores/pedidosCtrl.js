import { conmysql as db } from '../db.js';

export const crearPedido = async (req, res) => {
    const { cli_id, usr_id, ped_estado = 'Pendiente', detalles } = req.body;

    if (!cli_id || !usr_id || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({
            ok: false,
            message: 'Faltan datos del pedido o el arreglo de detalles está vacío',
        });
    }

    const detallesValidos = detalles.every((detalle) =>
        detalle && detalle.prod_id && detalle.det_cantidad != null && detalle.det_precio != null
    );

    if (!detallesValidos) {
        return res.status(400).json({
            ok: false,
            message: 'Cada detalle debe contener prod_id, det_cantidad y det_precio',
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const ped_fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const sqlPedido = 'INSERT INTO pedidos (cli_id, usr_id, ped_fecha, ped_estado) VALUES (?, ?, ?, ?)';
        const [resultadoPedido] = await connection.query(sqlPedido, [
            Number(cli_id),
            Number(usr_id),
            ped_fecha,
            ped_estado,
        ]);

        const ped_id = resultadoPedido.insertId;

        const valoresDetalles = detalles.map((d) => [
            Number(d.prod_id),
            Number(ped_id),
            Number(d.det_cantidad),
            Number(d.det_precio),
        ]);

        const sqlDetalle = 'INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES ?';
        await connection.query(sqlDetalle, [valoresDetalles]);

        await connection.commit();

        return res.status(201).json({
            ok: true,
            message: 'Pedido registrado con éxito en la base de datos',
            ped_id,
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error al hacer rollback de la transacción:', rollbackError);
        }

        console.error('Error al crear pedido:', error);
        return res.status(500).json({
            ok: false,
            message: 'No se pudo guardar el pedido',
            error: error.message,
        });
    } finally {
        connection.release();
    }
};