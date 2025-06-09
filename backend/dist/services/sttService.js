"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const speech_1 = require("@google-cloud/speech");
const fs_1 = __importDefault(require("fs"));
class SttService {
    constructor() {
        this.client = new speech_1.SpeechClient();
    }
    async transcribe(filePath) {
        var _a, _b;
        const file = fs_1.default.readFileSync(filePath);
        const audioBytes = file.toString('base64');
        const audio = {
            content: audioBytes,
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
        };
        const request = {
            audio: audio,
            config: config,
        };
        const [response] = await this.client.recognize(request);
        const transcription = (_b = (_a = response.results) === null || _a === void 0 ? void 0 : _a.map((result) => { var _a, _b; return (_b = (_a = result.alternatives) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript; }).join('\n')) !== null && _b !== void 0 ? _b : '';
        return transcription;
    }
}
exports.default = new SttService();
//# sourceMappingURL=sttService.js.map