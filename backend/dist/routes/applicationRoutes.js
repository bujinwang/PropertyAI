"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applicationController_1 = __importDefault(require("../controllers/applicationController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, applicationController_1.default.getAllApplications);
router.post('/', authMiddleware_1.authMiddleware.protect, applicationController_1.default.createApplication);
router.get('/:id', authMiddleware_1.authMiddleware.protect, applicationController_1.default.getApplicationById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, applicationController_1.default.updateApplication);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, applicationController_1.default.deleteApplication);
exports.default = router;
//# sourceMappingURL=applicationRoutes.js.map