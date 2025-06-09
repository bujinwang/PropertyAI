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
exports.analyzeImage = exports.generatePrice = exports.smartResponse = exports.translate = exports.sentiment = exports.followUp = exports.assessRisk = exports.generateDescription = void 0;
const dbManager_1 = require("../utils/dbManager");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const aiService = __importStar(require("../services/aiService"));
const generateDescription = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { photos, details } = req.body;
        const listing = await dbManager_1.prisma.listing.findUnique({
            where: { id: propertyId },
        });
        if (!listing) {
            return next(new errorMiddleware_1.AppError('Listing not found', 404));
        }
        const description = await aiService.generatePropertyDescription(photos, details);
        await dbManager_1.prisma.listing.update({
            where: { id: propertyId },
            data: { description },
        });
        res.json({ description });
    }
    catch (error) {
        next(error);
    }
};
exports.generateDescription = generateDescription;
const assessRisk = async (req, res, next) => {
    try {
        const { applicantData } = req.body;
        const assessment = await aiService.assessApplicantRisk(applicantData);
        res.json(assessment);
    }
    catch (error) {
        next(error);
    }
};
exports.assessRisk = assessRisk;
const followUp = async (req, res, next) => {
    try {
        const { conversation } = req.body;
        const response = await aiService.generateFollowUp(conversation);
        res.json({ response });
    }
    catch (error) {
        next(error);
    }
};
exports.followUp = followUp;
const sentiment = async (req, res, next) => {
    try {
        const { text } = req.body;
        const sentiment = await aiService.analyzeSentiment(text);
        res.json(sentiment);
    }
    catch (error) {
        next(error);
    }
};
exports.sentiment = sentiment;
const translate = async (req, res, next) => {
    try {
        const { text, targetLanguage } = req.body;
        const translatedText = await aiService.translateText(text, targetLanguage);
        res.json({ translatedText });
    }
    catch (error) {
        next(error);
    }
};
exports.translate = translate;
const smartResponse = async (req, res, next) => {
    try {
        const { message } = req.body;
        const response = await aiService.generateSmartResponse(message);
        res.json({ response });
    }
    catch (error) {
        next(error);
    }
};
exports.smartResponse = smartResponse;
const generatePrice = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const listing = await dbManager_1.prisma.listing.findUnique({
            where: { id: listingId },
            include: { property: true, unit: true },
        });
        if (!listing) {
            return next(new errorMiddleware_1.AppError('Listing not found', 404));
        }
        const price = await aiService.generatePriceRecommendation(listing);
        res.json(price);
    }
    catch (error) {
        next(error);
    }
};
exports.generatePrice = generatePrice;
const analyzeImage = async (req, res, next) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return next(new errorMiddleware_1.AppError('Image URL is required', 400));
        }
        const analysis = await aiService.generateImageAnalysis(imageUrl);
        res.json(analysis);
    }
    catch (error) {
        next(error);
    }
};
exports.analyzeImage = analyzeImage;
//# sourceMappingURL=aiController.js.map