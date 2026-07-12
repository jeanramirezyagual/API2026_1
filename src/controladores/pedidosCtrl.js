import { conmysql } from '../db.js';
import PDFDocument from 'pdfkit';
export const getPedidos = async (req, res) => {
    try {
        const [pedidos] = await conmysql.query(
            `SELECT p.*, c.cli_nombre, c.cli_identificacion, c.cli_telefono, c.cli_correo
             FROM pedidos p
             LEFT JOIN clientes c ON p.cli_id = c.cli_id`
        );

        // SE AGREGÓ: pr.prod_imagen AQUÍ
        const [detalles] = await conmysql.query(
            `SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen, pr.prod_precio AS prod_precio_base
             FROM pedidos_detalle d
             LEFT JOIN productos pr ON d.prod_id = pr.prod_id`
        );

        const detallesPorPedido = detalles.reduce((acc, detalle) => {
            if (!acc[detalle.ped_id]) acc[detalle.ped_id] = [];
            acc[detalle.ped_id].push(detalle);
            return acc;
        }, {});

        const pedidosConDetalles = pedidos.map((pedido) => ({
            ...pedido,
            cliente: {
                cli_nombre: pedido.cli_nombre,
                cli_identificacion: pedido.cli_identificacion,
                cli_telefono: pedido.cli_telefono,
                cli_correo: pedido.cli_correo,
            },
            detalle: detallesPorPedido[pedido.ped_id] || []
        }));

        return res.json({ ok: true, pedidos: pedidosConDetalles });
    } catch (error) {
        console.error('Error al consultar pedidos:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error al consultar pedidos' });
    }
};

export const getPedidoById = async (req, res) => {
    const { id } = req.params;

    try {
        const [pedidoResult] = await conmysql.query(
            `SELECT p.*, c.cli_nombre, c.cli_identificacion, c.cli_telefono, c.cli_correo
             FROM pedidos p
             LEFT JOIN clientes c ON p.cli_id = c.cli_id
             WHERE p.ped_id = ?`,
            [id]
        );

        if (pedidoResult.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
        }

        // SE AGREGÓ: pr.prod_imagen TAMBIÉN AQUÍ
        const [detalle] = await conmysql.query(
            `SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen, pr.prod_precio AS prod_precio_base
             FROM pedidos_detalle d
             LEFT JOIN productos pr ON d.prod_id = pr.prod_id
             WHERE d.ped_id = ?`,
            [id]
        );

        const pedido = {
            ...pedidoResult[0],
            cliente: {
                cli_nombre: pedidoResult[0].cli_nombre,
                cli_identificacion: pedidoResult[0].cli_identificacion,
                cli_telefono: pedidoResult[0].cli_telefono,
                cli_correo: pedidoResult[0].cli_correo,
            },
            detalle
        };

        return res.json({ ok: true, pedido });
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

        if (!detalle || detalle.length === 0) {
            throw new Error("El pedido no tiene productos.");
        }
        let idCliente = Number(cli_id);

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

        const [pedido] = await conexion.query(
            `INSERT INTO pedidos
            (
                cli_id,
                ped_fecha,
                usr_id,
                ped_estado
            )
            VALUES (?, ?, ?, ?)`,
            [
                idCliente,
                ped_fecha,
                usr_id,
                ped_estado
            ]
        );
        const ped_id = pedido.insertId;

        for (const item of detalle) {
            if (Number(item.det_cantidad) <= 0) {
                throw new Error(`Cantidad inválida del producto ${item.prod_id}`);
            }
            if (Number(item.det_precio) <= 0) {
                throw new Error(`Precio inválido del producto ${item.prod_id}`);
            }

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
export const getPedidoPdf = async (req, res) => {
    const { id } = req.params;

    try {
        // Reutilizamos tu consulta exacta para traer los datos del pedido y el cliente
        const [pedidoResult] = await conmysql.query(
            `SELECT p.*, c.cli_nombre, c.cli_identificacion, c.cli_telefono, c.cli_correo
             FROM pedidos p
             LEFT JOIN clientes c ON p.cli_id = c.cli_id
             WHERE p.ped_id = ?`,
            [id]
        );

        if (pedidoResult.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
        }

        // Reutilizamos tu consulta exacta para los detalles del producto
        const [detalle] = await conmysql.query(
            `SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen, pr.prod_precio AS prod_precio_base
             FROM pedidos_detalle d
             LEFT JOIN productos pr ON d.prod_id = pr.prod_id
             WHERE d.ped_id = ?`,
            [id]
        );

        const pedido = pedidoResult[0];

        // 1. Configurar los encabezados HTTP para que el navegador/Ionic entienda que es un PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Pedido_${id}.pdf`);

        // 2. Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res); // Transmitir el flujo de datos directamente a la respuesta

        // 3. Estructurar el diseño del PDF con los datos reales de tu base de datos
        doc.fontSize(20).text(`COMPROBANTE DE PEDIDO #${pedido.ped_id}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Fecha: ${new Date(pedido.ped_fecha).toLocaleDateString()}`);
        doc.text(`Estado: ${pedido.ped_estado}`);
        doc.text(`Cliente: ${pedido.cli_nombre}`);
        doc.text(`Identificación: ${pedido.cli_identificacion}`);
        if (pedido.cli_telefono) doc.text(`Teléfono: ${pedido.cli_telefono}`);
        if (pedido.cli_correo) doc.text(`Correo: ${pedido.cli_correo}`);
        doc.moveDown();

        doc.text('-------------------------------------------------------------------------');
        doc.fontSize(14).text('Detalle de Productos:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);

        let totalGeneral = 0;
        detalle.forEach((item) => {
            const cantidad = Number(item.det_cantidad);
            const precio = Number(item.det_precio);
            const subtotal = cantidad * precio;
            totalGeneral += subtotal;

            doc.text(`${item.prod_nombre} (${item.prod_codigo || 'S/C'})`);
            doc.text(`   Cant: ${cantidad}   x   Precio: $${precio.toFixed(2)}   =   Subtotal: $${subtotal.toFixed(2)}`);
            doc.moveDown(0.5);
        });

        doc.text('-------------------------------------------------------------------------');
        doc.moveDown(0.5);
        doc.fontSize(14).text(`TOTAL A PAGAR: $${totalGeneral.toFixed(2)}`, { align: 'right' });

        // 4. Finalizar y enviar el archivo
        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno al generar el PDF' });
    }
};