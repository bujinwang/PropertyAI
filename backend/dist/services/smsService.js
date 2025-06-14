"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
const sendSms = async (to, body) => {
    await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
    });
};
exports.sendSms = sendSms;
//# sourceMappingURL=smsService.js.map