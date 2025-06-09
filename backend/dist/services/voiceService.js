"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertVoiceToText = exports.makeCall = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
const makeCall = async (to, from, url) => {
    await client.calls.create({
        url,
        to,
        from,
    });
};
exports.makeCall = makeCall;
const convertVoiceToText = async (audioBuffer) => {
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient();
    const audio = {
        content: audioBuffer.toString('base64'),
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
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join('\n');
    return transcription;
};
exports.convertVoiceToText = convertVoiceToText;
//# sourceMappingURL=voiceService.js.map