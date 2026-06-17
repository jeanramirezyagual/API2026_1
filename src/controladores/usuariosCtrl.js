import crypto from 'crypto';
import { conmysql } from '../db.js';

export const crearUsuario = async (req, res) => {

    try {

        const {
            usr_usuario,
            usr_clave,
            usr_nombre,
            usr_telefono,
            usr_correo
        } = req.body;

        const claveEncriptada = crypto
            .createHash('sha256')
            .update(usr_clave)
            .digest('hex');

        const [result] = await conmysql.query(
            `INSERT INTO usuarios
            (
                usr_usuario,
                usr_clave,
                usr_nombre,
                usr_telefono,
                usr_correo,
                usr_activo
            )
            VALUES (?, ?, ?, ?, ?, 1)`,
            [
                usr_usuario,
                claveEncriptada,
                usr_nombre,
                usr_telefono,
                usr_correo
            ]
        );

        res.json({
            mensaje: 'Usuario creado',
            id: result.insertId
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error al crear usuario'
        });

    }

};