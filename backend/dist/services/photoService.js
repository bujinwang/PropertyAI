"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizePhoto = void 0;
const sharp_1 = __importDefault(require("sharp"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const optimizePhoto = async (inputBuffer, options) => {
    try {
        let transformer = (0, sharp_1.default)(inputBuffer);
        if (options.width || options.height) {
            transformer = transformer.resize(options.width, options.height);
        }
        if (options.format) {
            transformer = transformer.toFormat(options.format, { quality: options.quality || 80 });
        }
        else if (options.quality) {
            transformer = transformer.jpeg({ quality: options.quality });
        }
        return transformer.toBuffer();
    }
    catch (error) {
        throw new errorMiddleware_1.AppError('Failed to optimize photo', 500);
    }
};
exports.optimizePhoto = optimizePhoto;
//# sourceMappingURL=photoService.js.map