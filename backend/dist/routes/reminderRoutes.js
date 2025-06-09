"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reminderController_1 = __importDefault(require("../controllers/reminderController"));
const router = (0, express_1.Router)();
router.post('/', reminderController_1.default.sendReminders);
exports.default = router;
//# sourceMappingURL=reminderRoutes.js.map