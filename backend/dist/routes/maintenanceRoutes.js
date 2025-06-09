"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenanceController_1 = __importDefault(require("../controllers/maintenanceController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, maintenanceController_1.default.getAllMaintenanceRequests);
router.post('/', authMiddleware_1.authMiddleware.protect, maintenanceController_1.default.createMaintenanceRequest);
router.get('/:id', authMiddleware_1.authMiddleware.protect, maintenanceController_1.default.getMaintenanceRequestById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, maintenanceController_1.default.updateMaintenanceRequest);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, maintenanceController_1.default.deleteMaintenanceRequest);
exports.default = router;
//# sourceMappingURL=maintenanceRoutes.js.map