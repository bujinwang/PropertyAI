"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const propertyController_1 = __importDefault(require("../controllers/propertyController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, propertyController_1.default.getAllProperties);
router.post('/', authMiddleware_1.authMiddleware.protect, propertyController_1.default.createProperty);
router.get('/:id', authMiddleware_1.authMiddleware.protect, propertyController_1.default.getPropertyById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, propertyController_1.default.updateProperty);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, propertyController_1.default.deleteProperty);
exports.default = router;
//# sourceMappingURL=propertyRoutes.js.map