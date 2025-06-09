"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transcriptionController_1 = __importDefault(require("../controllers/transcriptionController"));
const router = (0, express_1.Router)();
router.get('/:voicemailId', transcriptionController_1.default.getTranscription);
router.get('/', transcriptionController_1.default.getTranscriptions);
exports.default = router;
//# sourceMappingURL=transcriptionRoutes.js.map