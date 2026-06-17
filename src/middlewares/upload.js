import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // CAMBIO AQUÍ: Cambiamos 'uploads/' por 'src/uploads/'
        cb(null, 'src/uploads/'); 
    },
    filename: (req, file, cb) => {
        // Genera un nombre único usando la fecha actual + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para asegurarse de que solo se suban imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen válida'), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});