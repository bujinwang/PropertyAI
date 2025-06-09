"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class VoicemailService {
    constructor(watchDir, aiOrchestrationService) {
        this.watchDir = watchDir;
        this.aiOrchestrationService = aiOrchestrationService;
        this.initialize();
    }
    initialize() {
        fs_1.default.watch(this.watchDir, (eventType, filename) => {
            if (eventType === 'rename' && filename) {
                const filePath = path_1.default.join(this.watchDir, filename);
                this.aiOrchestrationService.startTranscriptionWorkflow(filePath);
            }
        });
    }
}
exports.default = VoicemailService;
//# sourceMappingURL=voicemailService.js.map