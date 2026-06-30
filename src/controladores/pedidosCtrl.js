import { conmysql } from '../db.js';

export const getPedidos = async (req, res) => {
    try {
        const [pedidos] = await conmysql.query('SELECT * FROM pedidos');
        return res.json({ ok: true, pedidos });
    } catch (error) {
        console.error('Error al consultar pedidos:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error al consultar pedidos' });
    }
};

export const getPedidoById = async (req, res) => {
    const { id } = req.params;

    try {
        const [pedidoResult] = await conmysql.query('SELECT * FROM pedidos WHERE ped_id = ?', [id]);

        if (pedidoResult.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
        }

        const [detalle] = await conmysql.query('SELECT * FROM pedidos_detalle WHERE ped_id = ?', [id]);

        return res.json({ ok: true, pedido: pedidoResult[0], detalle });
    } catch (error) {
        console.error('Error al consultar pedido por id:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error al consultar el pedido' });
    }
};

export const guardarPedido = async (req, res) => {
    const conexion = await conmysql.getConnection();

    try {
        await conexion.beginTransaction();
        const {
            cli_id,
            cli_identificacion,
            cli_nombre,
            cli_telefono,
            cli_correo,
            cli_direccion,
            cli_pais,
            cli_ciudad,
            ped_fecha,
            usr_id,
            ped_estado,
            detalle
        } = req.body;
        // Validaciones
        if (!detalle || detalle.length === 0) {
            throw new Error("El pedido no tiene productos.");
        }
        let idCliente = Number(cli_id);
        // Cliente nuevo
        if (idCliente === 0) {

            const [cliente] = await conexion.query(
                `INSERT INTO clientes
                (
                    cli_identificacion,
                    cli_nombre,
                    cli_telefono,
                    cli_correo,
                    cli_direccion,
                    cli_pais,
                    cli_ciudad
                )
                VALUES (?,?,?,?,?,?,?)`,
                [
                    cli_identificacion,
                    cli_nombre,
                    cli_telefono,
                    cli_correo,
                    cli_direccion,
                    cli_pais,
                    cli_ciudad
                ]
            );

            idCliente = cliente.insertId;
        }
        // Pedido
        const [pedido] = await conexion.query(
            `INSERT INTO pedidos
            (
                cli_id,
                ped_fecha,
                usr_id,
                ped_estado
            )
            VALUES (?,?,?,?)`,
            [
                idCliente,
                ped_fecha,
                usr_id,
                ped_estado
            ]
        );
        const ped_id = pedido.insertId;
        // Detalle
        for (const item of detalle) {
            if (Number(item.det_cantidad) <= 0) {
                throw new Error(`Cantidad inválida del producto ${item.prod_id}`);
            }
            if (Number(item.det_precio) <= 0) {
                throw new Error(`Precio inválido del producto ${item.prod_id}`);
            }
            // Verificar existencia del producto
            const [producto] = await conexion.query(
                "SELECT prod_id FROM productos WHERE prod_id=?",
                [item.prod_id]
            );
            if (producto.length === 0) {
                throw new Error(`El producto ${item.prod_id} no existe.`);
            }
            await conexion.query(
                `INSERT INTO pedidos_detalle
                (
                    prod_id,
                    ped_id,
                    det_cantidad,
                    det_precio
                )
                VALUES (?,?,?,?)`,
                [
                    item.prod_id,
                    ped_id,
                    item.det_cantidad,
                    item.det_precio
                ]
            );
        }
        await conexion.commit();
        res.status(201).json({
            ok: true,
            mensaje: "Pedido registrado correctamente.",
            ped_id,
            cli_id: idCliente
        });

    } catch (error) {
        await conexion.rollback();
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    } finally {
        conexion.release();
    }

};
 