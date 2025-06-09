"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSentiment = void 0;
const sentiment_service_1 = require("../services/sentiment.service");
const analyzeSentiment = async (req, res) => {
    try {
        const { messageId, text } = req.body;
        await sentiment_service_1.sentimentService.analyzeAndSaveSentiment(messageId, text);
        res.status(200).json({ message: 'Sentiment analyzed and saved successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.analyzeSentiment = analyzeSentiment;
//# sourceMappingURL=sentiment.controller.js.map