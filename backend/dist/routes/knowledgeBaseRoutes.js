"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledgeBaseController_1 = __importDefault(require("../controllers/knowledgeBaseController"));
const router = (0, express_1.Router)();
router.post('/', knowledgeBaseController_1.default.createEntry);
router.get('/:id', knowledgeBaseController_1.default.getEntry);
router.get('/', knowledgeBaseController_1.default.getEntries);
router.put('/:id', knowledgeBaseController_1.default.updateEntry);
router.delete('/:id', knowledgeBaseController_1.default.deleteEntry);
exports.default = router;
//# sourceMappingURL=knowledgeBaseRoutes.js.map