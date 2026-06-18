import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Configurar tus credenciales de Cloudinary
cloudinary.config({
  cloud_name: 'dx0pp2oup',
  api_key: '317684346948143',
  api_secret: 'EdgPJktTxbESZ5910HyUM7VXM-Q' // <-- Recuerda dar clic en "Reveal" en tu página de Cloudinary y pegarlo aquí
});

// 2. Configurar el almacenamiento directo hacia la nube
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'productos_api', // Nombre de la carpeta que verás en tu panel de Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Filtra los formatos permitidos desde la subida
  },
});

// 3. Mantener tu filtro para asegurar que solo pasen archivos de tipo imagen
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen válida'), false);
    }
};

// 4. Exportamos el middleware 'upload' con la nueva configuración
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Middleware flexible que acepta múltiples nombres de campos posibles
export const uploadImagenFlexible = (req, res, next) => {
    // Intentar primero con .fields() que acepta múltiples nombres
    const uploadMultiple = upload.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'image', maxCount: 1 },
        { name: 'file', maxCount: 1 },
        { name: 'foto', maxCount: 1 },
        { name: 'upload', maxCount: 1 }
    ]);
    
    uploadMultiple(req, res, (err) => {
        if (err) {
            return next(err);
        }
        
        // Normalizar: si el archivo viene en un campo diferente, ponerlo en req.file
        if (!req.file && req.files) {
            const campos = ['imagen', 'image', 'file', 'foto', 'upload'];
            for (const campo of campos) {
                if (req.files[campo] && req.files[campo][0]) {
                    req.file = req.files[campo][0];
                    break;
                }
            }
        }
        
        next();
    });
};