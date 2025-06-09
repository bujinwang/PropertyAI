"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listingController_1 = __importDefault(require("../controllers/listingController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, listingController_1.default.getAllListings);
router.post('/', authMiddleware_1.authMiddleware.protect, listingController_1.default.createListing);
router.get('/:id', authMiddleware_1.authMiddleware.protect, listingController_1.default.getListingById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, listingController_1.default.updateListing);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, listingController_1.default.deleteListing);
exports.default = router;
//# sourceMappingURL=listingRoutes.js.map