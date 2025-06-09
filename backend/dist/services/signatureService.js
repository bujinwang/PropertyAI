"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docusign_esign_1 = require("docusign-esign");
class SignatureService {
    constructor() {
        this.apiClient = new docusign_esign_1.DocuSign.ApiClient();
        this.apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH);
        this.apiClient.addDefaultHeader('Authorization', `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`);
    }
    async sendForSignature(documentId, signerEmail, signerName) {
        // This is a placeholder for the actual implementation
        console.log(`Sending document ${documentId} to ${signerName} <${signerEmail}> for signature`);
    }
}
exports.default = new SignatureService();
//# sourceMappingURL=signatureService.js.map