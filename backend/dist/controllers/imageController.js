"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadListingImage = void 0;
const dbManager_1 = require("../utils/dbManager");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const imageService_1 = __importDefault(require("../services/imageService"));
const uploadListingImage = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const file = req.file;
        if (!file) {
            return next(new errorMiddleware_1.AppError('No image file provided', 400));
        }
        const optimizedImage = await imageService_1.default.enhanceAndOptimize(file);
        const image = await dbManager_1.prisma.listingImage.create({
            data: {
                listingId,
                url: optimizedImage.url,
                isFeatured: req.body.isFeatured || false,
            },
        });
        res.status(201).json(image);
    }
    catch (error) {
        next(error);
    }
};
exports.uploadListingImage = uploadListingImage;
//# sourceMappingURL=imageController.js.map