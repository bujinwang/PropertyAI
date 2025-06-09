"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = __importDefault(require("../controllers/auditController"));
const router = (0, express_1.Router)();
router.post('/', auditController_1.default.createEntry);
router.get('/', auditController_1.default.getEntries);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map