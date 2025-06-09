"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const translation_service_1 = require("../services/translation.service");
const translateText = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        const translatedText = await translation_service_1.translationService.translate(text, targetLanguage);
        res.status(200).json({ translatedText });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.translateText = translateText;
//# sourceMappingURL=translation.controller.js.map