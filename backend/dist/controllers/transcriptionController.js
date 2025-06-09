"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Transcription_1 = __importDefault(require("../models/mongo/Transcription"));
class TranscriptionController {
    async getTranscription(req, res) {
        try {
            const transcription = await Transcription_1.default.findOne({
                voicemailId: req.params.voicemailId,
            });
            if (transcription) {
                res.status(200).json(transcription);
            }
            else {
                res.status(404).json({ message: 'Transcription not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getTranscriptions(req, res) {
        try {
            const transcriptions = await Transcription_1.default.find();
            res.status(200).json(transcriptions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new TranscriptionController();
//# sourceMappingURL=transcriptionController.js.map