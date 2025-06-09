"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const suggestionController_1 = __importDefault(require("../controllers/suggestionController"));
const router = (0, express_1.Router)();
router.get('/', suggestionController_1.default.getSuggestions);
exports.default = router;
//# sourceMappingURL=suggestionRoutes.js.map