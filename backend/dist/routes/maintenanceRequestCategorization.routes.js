"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenanceRequestCategorization_controller_1 = require("../controllers/maintenanceRequestCategorization.controller");
const router = (0, express_1.Router)();
router.post('/categorize/:maintenanceRequestId', maintenanceRequestCategorization_controller_1.maintenanceRequestCategorizationController.categorizeRequest);
exports.default = router;
//# sourceMappingURL=maintenanceRequestCategorization.routes.js.map