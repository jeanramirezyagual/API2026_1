import { conmysql } from '../db.js';
import PDFDocument from 'pdfkit';
import { messaging } from '../firebase.js';

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
                `INSERT INTO clientes (cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad) VALUES (?,?,?,?,?,?,?)`,
                [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad]
            );
            idCliente = cliente.insertId;
        }

        const [pedido] = await conexion.query(
            `INSERT INTO pedidos (cli_id, ped_fecha, usr_id, ped_estado) VALUES (?, ?, ?, ?)`,
            [idCliente, ped_fecha, usr_id, ped_estado]
        );
        const ped_id = pedido.insertId;

        for (const item of detalle) {
            if (Number(item.det_cantidad) <= 0) throw new Error(`Cantidad inválida.`);
            if (Number(item.det_precio) <= 0) throw new Error(`Precio inválido.`);

            const [producto] = await conexion.query("SELECT prod_id FROM productos WHERE prod_id=?", [item.prod_id]);
            if (producto.length === 0) throw new Error(`El producto no existe.`);

            await conexion.query(
                `INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES (?,?,?,?)`,
                [item.prod_id, ped_id, item.det_cantidad, item.det_precio]
            );
        }
        
        await conexion.commit();

        // ==========================================================
        // 🚀 ENVIAR NOTIFICACIÓN PUSH REAL AL ADMINISTRADOR
        // ==========================================================
        try {
            const tokenAdmin = process.env.TOKEN_ADMIN_REDMI;

            if (tokenAdmin && messaging) {
                console.log(`[Push Notification] Disparando alerta de nuevo pedido #${ped_id} para el Administrador.`);
                
                const mensajePush = {
                    notification: {
                        title: '¡Nueva Venta Registrada! 💰',
                        body: `El cliente ${cli_nombre || 'General'} ha creado el pedido #${ped_id}.`
                    },
                    android: {
                        notification: {
                            sound: 'default',
                            status_icon: 'stock_ticker_update',
                            color: '#7e57c2'
                        }
                    },
                    token: tokenAdmin
                };

                // Envío asíncrono en segundo plano
                messaging.send(mensajePush)
                    .then((resp) => console.log('✅ Push enviado con éxito tras compra:', resp))
                    .catch((err) => console.error('❌ Error al despachar Push en compra:', err.message));
            } else {
                console.log('[Push Notification] Envío omitido: TOKEN_ADMIN_REDMI no configurado en .env o Firebase no listo.');
            }
        } catch (pushErr) {
            console.error("Error al estructurar la notificación push, pero el pedido se guardó:", pushErr.message);
        }
        // ==========================================================

        res.status(201).json({
            ok: true,
            mensaje: "Pedido registrado correctamente.",
            ped_id,
            cli_id: idCliente
        });

    } catch (error) {
        await conexion.rollback();
        console.error(error);
        res.status(500).json({ ok: false, mensaje: error.message });
    } finally {
        conexion.release();
    }
};
export const getPedidoPdf = async (req, res) => {
    const { id } = req.params;
    const tokenAsociado = req.query.token;

    if (!tokenAsociado) {
        return res.status(401).json({ ok: false, mensaje: 'Acceso denegado. Token no provisto.' });
    }

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

        const [detalle] = await conmysql.query(
            `SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen, pr.prod_precio AS prod_precio_base
             FROM pedidos_detalle d
             LEFT JOIN productos pr ON d.prod_id = pr.prod_id
             WHERE d.ped_id = ?`,
            [id]
        );

        const pedido = pedidoResult[0];

        // 🛡️ SOLUCIÓN AL PRIMER ERROR: Validamos de forma segura el estado del pedido
        // Si es un número, lo vuelve String. Si es null/undefined, pone 'PENDIENTE'
        const estadoTexto = pedido.ped_estado !== null && pedido.ped_estado !== undefined 
            ? String(pedido.ped_estado).toUpperCase() 
            : 'PENDIENTE';

        // Configurar las cabeceras HTTP ANTES de inicializar PDFKit
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Pedido_${id}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        
        // 🛡️ SOLUCIÓN AL SEGUNDO ERROR: Manejamos fallos internos del stream del PDF
        doc.on('error', (err) => {
            console.error('Error interno en el stream de PDFKit:', err);
            if (!res.headersSent) {
                res.status(500).send('Error al generar el archivo PDF.');
            }
        });

        doc.pipe(res); 

        // DISEÑO DEL COMPROBANTE
        doc.fontSize(22).text('TIENDA TECNOLÓGICA', { align: 'center' });
        doc.fontSize(14).text(`COMPROBANTE DE PEDIDO #${pedido.ped_id}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(`Fecha: ${pedido.ped_fecha ? new Date(pedido.ped_fecha).toLocaleString() : 'No registra'}`);
        doc.text(`Estado: ${estadoTexto}`); // <-- Usamos la variable segura aquí
        doc.text(`Cliente: ${pedido.cli_nombre || 'Cliente General'}`);
        doc.text(`Identificación: ${pedido.cli_identificacion || 'S/N'}`);
        if (pedido.cli_telefono) doc.text(`Teléfono: ${pedido.cli_telefono}`);
        if (pedido.cli_correo) doc.text(`Correo: ${pedido.cli_correo}`);
        doc.moveDown();

        doc.text('-----------------------------------------------------------------------------------------------------');
        doc.fontSize(12).text('DETALLE DE PRODUCTOS:', { underline: true });
        doc.moveDown(0.5);

        let totalGeneral = 0;
        detalle.forEach((item) => {
            const cantidad = Number(item.det_cantidad) || 0;
            const precio = Number(item.det_precio) || 0;
            const subtotal = cantidad * precio;
            totalGeneral += subtotal;

            doc.fontSize(11).text(`${item.prod_nombre || 'Producto Desconocido'} [Cód: ${item.prod_codigo || 'S/C'}]`);
            doc.fontSize(10).text(`   Cantidad: ${cantidad}   x   Precio: $${precio.toFixed(2)}   =   Subtotal: $${subtotal.toFixed(2)}`);
            doc.moveDown(0.3);
        });

        doc.text('-----------------------------------------------------------------------------------------------------');
        doc.moveDown(0.5);
        doc.fontSize(14).text(`TOTAL PAGADO: $${totalGeneral.toFixed(2)}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        
        // 🛡️ Solo intentamos responder si el stream no ha enviado ya cabeceras al cliente
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ ok: false, mensaje: 'Error interno al generar el PDF' });
        }
    }
};
export const testPushNotification = async (req, res) => {
    const { tokenAdmin } = req.body; 

    if (!tokenAdmin) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el token del dispositivo' });
    }

    const mensaje = {
        notification: {
            title: '¡Venta Registrada! 💰',
            body: 'El pedido #1044 ha sido guardado con éxito por el cliente.'
        },
        android: {
            notification: {
                sound: 'default',
                status_icon: 'stock_ticker_update',
                color: '#7e57c2'
            }
        },
        token: tokenAdmin // Dirección de tu Redmi 15C
    };

    try {
        const response = await messaging.send(mensaje);
        res.json({ ok: true, mensaje: 'Notificación enviada con éxito', response });
    } catch (error) {
        console.error('Error al enviar push:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
};