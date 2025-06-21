import multer from 'multer';
import { getUser } from '../utils/service.js';

function checkAuth(request, response, next) {
    const token = request.cookies?.uid;
    const userID = getUser(token);
    
    if (!userID) {
        return response.redirect('/auth/login');
    }
    next();
}

function afterLogin(request, response, next) {
    const token = request.cookies?.uid;
    const userID = getUser(token);
    if (userID?.email) {
        return response.redirect('/customer');
    }
    next();
}

function checkSeller(request, response, next) {
    const role = request.cookies?.role;
    if (role !== 'Seller') {
        return response.redirect('/customer');
    }    
    next();
}

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (request, file, cb) => {
        // console.log("storage", file);
        request.fileName = Date.now() + file.originalname;
        // console.log(request.fileName)
        cb(null, request.fileName);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter // apply filter like extnsion type
});

function fileFilter(request, file, cb) {
    const allowedTypes = ['image/jpg', 'image/png', 'image/jpeg'];
    // console.log(file.mimetype)
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

export { upload, checkAuth, afterLogin, checkSeller };