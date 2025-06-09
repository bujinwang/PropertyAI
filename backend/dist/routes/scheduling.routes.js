"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheduling_controller_1 = require("../controllers/scheduling.controller");
const router = (0, express_1.Router)();
router.post('/schedule/:workOrderId', scheduling_controller_1.schedulingController.scheduleEvent);
exports.default = router;
//# sourceMappingURL=scheduling.routes.js.map