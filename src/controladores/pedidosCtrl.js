import { conmysql as db } from '../db.js'; 

export const crearPedido = async (req, res) => {
    const { cli_id, usr_id, ped_estado = 'Pendiente', detalles } = req.body;

    if (!cli_id || !usr_id || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({
            ok: false,
            message: 'Faltan datos del pedido o el arreglo de detalles está vacío'
        });
    }

    try {
        await db.query('START TRANSACTION');

        const ped_fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const sqlPedido = 'INSERT INTO pedidos (cli_id, usr_id, ped_fecha, ped_estado) VALUES (?, ?, ?, ?)';
        const [resultadoPedido] = await db.query(sqlPedido, [Number(cli_id), Number(usr_id), ped_fecha, ped_estado]);

        const ped_id = resultadoPedido.insertId;

        const valoresDetalles = detalles.map(d => [
            Number(d.prod_id),
            Number(ped_id),
            Number(d.det_cantidad),
            Number(d.det_precio)
        ]);

        const sqlDetalle = 'INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES ?';
        await db.query(sqlDetalle, [valoresDetalles]);

        await db.query('COMMIT');

        return res.status(201).json({
            ok: true,
            message: 'Pedido registrado con éxito en la base de datos',
            ped_id
        });

    } catch (error) {
       try {
        await db.query('ROLLBACK');
    } catch {}

    console.error(error);

    return res.status(500).json({
        ok: false,
        mensaje: "Error al guardar pedido",
        error: error.message,
        stack: error.stack
    });
    }
};