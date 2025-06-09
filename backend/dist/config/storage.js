"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.configureUpload = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
// Load environment variables
const isProduction = process.env.NODE_ENV === 'production';
const useS3 = isProduction || process.env.USE_S3 === 'true';
// Create local upload directory if it doesn't exist
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Sub-directories for different types of uploads
const propertyImagesDir = path_1.default.join(uploadDir, 'properties');
const unitImagesDir = path_1.default.join(uploadDir, 'units');
const documentsDir = path_1.default.join(uploadDir, 'documents');
const userImagesDir = path_1.default.join(uploadDir, 'users');
// Create sub-directories if they don't exist
[propertyImagesDir, unitImagesDir, documentsDir, userImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
// S3 Configuration
let s3Client = null;
if (useS3) {
    // Initialize S3 client
    s3Client = new client_s3_1.S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
    });
}
// Configuration for different storage types
const storageOptions = {
    s3: {
        bucket: process.env.AWS_S3_BUCKET || 'propertyai-uploads',
        acl: 'public-read',
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        }
    },
    local: {
        destination: uploadDir
    }
};
// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
    var _a;
    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocumentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];
    // Check file type based on upload category
    const category = ((_a = req.params) === null || _a === void 0 ? void 0 : _a.category) || 'images';
    if (category === 'images' || category === 'properties' || category === 'units' || category === 'users') {
        if (allowedImageTypes.includes(file.mimetype)) {
            return cb(null, true);
        }
        else {
            return cb(new Error('Only image files are allowed for this category!'));
        }
    }
    else if (category === 'documents') {
        if ([...allowedImageTypes, ...allowedDocumentTypes].includes(file.mimetype)) {
            return cb(null, true);
        }
        else {
            return cb(new Error('Only image or document files are allowed for this category!'));
        }
    }
    else {
        return cb(new Error('Invalid upload category!'));
    }
};
// Function to generate unique filenames
const generateFilename = (file, category) => {
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    const uniqueId = (0, uuid_1.v4)();
    const timestamp = Date.now();
    return `${category}_${uniqueId}_${timestamp}${fileExtension}`;
};
// Create storage engine based on environment
const createStorageEngine = (category = 'general') => {
    if (useS3 && s3Client) {
        return (0, multer_s3_1.default)({
            s3: s3Client,
            bucket: storageOptions.s3.bucket,
            acl: storageOptions.s3.acl,
            contentType: storageOptions.s3.contentType,
            metadata: storageOptions.s3.metadata,
            key: (req, file, cb) => {
                const filename = generateFilename(file, category);
                cb(null, `${category}/${filename}`);
            }
        });
    }
    else {
        // Local disk storage
        return multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                let destinationDir = uploadDir;
                switch (category) {
                    case 'properties':
                        destinationDir = propertyImagesDir;
                        break;
                    case 'units':
                        destinationDir = unitImagesDir;
                        break;
                    case 'documents':
                        destinationDir = documentsDir;
                        break;
                    case 'users':
                        destinationDir = userImagesDir;
                        break;
                }
                cb(null, destinationDir);
            },
            filename: (req, file, cb) => {
                const filename = generateFilename(file, category);
                cb(null, filename);
            }
        });
    }
};
// Configure multer for different upload types
const configureUpload = (category, maxFileSize = 5 * 1024 * 1024) => {
    return (0, multer_1.default)({
        storage: createStorageEngine(category),
        limits: {
            fileSize: maxFileSize // default 5MB
        },
        fileFilter: fileFilter
    });
};
exports.configureUpload = configureUpload;
// Helper to get full URL for an uploaded file
const getFileUrl = (filename, category) => {
    if (useS3) {
        const bucketName = storageOptions.s3.bucket;
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${bucketName}.s3.${region}.amazonaws.com/${category}/${filename}`;
    }
    else {
        // For local development, use the server's URL
        const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
        return `${serverUrl}/uploads/${category}/${filename}`;
    }
};
exports.getFileUrl = getFileUrl;
// Helper function to delete a file
const deleteFile = async (filename, category) => {
    try {
        if (useS3 && s3Client) {
            // Delete from S3
            const { DeleteObjectCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-s3')));
            const deleteParams = {
                Bucket: storageOptions.s3.bucket,
                Key: `${category}/${filename}`
            };
            await s3Client.send(new DeleteObjectCommand(deleteParams));
        }
        else {
            // Delete from local filesystem
            let filePath = '';
            switch (category) {
                case 'properties':
                    filePath = path_1.default.join(propertyImagesDir, filename);
                    break;
                case 'units':
                    filePath = path_1.default.join(unitImagesDir, filename);
                    break;
                case 'documents':
                    filePath = path_1.default.join(documentsDir, filename);
                    break;
                case 'users':
                    filePath = path_1.default.join(userImagesDir, filename);
                    break;
                default:
                    filePath = path_1.default.join(uploadDir, category, filename);
            }
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return true;
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};
exports.deleteFile = deleteFile;
exports.default = {
    configureUpload: exports.configureUpload,
    getFileUrl: exports.getFileUrl,
    deleteFile: exports.deleteFile,
    isS3Enabled: useS3
};
//# sourceMappingURL=storage.js.map