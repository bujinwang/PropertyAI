"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeoData = void 0;
const client_1 = require("@prisma/client");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const seoService = __importStar(require("../services/seoService"));
const prisma = new client_1.PrismaClient();
const getSeoData = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { property: true, unit: true },
        });
        if (!listing) {
            return next(new errorMiddleware_1.AppError('Listing not found', 404));
        }
        const seoData = seoService.prepareListingSeoData(listing);
        const metaTags = seoService.generateMetaTags(seoData);
        const jsonLd = seoService.generateJsonLd(seoData);
        res.json({
            slug: listing.slug,
            ...metaTags,
            jsonLd,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSeoData = getSeoData;
//# sourceMappingURL=seoController.js.map