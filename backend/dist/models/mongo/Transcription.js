"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TranscriptionSchema = new mongoose_1.Schema({
    voicemailId: { type: String, required: true, index: true },
    transcript: { type: String, required: true },
    languageCode: { type: String, required: true },
    confidence: { type: Number, required: true },
    words: [
        {
            word: { type: String, required: true },
            startTime: { type: Number, required: true },
            endTime: { type: Number, required: true },
        },
    ],
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    errorMessage: { type: String },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Transcription', TranscriptionSchema);
//# sourceMappingURL=Transcription.js.map