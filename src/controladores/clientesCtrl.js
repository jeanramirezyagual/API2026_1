import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { conmysql } from '../db.js';

export const login = async (req, res) => {

    try {

        const { usuario, password } = req.body;

        console.log("Usuario recibido:", usuario);
        console.log("Password recibida:", password);

        const [rows] = await conmysql.query(
            'SELECT * FROM usuarios WHERE usr_usuario = ?',
            [usuario]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const usuarioDB = rows[0];

        console.log("Password enviada:", password);
        console.log("Password BD:", usuarioDB.usr_clave);

        // Comparación directa
        const hashIngresado = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');

        if (hashIngresado !== usuarioDB.usr_clave) {
            return res.status(401).json({
                mensaje: 'Contraseña incorrecta'
            });
        }

        const payload = {
            id: usuarioDB.usr_id,
            usuario: usuarioDB.usr_usuario,
            nombre: usuarioDB.usr_nombre
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        return res.json({
            mensaje: 'Login correcto',
            token
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensaje: 'Error en el servidor'
        });

    }

};