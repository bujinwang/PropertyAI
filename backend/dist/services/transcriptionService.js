"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sttService_1 = __importDefault(require("./sttService"));
const Transcription_1 = __importDefault(require("../models/mongo/Transcription"));
class TranscriptionService {
    constructor(aiOrchestrationService) {
        this.aiOrchestrationService = aiOrchestrationService;
    }
    async transcribe(filePath, voicemailId) {
        try {
            const transcriptionResult = await sttService_1.default.transcribe(filePath);
            const transcription = new Transcription_1.default({
                voicemailId,
                transcript: transcriptionResult,
                languageCode: 'en-US',
                confidence: 0.9, // This is a placeholder
                words: [], // This is a placeholder
                status: 'completed',
            });
            await transcription.save();
            return transcription;
        }
        catch (error) {
            console.error(`Error transcribing ${filePath}:`, error);
            const transcription = new Transcription_1.default({
                voicemailId,
                status: 'failed',
                errorMessage: error.message,
            });
            await transcription.save();
            throw error;
        }
    }
}
exports.default = TranscriptionService;
//# sourceMappingURL=transcriptionService.js.map