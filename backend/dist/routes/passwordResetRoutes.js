"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passwordResetController_1 = require("../controllers/passwordResetController");
const router = (0, express_1.Router)();
router.post('/forgot-password', passwordResetController_1.forgotPassword);
router.post('/reset-password', passwordResetController_1.resetPassword);
exports.default = router;
//# sourceMappingURL=passwordResetRoutes.js.map