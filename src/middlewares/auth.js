import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    // Captura el token que viene en los headers de la petición HTTP
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Separa el texto "Bearer TOKEN"

    if (!token) {
        return res.status(403).json({ mensaje: 'Acceso denegado: Token no proporcionado' });
    }

    try {
        // Verifica si el token es real y no ha expirado
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // Guarda los datos del usuario dentro de la petición
        next(); // ¡Todo bien! Continúa al controlador (ej. getClientes)
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};